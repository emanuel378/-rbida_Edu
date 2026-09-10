import jsPDF from 'jspdf'
import type { Question } from '../../courses/data/mock'
import type { Caderno } from '../data/notebookTypes'

const PAGE_MARGIN = 15
const LETTERS = ['A', 'B', 'C', 'D', 'E']
const IMAGE_FALLBACK_TEXT = '[Ver material da questão na plataforma]'

// Imagem de fundo (papel timbrado) aplicada em todas as páginas do PDF.
// Basta colocar o arquivo em `public/` com esse nome — se não existir, o PDF
// sai sem fundo, sem quebrar a exportação. Ideal: PNG/JPG em proporção A4
// retrato (ex.: 1240x1754 px), com margens internas livres para o conteúdo.
const PDF_BACKGROUND_URL = '/caderno-pdf-bg.png'

// Melhor esforço: converte a URL de uma imagem (Supabase Storage) em data URL
// para embutir no PDF. Se a busca falhar (rede/CORS), retorna null e quem
// chamou desenha um texto de fallback em vez de interromper a exportação.
const fetchAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

const imageFormatFromDataUrl = (dataUrl: string): string => {
  const match = /^data:image\/(png|jpe?g|webp)/i.exec(dataUrl)
  const ext = match?.[1]?.toUpperCase() ?? 'JPEG'
  return ext === 'JPG' ? 'JPEG' : ext
}

export async function generateNotebookPdf(notebook: Caderno, questions: Question[]): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const contentWidth = pageWidth - PAGE_MARGIN * 2
  let y = PAGE_MARGIN

  // Fundo/papel timbrado (melhor esforço): busca uma vez e repinta em cada página.
  const backgroundDataUrl = await fetchAsDataUrl(PDF_BACKGROUND_URL)
  const backgroundFormat = backgroundDataUrl ? imageFormatFromDataUrl(backgroundDataUrl) : null
  const paintBackground = () => {
    if (!backgroundDataUrl || !backgroundFormat) return
    try {
      doc.addImage(backgroundDataUrl, backgroundFormat, 0, 0, pageWidth, pageHeight, undefined, 'FAST')
    } catch {
      /* fundo é opcional — ignora falha e segue com página em branco */
    }
  }
  const addPage = () => {
    doc.addPage()
    paintBackground()
    y = PAGE_MARGIN
  }

  paintBackground()

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - PAGE_MARGIN) {
      addPage()
    }
  }

  // Cabeçalho
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(notebook.title, PAGE_MARGIN, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(110)
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, PAGE_MARGIN, y)
  doc.text(`Total de questões: ${questions.length}`, pageWidth - PAGE_MARGIN, y, { align: 'right' })
  y += 4
  doc.setDrawColor(200)
  doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y)
  y += 8
  doc.setTextColor(20)

  const correctLetters: string[] = []

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    correctLetters.push(LETTERS[q.correctAnswer] ?? '-')

    ensureSpace(14)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`${i + 1}.`, PAGE_MARGIN, y)

    doc.setFont('helvetica', 'normal')
    const enunciadoLines: string[] = doc.splitTextToSize(q.question, contentWidth - 8)
    enunciadoLines.forEach(line => {
      ensureSpace(5.5)
      doc.text(line, PAGE_MARGIN + 7, y)
      y += 5.2
    })
    y += 1

    // Imagem da questão (opcional, melhor esforço)
    if (q.questionImageUrl) {
      const dataUrl = await fetchAsDataUrl(q.questionImageUrl)
      let embedded = false
      if (dataUrl) {
        try {
          const format = imageFormatFromDataUrl(dataUrl)
          const props = doc.getImageProperties(dataUrl)
          const imgWidth = Math.min(contentWidth * 0.7, 90)
          const imgHeight = (props.height / props.width) * imgWidth
          ensureSpace(imgHeight + 4)
          doc.addImage(dataUrl, format, PAGE_MARGIN + 7, y, imgWidth, imgHeight)
          y += imgHeight + 4
          embedded = true
        } catch {
          embedded = false
        }
      }
      if (!embedded) {
        ensureSpace(6)
        doc.setFont('helvetica', 'italic')
        doc.text(IMAGE_FALLBACK_TEXT, PAGE_MARGIN + 7, y)
        doc.setFont('helvetica', 'normal')
        y += 6
      }
    }

    doc.setFontSize(10)
    for (let oi = 0; oi < q.options.length; oi++) {
      const hasImageOnly = !q.options[oi]?.trim() && q.optionImages?.[oi]
      const optionText = hasImageOnly
        ? `${LETTERS[oi] ?? oi + 1}) ${IMAGE_FALLBACK_TEXT}`
        : `${LETTERS[oi] ?? oi + 1}) ${q.options[oi]}`
      const optionLines: string[] = doc.splitTextToSize(optionText, contentWidth - 12)
      optionLines.forEach(line => {
        ensureSpace(5.2)
        doc.text(line, PAGE_MARGIN + 10, y)
        y += 5
      })
    }
    y += 4
  }

  // Gabarito — sempre em página nova, tabela compacta em colunas
  addPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('Gabarito', PAGE_MARGIN, y)
  y += 10

  const columns = 5
  const colWidth = contentWidth / columns
  const rowHeight = 8
  doc.setFontSize(10)
  for (let start = 0; start < correctLetters.length; start += columns) {
    ensureSpace(rowHeight)
    for (let c = 0; c < columns; c++) {
      const idx = start + c
      if (idx >= correctLetters.length) break
      const x = PAGE_MARGIN + c * colWidth
      doc.setFont('helvetica', 'bold')
      doc.text(`${idx + 1}.`, x, y)
      doc.setFont('helvetica', 'normal')
      doc.text(correctLetters[idx], x + 12, y)
    }
    y += rowHeight
  }

  doc.save(`caderno-${notebook.id}.pdf`)
}
