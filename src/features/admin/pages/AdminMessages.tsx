import { useEffect, useState } from 'react'
import { useCourseStore } from '../../courses/data/courseStore'
import { Reply, Flag, HelpCircle, Clock, CheckCircle2, Inbox } from 'lucide-react'

export default function AdminMessages() {
  const { messages, replyMessage, loadFromSupabase } = useCourseStore()
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    loadFromSupabase()
  }, [loadFromSupabase])

  const reportMessages = messages
    .filter(m => m.type === 'question_report')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const unreplied = reportMessages.filter(m => !m.reply)
  const replied = reportMessages.filter(m => m.reply)

  const handleReply = (msgId: string) => {
    if (!replyText) return
    replyMessage(msgId, replyText)
    setReplyText('')
    setSelectedMsg(null)
  }

  const MessageCard = ({ msg }: { msg: (typeof messages)[number] }) => (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{msg.fromUserName}</p>
          <span className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium bg-red-50 text-red-700 border-red-100">
            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{msg.targetName || 'Questão'}</span>
          </span>
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
          {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
        </span>
      </div>

      <p className="text-gray-700 mb-3 text-sm leading-relaxed">{msg.text}</p>

      {msg.reply ? (
        <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs font-medium text-blue-600 mb-1">Sua resposta:</p>
          <p className="text-sm text-blue-900">{msg.reply}</p>
        </div>
      ) : selectedMsg === msg.id ? (
        <div className="space-y-2">
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder="Digite sua resposta..."
            rows={3}
            autoFocus
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleReply(msg.id)}
              disabled={!replyText}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
            >
              Enviar Resposta
            </button>
            <button
              onClick={() => { setSelectedMsg(null); setReplyText('') }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setSelectedMsg(msg.id)}
          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          <Reply className="w-4 h-4" />
          Responder
        </button>
      )}
    </div>
  )

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Mensagens</h1>
      <p className="text-gray-600 mb-8">Relatos de erro enviados pelos alunos no Banco de Questões</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-5 bg-gradient-to-br from-yellow-50 to-yellow-50/50 rounded-2xl border border-yellow-100 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-yellow-700">{unreplied.length}</p>
            <p className="text-sm text-yellow-600 font-medium">Pendentes</p>
          </div>
          <div className="w-11 h-11 bg-yellow-100 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-yellow-600" />
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-green-50 to-green-50/50 rounded-2xl border border-green-100 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-green-700">{replied.length}</p>
            <p className="text-sm text-green-600 font-medium">Respondidas</p>
          </div>
          <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="p-5 bg-gradient-to-br from-red-50 to-red-50/50 rounded-2xl border border-red-100 flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-red-700">{reportMessages.length}</p>
            <p className="text-sm text-red-600 font-medium">Total</p>
          </div>
          <div className="w-11 h-11 bg-red-100 rounded-xl flex items-center justify-center">
            <Flag className="w-5 h-5 text-red-600" />
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        <h2 className="text-lg font-bold text-gray-900">Pendentes</h2>
        {unreplied.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhum relato pendente.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {unreplied.map(msg => <MessageCard key={msg.id} msg={msg} />)}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Respondidas</h2>
        {replied.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
            <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhum relato respondido.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {replied.map(msg => <MessageCard key={msg.id} msg={msg} />)}
          </div>
        )}
      </div>
    </div>
  )
}
