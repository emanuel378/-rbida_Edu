import { useState } from 'react'
import { useQuestionStore } from '../../courses/data/questionStore'
import { useAuthStore } from '../../auth/services/authStore'
import type { Question } from '../../courses/data/mock'
import { getDisciplinaLabel } from '../../courses/data/taxonomy'
import { useCourseStore } from '../../courses/data/courseStore'
import {
  CheckCircle, XCircle, Play, FileText, BarChart3, MessageCircle,
  Flag, Send, X, ZoomIn, HelpCircle,
} from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

function DonutChart({ percentage, size = 120 }: { percentage: number; size?: number }) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
        <circle
          cx={center} cy={center} r={radius} fill="none"
          stroke={percentage >= 60 ? '#22c55e' : percentage >= 40 ? '#eab308' : '#ef4444'}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-lg font-bold text-gray-900">{percentage}%</span>
    </div>
  )
}

function ZoomableImage({ src, alt, className, onZoom }: { src: string; alt: string; className: string; onZoom: (src: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onZoom(src)}
      className="relative inline-block group/img cursor-zoom-in"
    >
      <img src={src} alt={alt} className={className} />
      <span className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-90 drop-shadow" />
      </span>
    </button>
  )
}

function MaterialBlock({ url, onZoom }: { url: string; onZoom: (src: string) => void }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(url) || url.startsWith('data:image')
  const isPdf = /\.pdf($|\?)/i.test(url) || url.startsWith('data:application/pdf')

  if (isImage) {
    return (
      <div className="mt-2">
        <ZoomableImage
          src={url}
          alt="Material de apoio"
          className="max-w-full max-h-[520px] rounded-xl border border-gray-200 object-contain"
          onZoom={onZoom}
        />
      </div>
    )
  }

  if (isPdf) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-5 py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors font-medium text-sm"
      >
        <FileText className="w-5 h-5" />
        Resolução em PDF
      </a>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-5 py-3 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm"
    >
      <FileText className="w-5 h-5" />
      Ver Material de Apoio
    </a>
  )
}

interface Props {
  question: Question
  index?: number
  onAnswered?: () => void
}

