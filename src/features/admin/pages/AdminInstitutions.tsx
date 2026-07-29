import { useEffect, useState } from 'react'
import { useInstitutionStore } from '../../courses/data/institutionStore'
import { Landmark, Plus, Trash2, AlertCircle, Loader2 } from 'lucide-react'

export default function AdminInstitutions() {
  const { institutions, loading, loadInstitutions, addInstitution, deleteInstitution } = useInstitutionStore()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadInstitutions()
  }, [loadInstitutions])

  const handleAdd = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (institutions.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('Já existe uma instituição com esse nome.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await addInstitution(trimmed)
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar instituição')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, instName: string) => {
    if (!window.confirm(`Excluir a instituição "${instName}"? Questões já cadastradas com ela manterão o vínculo, mas ela deixará de aparecer para seleção.`)) return
    try {
      await deleteInstitution(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir instituição')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Landmark className="w-8 h-8 text-blue-600" />
          Instituições
        </h1>
        <p className="text-gray-600">Cadastre as instituições disponíveis para seleção no cadastro e nos filtros de questões</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">NOVA INSTITUIÇÃO</label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Ex: Instituto Federal de São Paulo"
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </button>
        </div>
        {error && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            Instituições Cadastradas
          </h2>
          <span className="text-sm text-gray-500">{institutions.length} registros</span>
        </div>

        {loading && institutions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : institutions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Landmark className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhuma instituição cadastrada ainda</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {institutions.map(inst => (
              <div key={inst.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center text-xs font-bold">
                    {inst.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-gray-900">{inst.name}</span>
                </div>
                <button
                  onClick={() => handleDelete(inst.id, inst.name)}
                  className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
