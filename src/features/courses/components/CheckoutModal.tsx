import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Copy, Check, QrCode, Loader2, AlertCircle, PartyPopper, CreditCard } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import { isQuestionBankCourse } from '../data/courseStore'
import type { Course, User } from '../data/mock'

interface CheckoutModalProps {
  course: Course
  user: User
  onClose: () => void
  onPaid: () => void
}

interface Order {
  orderId: string
  amount: number
  qrCodeImage?: string
  payload?: string
  expiresAt?: string
}

type PaymentMethod = 'pix' | 'credit_card'
type Step = 'form' | 'loading' | 'qrcode' | 'analyzing' | 'paid' | 'error'

function isValidCPF(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false
  const calc = (base: string) => {
    let sum = 0
    for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (base.length + 1 - i)
    const rem = (sum * 10) % 11
    return rem === 10 ? 0 : rem
  }
  return calc(digits.slice(0, 9)) === parseInt(digits[9], 10) && calc(digits.slice(0, 10)) === parseInt(digits[10], 10)
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 19)
  return (digits.match(/.{1,4}/g) ?? []).join(' ')
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  return digits.length <= 2 ? digits : `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function formatCEP(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/(\d{5})(\d)/, '$1-$2')
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{0,4})(\d{0,4})/, (_m, a, b, c) => [a && `(${a}`, a && b ? `) ${b}` : '', c ? `-${c}` : ''].join(''))
  }
  return digits.replace(/(\d{2})(\d{0,5})(\d{0,4})/, (_m, a, b, c) => [a && `(${a}`, a && b ? `) ${b}` : '', c ? `-${c}` : ''].join(''))
}

// Taxas da conta Asaas para cartão de crédito (cobrança online), repassadas ao
// aluno no valor final. Mesma tabela replicada em supabase/functions/_shared/cardFee.ts,
// que é quem de fato calcula o valor cobrado — isso aqui é só para exibição.
const CARD_FEE_TIERS: { maxInstallments: number; percent: number; fixed: number }[] = [
  { maxInstallments: 1, percent: 0.0299, fixed: 0.49 },
  { maxInstallments: 6, percent: 0.0349, fixed: 0.49 },
  { maxInstallments: 12, percent: 0.0399, fixed: 0.49 },
  { maxInstallments: 21, percent: 0.0429, fixed: 0.49 },
]

function grossCardAmount(netAmount: number, installmentCount: number): number {
  const tier = CARD_FEE_TIERS.find(t => installmentCount <= t.maxInstallments) ?? CARD_FEE_TIERS[CARD_FEE_TIERS.length - 1]
  return Math.round(((netAmount + tier.fixed) / (1 - tier.percent)) * 100) / 100
}

export default function CheckoutModal({ course, user, onClose, onPaid }: CheckoutModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('pix')
  const [step, setStep] = useState<Step>('form')
  const [cpf, setCpf] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const pollRef = useRef<number | null>(null)

  const [cardHolderName, setCardHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [installments, setInstallments] = useState(1)

  useEffect(() => {
    const cached = localStorage.getItem(`cpf_${user.id}`)
    if (cached) setCpf(formatCPF(cached))
  }, [user.id])

  const expired = order?.expiresAt ? secondsLeft <= 0 : false

  useEffect(() => {
    if (!order?.expiresAt) return
    const tick = () => {
      const diff = Math.floor((new Date(order.expiresAt!).getTime() - Date.now()) / 1000)
      setSecondsLeft(Math.max(0, diff))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [order])

  // O QR do Asaas pode ser válido por muito tempo (dias/meses, conforme a
  // configuração de expiração da conta). Nesse caso não faz sentido uma
  // contagem regressiva em minutos — mostra a data limite.
  const timeLabel = useMemo(() => {
    if (secondsLeft >= 24 * 3600) {
      const limit = new Date(Date.now() + secondsLeft * 1000)
      return `Válido até ${limit.toLocaleDateString('pt-BR')}`
    }
    if (secondsLeft >= 3600) {
      const h = Math.floor(secondsLeft / 3600)
      const min = Math.floor((secondsLeft % 3600) / 60)
      return `Expira em ${h}h${min.toString().padStart(2, '0')}`
    }
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return `Expira em ${m}:${s.toString().padStart(2, '0')}`
  }, [secondsLeft])

  const checkOrderStatus = async (orderId: string) => {
    const { data } = await supabase.from('orders').select('status').eq('id', orderId).single()
    if (data?.status === 'paid') {
      setStep('paid')
      onPaid()
    }
  }

  useEffect(() => {
    if ((step !== 'qrcode' && step !== 'analyzing') || !order || !isSupabaseConfigured()) return

    const channel = supabase
      .channel(`order-${order.orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.orderId}` },
        (payload: any) => {
          if (payload.new?.status === 'paid') {
            setStep('paid')
            onPaid()
          }
        }
      )
      .subscribe()

    pollRef.current = window.setInterval(() => checkOrderStatus(order.orderId), 4000)

    return () => {
      supabase.removeChannel(channel)
      if (pollRef.current) window.clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, order])

  useEffect(() => {
    if (step === 'paid') {
      const t = setTimeout(onClose, 2500)
      return () => clearTimeout(t)
    }
  }, [step, onClose])

  const cpfValid = isValidCPF(cpf)
  const cardDigits = cardNumber.replace(/\D/g, '')
  const cepDigits = postalCode.replace(/\D/g, '')
  const phoneDigits = phone.replace(/\D/g, '')
  const [expMonth, expYear] = cardExpiry.split('/')

  const expiryValid = useMemo(() => {
    if (!/^\d{2}$/.test(expMonth ?? '') || !/^\d{2}$/.test(expYear ?? '')) return false
    const month = parseInt(expMonth, 10)
    if (month < 1 || month > 12) return false
    const now = new Date()
    const expDate = new Date(2000 + parseInt(expYear, 10), month)
    return expDate > now
  }, [expMonth, expYear])

  const cardFormValid =
    cpfValid &&
    cardHolderName.trim().length > 2 &&
    cardDigits.length >= 13 &&
    cardDigits.length <= 19 &&
    expiryValid &&
    /^\d{3,4}$/.test(cardCvv) &&
    cepDigits.length === 8 &&
    addressNumber.trim().length > 0 &&
    phoneDigits.length >= 10

  // Preço fixo do curso (promoção) tem prioridade sobre o cálculo automático
  // de repasse de taxa da Asaas — mesma regra usada no backend.
  const cardCashTotal = course.cardCashPrice ?? grossCardAmount(course.price, 1)
  const card3xTotal = course.card3xPrice ?? grossCardAmount(course.price, 3)
  // Parcelamento fixo: só à vista (1x) ou 3x. A opção de 3x some se a parcela
  // ficar abaixo do mínimo de R$5 aceito pela Asaas.
  const canSplitIn3x = card3xTotal / 3 >= 5
  const cardTotal = installments === 3 ? card3xTotal : cardCashTotal

  const generatePix = async () => {
    if (!cpfValid) {
      setError('CPF inválido. Confira os números digitados.')
      return
    }
    setError(null)
    setStep('loading')
    try {
      const digits = cpf.replace(/\D/g, '')
      const { data, error: fnError } = await supabase.functions.invoke('create-payment', {
        body: { courseId: course.id, name: user.name, cpf: digits, paymentMethod: 'pix' },
      })
      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)

      localStorage.setItem(`cpf_${user.id}`, digits)
      setOrder(data as Order)
      setStep('qrcode')
    } catch (err) {
      setError((err as Error).message || 'Não foi possível gerar o Pix. Tente novamente.')
      setStep('error')
    }
  }

  const payWithCard = async () => {
    if (!cpfValid) {
      setError('CPF inválido. Confira os números digitados.')
      return
    }
    if (!cardFormValid) {
      setError('Confira os dados do cartão e preencha CEP, número e telefone corretamente.')
      return
    }
    setError(null)
    setStep('loading')
    try {
      const digits = cpf.replace(/\D/g, '')
      const { data, error: fnError } = await supabase.functions.invoke('create-payment', {
        body: {
          courseId: course.id,
          name: user.name,
          cpf: digits,
          paymentMethod: 'credit_card',
          installmentCount: installments,
          card: {
            holderName: cardHolderName.trim(),
            number: cardDigits,
            expiryMonth: expMonth,
            expiryYear: `20${expYear}`,
            ccv: cardCvv,
          },
          holderInfo: {
            postalCode: cepDigits,
            addressNumber: addressNumber.trim(),
            phone: phoneDigits,
          },
        },
      })
      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)

      localStorage.setItem(`cpf_${user.id}`, digits)
      setOrder({ orderId: data.orderId, amount: data.amount })
      if (data.status === 'paid') {
        setStep('paid')
        onPaid()
      } else {
        setStep('analyzing')
      }
    } catch (err) {
      setError((err as Error).message || 'Não foi possível processar o pagamento. Tente novamente.')
      setStep('error')
    }
  }

  const copyPayload = async () => {
    if (!order?.payload) return
    await navigator.clipboard.writeText(order.payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showForm = step === 'form' || step === 'loading' || step === 'error'
  const isBancoDeQuestoes = isQuestionBankCourse(course)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto">
        {course.coverImageUrl && (
          <div className="h-32 w-full">
            <img src={course.coverImageUrl} alt={course.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Comprar curso</h2>
            <p className="text-sm text-gray-500">{course.title} · R$ {course.price.toFixed(2)}</p>
            {course.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">{course.description}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {showForm && isBancoDeQuestoes && (
            <div className="mb-5 space-y-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div>
                <p className="text-sm font-semibold text-blue-900 leading-snug">
                  🎯 Você está a um passo de acelerar sua preparação para os Institutos Federais!
                </p>
                <p className="text-xs text-blue-800/80 mt-1.5 leading-relaxed">
                  Banco de Questões Comentadas da Órbita Edu: a ferramenta ideal para dominar o estilo de
                  cobrança das bancas dos IFs, com resoluções detalhadas e direcionadas.
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-blue-900 mb-1.5">📚 Disciplinas incluídas</p>
                <ul className="space-y-1 text-xs text-blue-800/90">
                  <li><strong>Português para IFs</strong> — foco no perfil de cobrança das bancas de Institutos Federais.</li>
                  <li><strong>Conhecimentos Educacionais para IFs</strong> — conteúdo atualizado e indispensável para cargos da área educacional.</li>
                  <li><strong>Legislação para IFs</strong> — todas as leis e regulamentos cobrados nos concursos dos IFs.</li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold text-blue-900 mb-1.5">📦 O que está incluído no seu plano</p>
                <ul className="space-y-1 text-xs text-blue-800/90">
                  <li><strong>Acesso total por 3 meses</strong> — conteúdo focado na sua aprovação.</li>
                  <li><strong>Questões comentadas</strong> — resoluções passo a passo para tirar todas as suas dúvidas.</li>
                  <li><strong>Estudo direcionado</strong> — economize tempo focando no que realmente cai na prova.</li>
                </ul>
              </div>
            </div>
          )}

          {showForm && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setMethod('pix')}
                disabled={step === 'loading'}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  method === 'pix' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <QrCode className="w-4 h-4" /> Pix
              </button>
              <button
                type="button"
                onClick={() => setMethod('credit_card')}
                disabled={step === 'loading'}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  method === 'credit_card' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="w-4 h-4" /> Cartão de crédito
              </button>
            </div>
          )}

          {showForm && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF do titular</label>
                <input
                  value={cpf}
                  onChange={e => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  disabled={step === 'loading'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Necessário para gerar a cobrança {method === 'pix' ? 'Pix' : 'do cartão'} no Asaas.
                </p>
              </div>

              {method === 'credit_card' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome impresso no cartão</label>
                    <input
                      value={cardHolderName}
                      onChange={e => setCardHolderName(e.target.value)}
                      placeholder="Como está no cartão"
                      disabled={step === 'loading'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Número do cartão</label>
                    <input
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      inputMode="numeric"
                      disabled={step === 'loading'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Validade</label>
                      <input
                        value={cardExpiry}
                        onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA"
                        inputMode="numeric"
                        disabled={step === 'loading'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">CVV</label>
                      <input
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="000"
                        inputMode="numeric"
                        disabled={step === 'loading'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
                      <input
                        value={postalCode}
                        onChange={e => setPostalCode(formatCEP(e.target.value))}
                        placeholder="00000-000"
                        inputMode="numeric"
                        disabled={step === 'loading'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Número</label>
                      <input
                        value={addressNumber}
                        onChange={e => setAddressNumber(e.target.value)}
                        placeholder="123"
                        disabled={step === 'loading'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone com DDD</label>
                    <input
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      inputMode="numeric"
                      disabled={step === 'loading'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    />
                  </div>
                  {canSplitIn3x && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Parcelas</label>
                      <div className="flex gap-2">
                        {[1, 3].map(n => {
                          const total = n === 3 ? card3xTotal : cardCashTotal
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setInstallments(n)}
                              disabled={step === 'loading'}
                              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                                installments === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              {n === 1 ? 'À vista' : `3x de R$ ${(total / n).toFixed(2)}`}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">
                    Total a pagar no cartão: <span className="font-medium text-gray-600">R$ {cardTotal.toFixed(2)}</span>
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={method === 'pix' ? generatePix : payWithCard}
                disabled={step === 'loading' || (method === 'pix' ? !cpfValid : !cardFormValid)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
              >
                {step === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> {method === 'pix' ? 'Gerando Pix...' : 'Processando pagamento...'}
                  </>
                ) : method === 'pix' ? (
                  <>
                    <QrCode className="w-4 h-4" /> Gerar QR Code Pix
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" /> Pagar R$ {cardTotal.toFixed(2)} no cartão
                  </>
                )}
              </button>

              {isBancoDeQuestoes && (
                <p className="text-center text-[11px] text-gray-400 leading-relaxed">
                  🔒 Compra 100% segura — seus dados são protegidos e o acesso é liberado logo após a confirmação do pagamento.
                </p>
              )}
            </div>
          )}

          {step === 'qrcode' && order && (
            <div className="space-y-4 text-center">
              {expired ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-700 rounded-xl text-sm text-left">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Este código Pix expirou.</span>
                  </div>
                  <button
                    onClick={generatePix}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    <QrCode className="w-4 h-4" /> Gerar novo código
                  </button>
                </div>
              ) : (
                <>
                  <img src={order.qrCodeImage} alt="QR Code Pix" className="w-56 h-56 mx-auto rounded-xl border border-gray-100" />
                  <p className="text-sm text-gray-500">Escaneie com o app do seu banco ou copie o código abaixo</p>
                  <button
                    onClick={copyPayload}
                    className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar código Pix'}
                  </button>
                  <p className="text-xs text-gray-400">{timeLabel}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600 pt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aguardando confirmação do pagamento...
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'analyzing' && (
            <div className="text-center py-6 space-y-3">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
              <h3 className="text-lg font-bold text-gray-900">Pagamento em análise</h3>
              <p className="text-sm text-gray-500">Assim que a operadora do cartão aprovar, seu acesso será liberado automaticamente.</p>
            </div>
          )}

          {step === 'paid' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto">
                <PartyPopper className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Pagamento confirmado!</h3>
              <p className="text-sm text-gray-500">Seu acesso ao curso foi liberado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
