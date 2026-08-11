import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../services/authStore'
import TermsModal from '../components/TermsModal'
import type { LegalDoc } from '../data/legalDocs'
import { validatePassword, passwordRuleErrors } from '../../../lib/password'
import { formatCPF, isValidCPF } from '../../../lib/cpf'
import { LogIn, Loader2, AlertCircle, Mail, CheckCircle2, IdCard } from 'lucide-react'

export default function Login({ defaultSignUp = false }: { defaultSignUp?: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signUpName, setSignUpName] = useState('')
  const [signUpCpf, setSignUpCpf] = useState('')
  const [signUpRole, setSignUpRole] = useState<'aluno' | 'professor'>('aluno')
  const [isSigningUp, setIsSigningUp] = useState(defaultSignUp)
  const [loading, setLoading] = useState(false)
  const [realError, setRealError] = useState<string | null>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [openDoc, setOpenDoc] = useState<LegalDoc['key'] | null>(null)

  const loginWithEmail = useAuthStore(s => s.loginWithEmail)
  const signUp = useAuthStore(s => s.signUp)
  const navigate = useNavigate()
  const location = useLocation()
  const kicked = Boolean((location.state as { kicked?: boolean } | null)?.kicked)

  const goToRoleHome = (user: { role: 'aluno' | 'professor' | 'admin'; approved?: boolean }) => {
    if (user.role === 'admin') {
      navigate('/admin')
    } else if (user.role === 'professor' && !user.approved) {
      navigate('/pending')
    } else if (user.role === 'professor') {
      navigate('/teacher')
    } else {
      navigate('/dashboard')
    }
  }

  const handleRealSubmit = async () => {
    setRealError(null)
    setPendingConfirmation(false)
    setLoading(true)
    try {
      if (isSigningUp) {
        if (!signUpCpf || !isValidCPF(signUpCpf)) {
          setRealError('CPF inválido.')
          return
        }
        const validationError = validatePassword(password)
        if (validationError) {
          setRealError(validationError)
          return
        }
        const { error } = await signUp(signUpName, email, password, signUpRole, acceptedTerms, signUpCpf.replace(/\D/g, ''))
        if (error) {
          setRealError(error)
          return
        }
        const user = useAuthStore.getState().user
        if (!user) {
          setPendingConfirmation(true)
          return
        }
        goToRoleHome(user)
      } else {
        const { error } = await loginWithEmail(email, password)
        if (error) {
          setRealError(error)
          return
        }
        const user = useAuthStore.getState().user
        if (user) goToRoleHome(user)
        else setRealError('Não foi possível carregar o perfil desta conta.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-full.png" alt="ÓrbitaEdu" className="w-80 mx-auto mb-6 rounded-2xl shadow-lg shadow-blue-200" />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Acesso ao Sistema</h2>
          </div>

          {kicked && !pendingConfirmation && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 text-amber-700 rounded-xl text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Sua conta foi acessada em outro aparelho. Por segurança, encerramos esta sessão. Faça login novamente.</span>
            </div>
          )}

          {pendingConfirmation ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Conta criada!</h3>
                <p className="text-sm text-gray-600">
                  Verifique seu e-mail (incluindo a caixa de spam) e clique no link de
                  confirmação antes de fazer login.
                </p>
              </div>
              <button
                onClick={() => { setPendingConfirmation(false); setIsSigningUp(false); setPassword('') }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {isSigningUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                  <input
                    value={signUpName}
                    onChange={e => setSignUpName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {isSigningUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF</label>
                  <div className="relative">
                    <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={signUpCpf}
                      onChange={e => setSignUpCpf(formatCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {isSigningUp && (
                  <ul className="mt-2 space-y-1">
                    {passwordRuleErrors(password).map(({ rule, met }) => (
                      <li
                        key={rule}
                        className={`flex items-center gap-1.5 text-xs ${
                          met ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        {met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 flex items-center justify-center">•</span>}
                        {rule}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {isSigningUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sou</label>
                  <div className="flex gap-2">
                    {(['aluno', 'professor'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setSignUpRole(r)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                          signUpRole === r ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-gray-200 text-gray-600'
                        }`}
                      >
                        {r === 'aluno' ? 'Aluno' : 'Professor'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isSigningUp && (
                <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    Li e aceito o{' '}
                    <button type="button" onClick={() => setOpenDoc('termo')} className="text-blue-600 underline hover:text-blue-700">
                      Termo de Uso
                    </button>
                    , a{' '}
                    <button type="button" onClick={() => setOpenDoc('privacidade')} className="text-blue-600 underline hover:text-blue-700">
                      Política de Privacidade
                    </button>{' '}
                    e a{' '}
                    <button type="button" onClick={() => setOpenDoc('cancelamento')} className="text-blue-600 underline hover:text-blue-700">
                      Política de Cancelamento e Reembolso
                    </button>{' '}
                    da ÓrbitaEdu.
                  </span>
                </label>
              )}

              {realError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{realError}</span>
                </div>
              )}

              <button
                onClick={handleRealSubmit}
                disabled={loading || !email || !password || (isSigningUp && (!signUpName || !signUpCpf || !acceptedTerms))}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                {isSigningUp ? 'Criar conta' : 'Entrar'}
              </button>

              <button
                onClick={() => { setIsSigningUp(v => !v); setRealError(null); setPendingConfirmation(false); setAcceptedTerms(false) }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
              >
                {isSigningUp ? 'Já tenho conta, entrar' : 'Criar uma conta nova'}
              </button>
            </div>
          )}
        </div>
      </div>

      {openDoc && <TermsModal docKey={openDoc} onClose={() => setOpenDoc(null)} />}
    </div>
  )
}
