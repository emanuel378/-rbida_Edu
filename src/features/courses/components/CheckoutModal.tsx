import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Copy, Check, QrCode, Loader2, AlertCircle, PartyPopper } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../../../lib/supabase'
import type { Course, User } from '../data/mock'

interface CheckoutModalProps {
  course: Course
  user: User
  onClose: () => void
  onPaid: () => void
}

interface PixOrder {
  orderId: string
  amount: number
  qrCodeImage: string
  payload: string
  expiresAt: string
}

type Step = 'form' | 'loading' | 'qrcode' | 'paid' | 'error'

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

export default function CheckoutModal({ course, user, onClose, onPaid }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [cpf, setCpf] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [order, setOrder] = useState<PixOrder | null>(null)
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    const cached = localStorage.getItem(`cpf_${user.id}`)
    if (cached) setCpf(formatCPF(cached))
  }, [user.id])

  const expired = order ? secondsLeft <= 0 : false

  useEffect(() => {
    if (!order) return
    const tick = () => {
      const diff = Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000)
      setSecondsLeft(Math.max(0, diff))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [order])

  const timeLabel = useMemo(() => {
    const m = Math.floor(secondsLeft / 60)
    const s = secondsLeft % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }, [secondsLeft])

  const checkOrderStatus = async (orderId: string) => {
    const { data } = await supabase.from('orders').select('status').eq('id', orderId).single()
    if (data?.status === 'paid') {
      setStep('paid')
      onPaid()
    }
  }

  useEffect(() => {
    if (step !== 'qrcode' || !order || !isSupabaseConfigured()) return

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

  const generatePix = async () => {
    if (!isValidCPF(cpf)) {
      setError('CPF inválido. Confira os números digitados.')
      return
    }
    setError(null)
    setStep('loading')
    try {
      const digits = cpf.replace(/\D/g, '')
      const { data, error: fnError } = await supabase.functions.invoke('create-payment', {
        body: { courseId: course.id, name: user.name, cpf: digits },
      })
      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)

      localStorage.setItem(`cpf_${user.id}`, digits)
      setOrder(data as PixOrder)
      setStep('qrcode')
    } catch (err) {
      setError((err as Error).message || 'Não foi possível gerar o Pix. Tente novamente.')
      setStep('error')
    }
  }

  const copyPayload = async () => {
    if (!order) return
    await navigator.clipboard.writeText(order.payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Comprar curso</h2>
            <p className="text-sm text-gray-500">{course.title} · R$ {course.price.toFixed(2)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {(step === 'form' || step === 'loading' || step === 'error') && (
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
                <p className="text-xs text-gray-400 mt-1.5">Necessário para gerar a cobrança Pix no Asaas.</p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={generatePix}
                disabled={step === 'loading' || cpf.replace(/\D/g, '').length !== 11}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors"
              >
                {step === 'loading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gerando Pix...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" /> Gerar QR Code Pix
                  </>
                )}
              </button>
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
                  <p className="text-xs text-gray-400">Expira em {timeLabel}</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600 pt-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aguardando confirmação do pagamento...
                  </div>
                </>
              )}
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
