import { useEffect, useMemo, useState } from 'react'
import {
  KeyRound, RefreshCw, Search, Ban, RotateCcw, DollarSign, CreditCard, QrCode,
  Barcode, CheckCircle, Clock, AlertCircle, History, BookOpen, ExternalLink,
  Loader2, X, ShieldCheck, Trash2,
} from 'lucide-react'
import Breadcrumb from '../../../shared/components/Breadcrumb'
import {
  useAdminManageStore, type AdminOrder, type AdminEnrollment, type AdminCourseLite,
} from '../data/adminManageStore'

type Tab = 'access' | 'payments' | 'history'

const money = (v: number | null | undefined) =>
  v == null ? '—' : `R$ ${Number(v).toFixed(2)}`
const dateTime = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
const dateOnly = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleDateString('pt-BR') : '—'

// ---------- status de acesso derivado (aluno x curso) ----------
type AccessState = 'none' | 'free' | 'paid' | 'admin_grant' | 'enrolled' | 'expired' | 'blocked'

function accessState(enrollment: AdminEnrollment | undefined, course: AdminCourseLite): { state: AccessState; expiresAt: string | null } {
  if (!enrollment) return { state: course.price > 0 ? 'none' : 'free', expiresAt: null }
  if (enrollment.revoked_at) return { state: 'blocked', expiresAt: enrollment.expires_at }
  if (enrollment.expires_at && new Date(enrollment.expires_at) <= new Date()) return { state: 'expired', expiresAt: enrollment.expires_at }
  const map: Record<string, AccessState> = { admin_grant: 'admin_grant', payment: 'paid', free: 'free' }
  return { state: map[enrollment.source ?? ''] ?? 'enrolled', expiresAt: enrollment.expires_at }
}

const ACCESS_BADGE: Record<AccessState, { label: string; cls: string }> = {
  none: { label: 'Sem acesso', cls: 'bg-gray-100 text-gray-600' },
  free: { label: 'Gratuito', cls: 'bg-sky-100 text-sky-700' },
  paid: { label: 'Pago', cls: 'bg-green-100 text-green-700' },
  admin_grant: { label: 'Liberado pelo admin', cls: 'bg-purple-100 text-purple-700' },
  enrolled: { label: 'Matriculado', cls: 'bg-green-100 text-green-700' },
  expired: { label: 'Expirado', cls: 'bg-amber-100 text-amber-700' },
  blocked: { label: 'Bloqueado', cls: 'bg-red-100 text-red-700' },
}

const ORDER_STATUS_BADGE: Record<AdminOrder['status'], { label: string; cls: string }> = {
  pending: { label: 'Aguardando', cls: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Pago', cls: 'bg-green-100 text-green-700' },
  expired: { label: 'Expirado', cls: 'bg-gray-100 text-gray-600' },
  failed: { label: 'Falhou', cls: 'bg-red-100 text-red-700' },
  refunded: { label: 'Estornado', cls: 'bg-purple-100 text-purple-700' },
}

const METHOD_META: Record<AdminOrder['payment_method'], { label: string; Icon: typeof QrCode }> = {
  pix: { label: 'Pix', Icon: QrCode },
  credit_card: { label: 'Cartão', Icon: CreditCard },
  boleto: { label: 'Boleto', Icon: Barcode },
}

const AUDIT_LABEL: Record<string, string> = {
  grant_access: 'Liberou acesso',
  revoke_access: 'Bloqueou acesso',
  restore_access: 'Reativou acesso',
  sync_order: 'Sincronizou pedido',
  sync_pending: 'Sincronizou pendentes',
  mark_paid_manual: 'Marcou como pago',
  delete_order: 'Excluiu pedido',
}

export default function AdminCourseAccess() {
  const {
    orders, enrollments, students, courses, audit, loading, acting, error, lastLoadedAt,
    loadOverview, grantAccess, revokeAccess, restoreAccess, syncOrder, syncPending, markPaidManual, deleteOrder,
  } = useAdminManageStore()

  const [tab, setTab] = useState<Tab>('access')

  useEffect(() => { loadOverview() }, [loadOverview])

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: 'Cursos & Pagamentos' }]} />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-blue-600" />
            Cursos & Pagamentos
          </h1>
          <p className="text-gray-600">Libere acesso a qualquer curso, acompanhe os pagamentos e reconcilie com o Asaas sem sair do sistema.</p>
        </div>
        <button
          onClick={() => loadOverview()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {([['access', 'Liberar acesso'], ['payments', 'Pagamentos'], ['history', 'Histórico']] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && orders.length === 0 && enrollments.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando…
        </div>
      ) : tab === 'access' ? (
        <AccessTab
          students={students} courses={courses} enrollments={enrollments} acting={acting}
          onGrant={grantAccess} onRevoke={revokeAccess} onRestore={restoreAccess}
        />
      ) : tab === 'payments' ? (
        <PaymentsTab
          orders={orders} acting={acting}
          onSync={syncOrder} onSyncPending={syncPending} onMarkPaid={markPaidManual} onDelete={deleteOrder}
        />
      ) : (
        <HistoryTab audit={audit} />
      )}

      {lastLoadedAt && (
        <p className="text-xs text-gray-400 mt-6">Última atualização: {dateTime(new Date(lastLoadedAt).toISOString())}</p>
      )}
    </div>
  )
}

