import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectDropdownProps {
  label: string
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  disabled?: boolean
}

// Dropdown de seleção múltipla com checkboxes, usado nos filtros do banco de
// questões. Suporta selecionar de 1 a N opções, "Selecionar Todos" e "Limpar Filtro".
export default function MultiSelectDropdown({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Todos',
  disabled = false,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const selectAll = () => onChange(options.map(o => o.value))
  const clearAll = () => onChange([])

  const allSelected = options.length > 0 && selected.length === options.length

  const summary = () => {
    if (selected.length === 0) return placeholder
    if (selected.length === 1) {
      return options.find(o => o.value === selected[0])?.label || selected[0]
    }
    return `${selected.length} selecionados`
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 text-left"
      >
        <span className={selected.length ? 'text-gray-900' : 'text-gray-400'}>{summary()}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[220px] bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={selectAll}
              disabled={options.length === 0 || allSelected}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Selecionar Todos
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={selected.length === 0}
              className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              Limpar Filtro
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-400">Nenhuma opção disponível</p>
            ) : (
              options.map(opt => {
                const checked = selected.includes(opt.value)
                return (
                  // Botão comum (não um <input> escondido): um checkbox visualmente
                  // oculto dentro deste container rolável faz o navegador "rolar até
                  // o foco" a cada clique, jogando a lista/página para longe.
                  <button
                    key={opt.value}
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleValue(opt.value)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-left"
                  >
                    <span
                      className={`flex items-center justify-center w-4 h-4 rounded border flex-shrink-0 ${
                        checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <span className="text-gray-700">{opt.label}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
