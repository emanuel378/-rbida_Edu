import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../../auth/services/authStore'
import { useThemeStore } from '../../../shared/store/themeStore'
import { formatCPF, formatPhone, isValidCPF } from '../../../lib/cpf'
import { validatePassword, passwordRuleErrors } from '../../../lib/password'
import { Settings, User, Bell, Shield, Save, Mail, Phone, IdCard, Camera, Loader2, CheckCircle2, AlertCircle, Lock, Moon } from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
      checked ? 'bg-[#1a3a5c]' : 'bg-gray-200 dark:bg-gray-700'
    }`}
  >
    <span
      className={`js-keep-white absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
        checked ? 'translate-x-5' : ''
      }`}
    />
  </button>
)

const Feedback = ({ state }: { state: { type: 'success' | 'error'; message: string } | null }) => {
  if (!state) return null
  return (
    <div
      className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
        state.type === 'success'
          ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400'
          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
      }`}
    >
      {state.type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      )}
      <span>{state.message}</span>
    </div>
  )
}

export default function Configuracoes() {
  const { user, updateProfile, updatePassword, uploadAvatar } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(formatPhone(user?.phone ?? ''))
  const [cpf, setCpf] = useState(formatCPF(user?.cpf ?? ''))
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)

  useEffect(() => {
    setNotifications(localStorage.getItem('pref-notifications-push') !== 'false')
    setEmailUpdates(localStorage.getItem('pref-notifications-email') !== 'false')
  }, [])

  const handleToggleNotifications = () => {
    const next = !notifications
    setNotifications(next)
    localStorage.setItem('pref-notifications-push', String(next))
  }

  const handleToggleEmailUpdates = () => {
    const next = !emailUpdates
    setEmailUpdates(next)
    localStorage.setItem('pref-notifications-email', String(next))
  }

  const handleSaveProfile = async () => {
    if (cpf && !isValidCPF(cpf)) {
      setProfileFeedback({ type: 'error', message: 'CPF inválido.' })
      return
    }
    setSavingProfile(true)
    setProfileFeedback(null)
    const { error } = await updateProfile({
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      cpf: cpf.replace(/\D/g, ''),
    })
    setSavingProfile(false)
    setProfileFeedback(
      error ? { type: 'error', message: error } : { type: 'success', message: 'Perfil atualizado com sucesso.' }
    )
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('A imagem deve ter no máximo 5MB.')
      return
    }
    setUploadingAvatar(true)
    setAvatarError(null)
    const { error } = await uploadAvatar(file)
    setUploadingAvatar(false)
    if (error) setAvatarError(error)
    e.target.value = ''
  }

  const handleChangePassword = async () => {
    setPasswordFeedback(null)
    const validationError = validatePassword(newPassword)
    if (validationError) {
      setPasswordFeedback({ type: 'error', message: validationError })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'As senhas não coincidem.' })
      return
    }
    setSavingPassword(true)
    const { error } = await updatePassword(newPassword)
    setSavingPassword(false)
    if (error) {
      setPasswordFeedback({ type: 'error', message: error })
    } else {
      setPasswordFeedback({ type: 'success', message: 'Senha alterada com sucesso.' })
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Breadcrumb items={[{ label: 'Configurações' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          Configurações
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Gerencie seu perfil, segurança e preferências da conta.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Perfil</h2>
          </div>
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {user?.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#1a3a5c] hover:bg-[#15304d] text-white rounded-full flex items-center justify-center shadow-sm disabled:opacity-60"
                  title="Alterar foto"
                >
                  {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
              </div>
            </div>

            {avatarError && <Feedback state={{ type: 'error', message: avatarError }} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">O e-mail de acesso não pode ser alterado por aqui.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    placeholder="(00) 00000-0000"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <Feedback state={profileFeedback} />

            <div className="flex justify-end">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !name.trim()}
                className="flex items-center gap-2 bg-[#1a3a5c] hover:bg-[#15304d] text-white px-6 py-2.5 rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salvar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Segurança</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                />
                <ul className="mt-2 space-y-1">
                  {passwordRuleErrors(newPassword).map(({ rule, met }) => (
                    <li
                      key={rule}
                      className={`flex items-center gap-1.5 text-xs ${
                        met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span className="w-3.5 h-3.5 flex items-center justify-center text-gray-400">•</span>}
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                />
              </div>
            </div>

            <Feedback state={passwordFeedback} />

            <div className="flex justify-end">
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 bg-[#1a3a5c] hover:bg-[#15304d] text-white px-6 py-2.5 rounded-xl transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                Alterar Senha
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Notificações</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Notificações push</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receba alertas no navegador</p>
              </div>
              <ToggleSwitch checked={notifications} onChange={handleToggleNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Atualizações por email</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Receba novidades e lembretes</p>
              </div>
              <ToggleSwitch checked={emailUpdates} onChange={handleToggleEmailUpdates} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Preferências</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Modo escuro</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tema escuro em todo o sistema</p>
                </div>
              </div>
              <ToggleSwitch checked={theme === 'dark'} onChange={toggleTheme} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