// =====================================================================
// ABA: LIBERAR ACESSO
// =====================================================================
function AccessTab({
  students, courses, enrollments, acting, onGrant, onRevoke, onRestore,
}: {
  students: ReturnType<typeof useAdminManageStore.getState>['students']
  courses: AdminCourseLite[]
  enrollments: AdminEnrollment[]
  acting: boolean
  onGrant: (u: string, c: string, d: number | null, note?: string) => Promise<void>
  onRevoke: (u: string, c: string, note?: string) => Promise<void>
  onRestore: (u: string, c: string) => Promise<void>
}) {
  const [q, setQ] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [grantFor, setGrantFor] = useState<AdminCourseLite | null>(null)

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return students.slice(0, 30)
    return students.filter(s =>
      s.name?.toLowerCase().includes(t) || s.email?.toLowerCase().includes(t) || (s.cpf ?? '').includes(t.replace(/\D/g, '')),
    ).slice(0, 30)
  }, [q, students])

  const selected = students.find(s => s.id === selectedId) ?? null
  const enrollmentFor = (courseId: string) =>
    enrollments.find(e => e.user_id === selectedId && e.course_id === courseId)

  const sortedCourses = [...courses].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar aluno por nome, e-mail ou CPF"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(q.trim() || !selected) && (
          <div className="mt-3 divide-y divide-gray-100 max-h-72 overflow-y-auto">
            {filtered.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Nenhum aluno encontrado.</p>}
            {filtered.map(s => (
              <button
                key={s.id}
                onClick={() => { setSelectedId(s.id); setQ('') }}
                className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors ${selectedId === s.id ? 'bg-blue-50' : ''}`}
              >
                <div className="w-8 h-8 bg-green-100 text-green-700 rounded-lg flex items-center justify-center text-xs font-bold">
                  {s.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-xs text-gray-500 truncate">{s.email}{s.cpf ? ` · ${s.cpf}` : ''}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold">
                {selected.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500">{selected.email}</p>
              </div>
            </div>
            <button onClick={() => setSelectedId(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {sortedCourses.map(c => {
              const enr = enrollmentFor(c.id)
              const { state, expiresAt } = accessState(enr, c)
              const badge = ACCESS_BADGE[state]
              return (
                <div key={c.id} className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">
                      {c.price > 0 ? money(c.price) : 'Gratuito'}
                      {expiresAt && state !== 'blocked' && ` · ${state === 'expired' ? 'expirou' : 'expira'} em ${dateOnly(expiresAt)}`}
                      {enr?.admin_note ? ` · "${enr.admin_note}"` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {state === 'blocked' ? (
                      <button
                        onClick={() => onRestore(selected.id, c.id)}
                        disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reativar
                      </button>
                    ) : state === 'none' || state === 'expired' || state === 'free' ? (
                      <button
                        onClick={() => setGrantFor(c)}
                        disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> {state === 'expired' ? 'Renovar' : 'Liberar'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (!window.confirm(`Bloquear o acesso de ${selected.name} ao curso "${c.title}"? O progresso é mantido e você pode reativar depois.`)) return
                          const note = window.prompt('Motivo do bloqueio (opcional):') ?? undefined
                          onRevoke(selected.id, c.id, note)
                        }}
                        disabled={acting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-xs font-medium disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" /> Bloquear
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {grantFor && selected && (
        <GrantModal
          course={grantFor}
          studentName={selected.name}
          acting={acting}
          onClose={() => setGrantFor(null)}
          onConfirm={async (days, note) => {
            await onGrant(selected.id, grantFor.id, days, note)
            setGrantFor(null)
          }}
        />
      )}
    </div>
  )
}

function GrantModal({
  course, studentName, acting, onClose, onConfirm,
}: {
  course: AdminCourseLite
  studentName: string
  acting: boolean
  onClose: () => void
  onConfirm: (days: number | null, note?: string) => Promise<void>
}) {
  const [preset, setPreset] = useState<'lifetime' | '30' | '90' | 'custom'>(
    course.access_duration_days ? 'custom' : 'lifetime',
  )
  const [custom, setCustom] = useState(String(course.access_duration_days ?? 30))
  const [note, setNote] = useState('')

  const days = preset === 'lifetime' ? null : preset === 'custom' ? parseInt(custom, 10) || 0 : parseInt(preset, 10)
  const valid = preset === 'lifetime' || (days != null && days > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Liberar acesso</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
        </div>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">{studentName}</span> → <span className="font-medium text-gray-700">{course.title}</span>
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Duração do acesso</label>
          <div className="grid grid-cols-4 gap-2">
            {([['lifetime', 'Vitalício'], ['30', '30 dias'], ['90', '90 dias'], ['custom', 'Outro']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setPreset(id)}
                className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                  preset === id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <input
              type="number" min="1" value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="Dias"
              className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nota (opcional)</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ex.: cortesia, pagou por fora, bolsa…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={() => onConfirm(days, note.trim() || undefined)}
          disabled={!valid || acting}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-medium transition-colors"
        >
          {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Confirmar liberação
        </button>
      </div>
    </div>
  )
}

// =====================================================================
// ABA: PAGAMENTOS
// =====================================================================
function PaymentsTab({
  orders, acting, onSync, onSyncPending, onMarkPaid, onDelete,
}: {
  orders: AdminOrder[]
  acting: boolean
  onSync: (id: string) => Promise<void>
  onSyncPending: () => Promise<{ checked: number; changed: number; errors: string[] }>
  onMarkPaid: (id: string, note?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [status, setStatus] = useState<'all' | AdminOrder['status']>('all')
  const [method, setMethod] = useState<'all' | AdminOrder['payment_method']>('all')
  const [q, setQ] = useState('')
  const [syncingId, setSyncingId] = useState<string | null>(null)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const summary = useMemo(() => {
    const paid = orders.filter(o => o.status === 'paid')
    const pending = orders.filter(o => o.status === 'pending')
    const todayStr = new Date().toDateString()
    const pixToday = orders.filter(o => o.payment_method === 'pix' && new Date(o.created_at).toDateString() === todayStr)
    return {
      received: paid.reduce((s, o) => s + Number(o.gross_amount ?? o.amount), 0),
      pendingCount: pending.length,
      pixToday: pixToday.length,
      conversion: orders.length ? Math.round((paid.length / orders.length) * 100) : 0,
    }
  }, [orders])

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase()
    return orders.filter(o => {
      if (status !== 'all' && o.status !== status) return false
      if (method !== 'all' && o.payment_method !== method) return false
      if (!t) return true
      return [o.user_name, o.user_email, o.user_cpf, o.asaas_payment_id, o.course_title]
        .some(v => (v ?? '').toLowerCase().includes(t))
    })
  }, [orders, status, method, q])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Recebido" value={money(summary.received)} icon={DollarSign} tone="green" />
        <SummaryCard label="Pendentes" value={String(summary.pendingCount)} icon={Clock} tone="amber" />
        <SummaryCard label="Pix gerados hoje" value={String(summary.pixToday)} icon={QrCode} tone="blue" />
        <SummaryCard label="Conversão" value={`${summary.conversion}%`} icon={ShieldCheck} tone="purple" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Buscar por aluno, e-mail, CPF, curso ou ID Asaas"
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos os status</option>
            <option value="pending">Aguardando</option>
            <option value="paid">Pago</option>
            <option value="expired">Expirado</option>
            <option value="failed">Falhou</option>
            <option value="refunded">Estornado</option>
          </select>
          <select value={method} onChange={e => setMethod(e.target.value as any)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos os métodos</option>
            <option value="pix">Pix</option>
            <option value="credit_card">Cartão</option>
            <option value="boleto">Boleto</option>
          </select>
          <button
            onClick={async () => {
              setSyncMsg(null)
              try {
                const r = await onSyncPending()
                setSyncMsg(`${r.checked} pedido(s) verificados, ${r.changed} atualizado(s).${r.errors.length ? ` ${r.errors.length} com erro.` : ''}`)
              } catch { /* erro já vai pro banner global */ }
            }}
            disabled={acting}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${acting ? 'animate-spin' : ''}`} /> Sincronizar pendentes
          </button>
        </div>

        {syncMsg && <p className="px-4 py-2 text-xs text-blue-700 bg-blue-50">{syncMsg}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-medium text-gray-600">Aluno</th>
                <th className="p-3 text-left font-medium text-gray-600">Curso</th>
                <th className="p-3 text-left font-medium text-gray-600">Método</th>
                <th className="p-3 text-left font-medium text-gray-600">Valor</th>
                <th className="p-3 text-left font-medium text-gray-600">Status</th>
                <th className="p-3 text-left font-medium text-gray-600">Gerado</th>
                <th className="p-3 text-left font-medium text-gray-600">Pago</th>
                <th className="p-3 text-right font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-gray-400">Nenhum pedido encontrado.</td></tr>
              )}
              {filtered.map(o => {
                const m = METHOD_META[o.payment_method]
                const sb = ORDER_STATUS_BADGE[o.status]
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <p className="font-medium text-gray-900">{o.user_name ?? '—'}</p>
                      <p className="text-xs text-gray-500">{o.user_email}</p>
                    </td>
                    <td className="p-3 text-gray-700">{o.course_title ?? o.course_id}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1.5 text-gray-700">
                        <m.Icon className="w-3.5 h-3.5" /> {m.label}
                        {o.installment_count && o.installment_count > 1 ? ` ${o.installment_count}x` : ''}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">
                      {money(o.gross_amount ?? o.amount)}
                      {o.gross_amount && o.gross_amount !== o.amount && (
                        <span className="block text-xs text-gray-400">líq. {money(o.amount)}</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${sb.cls}`}>{sb.label}</span>
                      {o.status === 'pending' && o.pix_expires_at && (
                        <span className="block text-[11px] text-gray-400 mt-0.5">expira {dateOnly(o.pix_expires_at)}</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{dateTime(o.created_at)}</td>
                    <td className="p-3 text-gray-500 whitespace-nowrap">{dateTime(o.paid_at)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.asaas_payment_id && (
                          <button
                            onClick={async () => { setSyncingId(o.id); try { await onSync(o.id) } finally { setSyncingId(null) } }}
                            disabled={acting}
                            title="Sincronizar com o Asaas"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${syncingId === o.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        {o.status !== 'paid' && (
                          <button
                            onClick={() => {
                              if (!window.confirm(`Marcar o pedido de ${o.user_name} como PAGO e liberar o acesso ao curso "${o.course_title}"?`)) return
                              const note = window.prompt('Nota (opcional):') ?? undefined
                              onMarkPaid(o.id, note)
                            }}
                            disabled={acting}
                            title="Marcar como pago manualmente"
                            className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {o.asaas_payment_id && (
                          <a
                            href={`https://www.asaas.com/i/${o.asaas_payment_id}`}
                            target="_blank" rel="noopener noreferrer"
                            title="Abrir no Asaas"
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => {
                            if (!window.confirm(`Excluir este pedido (${money(o.gross_amount ?? o.amount)} · ${o.user_name ?? o.user_id})? Não afeta a matrícula — o acesso é gerido na aba "Liberar acesso".`)) return
                            onDelete(o.id)
                          }}
                          disabled={acting}
                          title="Excluir pedido"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof QrCode; tone: 'green' | 'amber' | 'blue' | 'purple' }) {
  const tones = {
    green: 'text-green-600', amber: 'text-amber-600', blue: 'text-blue-600', purple: 'text-purple-600',
  }
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${tones[tone]}`} />
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

// =====================================================================
// ABA: HISTÓRICO
// =====================================================================
function HistoryTab({ audit }: { audit: ReturnType<typeof useAdminManageStore.getState>['audit'] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-5 border-b border-gray-100 flex items-center gap-2">
        <History className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold text-gray-900">Histórico de ações</h2>
      </div>
      {audit.length === 0 ? (
        <div className="p-8 text-center text-gray-400 text-sm">Nenhuma ação registrada ainda.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {audit.map(a => (
            <div key={a.id} className="p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{AUDIT_LABEL[a.action] ?? a.action}</span>
                  {a.target_user_name && <> · {a.target_user_name}</>}
                  {a.course_title && <> · <span className="text-gray-600">{a.course_title}</span></>}
                </p>
                <p className="text-xs text-gray-400">
                  {dateTime(a.created_at)} · por {a.admin_name ?? 'admin'}
                  {a.detail?.note ? ` · "${String(a.detail.note)}"` : ''}
                  {a.action === 'sync_pending' && a.detail
                    ? ` · ${String((a.detail as Record<string, unknown>).changed)}/${String((a.detail as Record<string, unknown>).checked)} atualizados`
                    : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
