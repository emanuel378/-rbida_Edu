import { X } from 'lucide-react'
import { legalDocs, type LegalDoc } from '../data/legalDocs'

interface TermsModalProps {
  docKey: LegalDoc['key']
  onClose: () => void
}

export default function TermsModal({ docKey, onClose }: TermsModalProps) {
  const doc = legalDocs.find(d => d.key === docKey)
  if (!doc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{doc.title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-4 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
          {doc.content}
        </div>
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
