import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { Settings, User, Bell, Shield, Save, Mail, Phone, MapPin } from 'lucide-react'
import Breadcrumb from '../../components/Breadcrumb'

export default function Configuracoes() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-[#1a3a5c]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <Breadcrumb items={[{ label: 'Configurações' }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          Configurações
        </h1>
        <p className="text-gray-600 mt-2">
          Gerencie suas preferências e informações da conta.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <User className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Perfil</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  defaultValue={user?.name}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Notificações</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Notificações push</p>
                <p className="text-xs text-gray-500">Receba alertas no navegador</p>
              </div>
              <ToggleSwitch checked={notifications} onChange={() => setNotifications(!notifications)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Atualizações por email</p>
                <p className="text-xs text-gray-500">Receba novidades e lembretes</p>
              </div>
              <ToggleSwitch checked={emailUpdates} onChange={() => setEmailUpdates(!emailUpdates)} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-100 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Preferências</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Modo escuro</p>
                <p className="text-xs text-gray-500">Tema escuro na interface</p>
              </div>
              <ToggleSwitch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 bg-[#1a3a5c] hover:bg-[#15304d] text-white px-6 py-2.5 rounded-xl transition-colors text-sm font-medium">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  )
}