export default function QuestionCard({ question, index, onAnswered }: Props) {
  const { user } = useAuthStore()
  const { questionStats, answerHistory, recordAnswer, getQuestionComments, addComment, reportQuestionError } = useQuestionStore()
  const { askQuestionDoubt } = useCourseStore()

  const previousAnswer = answerHistory.find(r => r.questionId === question.id && r.userId === user?.id)

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [justAnswered, setJustAnswered] = useState(false)
  const [liveCorrect, setLiveCorrect] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showDoubt, setShowDoubt] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [reportText, setReportText] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [doubtText, setDoubtText] = useState('')
  const [doubtSent, setDoubtSent] = useState(false)
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  const stats = questionStats.find(s => s.questionId === question.id)
  const overallPercentage = stats && stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
  const comments = getQuestionComments(question.id)

  const disciplinaLabel = getDisciplinaLabel(question.moduleId)
  const hasResolution = !!(question.aulaRelacionada || question.materialUrl)

  const submitAnswer = (answer: number) => {
    if (!user) return
    const correct = answer === question.correctAnswer
    setSelectedAnswer(answer)
    setJustAnswered(true)
    setLiveCorrect(correct)
    onAnswered?.()
    recordAnswer({
      questionId: question.id,
      correct,
      userId: user.id,
      timestamp: new Date().toISOString(),
    }, answer)
  }

  const handleAnswer = () => {
    if (selectedAnswer === null) return
    submitAnswer(selectedAnswer)
  }

  const handleComment = () => {
    if (!commentText.trim() || !user) return
    addComment({
      id: Date.now().toString(),
      questionId: question.id,
      userId: user.id,
      userName: user.name,
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    })
    setCommentText('')
  }

  const handleReport = () => {
    if (!reportText.trim() || !user) return
    reportQuestionError(question.id, user.id, user.name, reportText.trim())
    setReportText('')
    setReportSent(true)
    setTimeout(() => { setReportSent(false); setShowReport(false) }, 2000)
  }

  const handleDoubt = () => {
    if (!doubtText.trim() || !user || !question.moduleId) return
    askQuestionDoubt({
      questionId: question.id,
      moduleId: question.moduleId,
      questionCode: question.code,
      fromUserId: user.id,
      fromUserName: user.name,
      text: doubtText.trim(),
    })
    setDoubtText('')
    setDoubtSent(true)
    setTimeout(() => { setDoubtSent(false); setShowDoubt(false) }, 2000)
  }

  // "revealState" só é true quando o aluno acabou de responder nesta sessão;
  // ao recarregar a página a questão volta ao normal, mantendo só o selo do resultado.
  const revealState = justAnswered
  const answeredCorrectly = justAnswered ? liveCorrect : (previousAnswer?.correct ?? false)
  const showBadge = justAnswered || !!previousAnswer

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {typeof index === 'number' && (
              <span className="w-7 h-7 bg-white/20 text-white rounded-lg flex items-center justify-center text-xs font-bold backdrop-blur-sm">
                {index}
              </span>
            )}
            {question.code && (
              <span className="text-white/80 text-xs font-mono bg-white/10 px-2.5 py-1 rounded-lg">
                {question.code}
              </span>
            )}
            {disciplinaLabel && (
              <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-sm">
                {disciplinaLabel}
              </span>
            )}
            {question.topicId && (
              <span className="px-3 py-1 bg-white/20 text-white rounded-lg text-xs font-medium backdrop-blur-sm">
                {question.topicId}
              </span>
            )}
          </div>
          {showBadge && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${
              answeredCorrectly ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {answeredCorrectly ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              {answeredCorrectly ? 'Resolvi certo' : 'Resolvi errado'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {question.ano && <span>Ano: <strong className="text-gray-700">{question.ano}</strong></span>}
          {question.banca && <span>Banca: <strong className="text-gray-700">{question.banca}</strong></span>}
          {question.nivel && <span>Nível: <strong className="text-gray-700">{question.nivel}</strong></span>}
        </div>

        <p className="text-gray-900 leading-relaxed whitespace-pre-wrap text-lg">
          {question.question}
        </p>

        {question.questionImageUrl && (
          <ZoomableImage
            src={question.questionImageUrl}
            alt="Imagem do enunciado"
            className="max-w-full max-h-[480px] rounded-xl border border-gray-200 object-contain"
            onZoom={setZoomImage}
          />
        )}

        {question.materialUrl && (
          /\.(jpg|jpeg|png|gif|webp|svg)($|\?)/i.test(question.materialUrl) ||
          question.materialUrl.startsWith('data:image')
        ) && (
          <ZoomableImage
            src={question.materialUrl}
            alt="Material de apoio"
            className="max-w-full max-h-[480px] rounded-xl border border-gray-200 object-contain"
            onZoom={setZoomImage}
          />
        )}

        {/* Alternativas */}
        <div className="space-y-3">
          {question.options.map((opt, i) => {
            const isSelected = i === selectedAnswer
            const isCorrectOption = i === question.correctAnswer
            let border = 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            let ring = ''

            const locked = revealState && answeredCorrectly

            if (revealState) {
              if (isSelected && answeredCorrectly) { border = 'border-green-300 bg-green-50'; ring = 'ring-2 ring-green-200' }
              else if (isSelected && !answeredCorrectly) { border = 'border-red-300 bg-red-50'; ring = 'ring-2 ring-red-200' }
              else if (isCorrectOption) { border = 'border-green-300 bg-green-50'; ring = 'ring-2 ring-green-200' }
              else { border = 'border-gray-200 bg-gray-50 opacity-60' }
            } else if (isSelected) {
              border = 'border-blue-400 bg-blue-50'
              ring = 'ring-2 ring-blue-200'
            }

            const showAsCorrect = revealState && (isCorrectOption || (isSelected && answeredCorrectly))
            const showAsWrong = revealState && isSelected && !answeredCorrectly

            return (
              <button
                key={i}
                disabled={locked}
                onClick={() => (revealState ? submitAnswer(i) : setSelectedAnswer(i))}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${border} ${ring}`}
              >
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                  showAsCorrect ? 'bg-green-500 text-white'
                  : showAsWrong ? 'bg-red-500 text-white'
                  : isSelected ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {showAsCorrect ? <CheckCircle className="w-5 h-5" />
                    : showAsWrong ? <XCircle className="w-5 h-5" />
                    : LETTERS[i]}
                </span>
                <span className="text-gray-700 flex-1">
                  {question.optionImages?.[i] && !opt?.trim()
                    ? <ZoomableImage
                        src={question.optionImages[i]!}
                        alt={`Imagem da opção ${LETTERS[i]}`}
                        className="max-w-full max-h-40 rounded-lg border border-gray-200 object-contain"
                        onZoom={setZoomImage}
                      />
                    : <>{opt}{question.optionImages?.[i] && opt?.trim() && (
                        <span className="block mt-1">
                          <ZoomableImage
                            src={question.optionImages[i]!}
                            alt={`Imagem da opção ${LETTERS[i]}`}
                            className="max-w-full max-h-40 rounded-lg border border-gray-200 object-contain"
                            onZoom={setZoomImage}
                          />
                        </span>
                      )}</>
                  }
                </span>
                {showAsCorrect && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />}
                {showAsWrong && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
              </button>
            )
          })}
        </div>

        {revealState && question.gabaritoComentado && (
          <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Gabarito Comentado</p>
            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">{question.gabaritoComentado}</p>
          </div>
        )}

        {/* Botões principais */}
        {!revealState && (
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleAnswer}
              disabled={selectedAnswer === null}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-5 h-5" />
              Confirmar Resposta
            </button>
          </div>
        )}
        {revealState && !answeredCorrectly && (
          <p className="text-sm text-gray-500 pt-1">Clique em outra alternativa para tentar novamente.</p>
        )}

        {/* Resolução */}
        {hasResolution && (
          <div className="pt-1 space-y-3">
            {question.aulaRelacionada && (
              <a
                href={question.aulaRelacionada}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 bg-red-50 border border-red-200 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm w-fit"
              >
                <Play className="w-5 h-5" />
                Resolução em Vídeo
              </a>
            )}
            {question.materialUrl && <MaterialBlock url={question.materialUrl} onZoom={setZoomImage} />}
          </div>
        )}
      </div>

      {/* Barra de ações */}
      <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-t border-gray-100 bg-gray-50/60">
        <button
          onClick={() => setShowStats(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showStats ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Estatísticas
        </button>
        <button
          onClick={() => setShowComments(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showComments ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Comentários{comments.length > 0 ? ` (${comments.length})` : ''}
        </button>
        {question.moduleId && (
          <button
            onClick={() => setShowDoubt(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showDoubt ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Tirar Dúvida
          </button>
        )}
        <button
          onClick={() => setShowReport(s => !s)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showReport ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          Notificar Erro
        </button>
      </div>

      {/* Painel de estatísticas */}
      {showStats && (
        <div className="border-t border-gray-100 p-6">
          {stats && stats.total > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm font-medium text-gray-600 mb-4">Percentual de Acertos</p>
                <DonutChart percentage={overallPercentage} size={120} />
                <p className="text-sm text-gray-500 mt-3">{stats.correct} de {stats.total} alunos acertaram</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-4">Distribuição de Respostas</p>
                <div className="space-y-3">
                  {question.options.map((opt, i) => {
                    const count = stats.answers[i] || 0
                    const pct = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0.0'
                    const isCorrect = i === question.correctAnswer
                    return (
                      <div key={i} className={`p-3 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                              isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {LETTERS[i]}
                            </span>
                            <span className={`text-sm ${isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'}`}>
                              {opt}{isCorrect && <span className="ml-1 text-green-500">✓</span>}
                            </span>
                          </div>
                          <span className={`text-sm font-semibold ${isCorrect ? 'text-green-700' : 'text-gray-700'}`}>{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isCorrect ? 'bg-green-500' : 'bg-blue-400'}`}
                            style={{ width: `${Math.max(parseFloat(pct), 1)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Ainda não há respostas suficientes para gerar estatísticas.</p>
          )}
        </div>
      )}

      {/* Painel de comentários */}
      {showComments && (
        <div className="border-t border-gray-100 p-6 space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {comments.map(c => (
                <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{c.userName}</span>
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.text}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleComment()}
              placeholder="Escreva um comentário sobre esta questão..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleComment}
              disabled={!commentText.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Painel de tirar dúvida */}
      {showDoubt && (
        <div className="border-t border-gray-100 p-6 space-y-3">
          {doubtSent ? (
            <p className="text-sm text-green-600 font-medium text-center py-2 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Dúvida enviada ao professor. Você verá a resposta em "Mensagens" no curso.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500">Não entendeu o enunciado ou a resolução desta questão? Pergunte ao professor.</p>
              <textarea
                value={doubtText}
                onChange={e => setDoubtText(e.target.value)}
                rows={3}
                placeholder="Descreva sua dúvida sobre esta questão..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none"
              />
              <button
                onClick={handleDoubt}
                disabled={!doubtText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                <HelpCircle className="w-4 h-4" />
                Enviar Dúvida
              </button>
            </>
          )}
        </div>
      )}

      {/* Painel de notificar erro */}
      {showReport && (
        <div className="border-t border-gray-100 p-6 space-y-3">
          {reportSent ? (
            <p className="text-sm text-green-600 font-medium text-center py-2 flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Relato enviado ao administrador. Obrigado!
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500">Encontrou um erro no enunciado, alternativas ou gabarito? Descreva abaixo.</p>
              <textarea
                value={reportText}
                onChange={e => setReportText(e.target.value)}
                rows={3}
                placeholder="Descreva o problema encontrado nesta questão..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-sm resize-none"
              />
              <button
                onClick={handleReport}
                disabled={!reportText.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 font-medium text-sm"
              >
                <Flag className="w-4 h-4" />
                Enviar Relato
              </button>
            </>
          )}
        </div>
      )}

      {/* Lightbox */}
      {zoomImage && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <button
            onClick={() => setZoomImage(null)}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img src={zoomImage} alt="Imagem ampliada" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </div>
  )
}
