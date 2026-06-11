import { Trash2, Pencil, Calendar, Clock } from 'lucide-react'
import { getStoredPostponeNote } from '../../utils/postponeNote'

const STATUS_MAP = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  done: { label: 'Completada', color: 'bg-green-100 text-green-700' },
  postponed: { label: 'Postergada', color: 'bg-gray-100 text-gray-700' },
  overdue: { label: 'Vencida', color: 'bg-red-100 text-red-700' },
}

const SubtaskCard = ({ subtask, onEdit, onDelete, deleting, isDailyCapacityConflict = false }) => {
  const status = STATUS_MAP[subtask.status] || STATUS_MAP.pending
  const postponedNote = (subtask?.note && String(subtask.note).trim()) || getStoredPostponeNote(subtask?.id)

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split('-')
    const date = new Date(year, month - 1, day) // ← sin UTC, usa hora local
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{subtask.title}</h3>
        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* Descripción */}
      {subtask.description && (
        <p className="text-xs text-gray-500">{subtask.description}</p>
      )}

      {/* Info */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        {subtask.target_date && subtask.status !== 'postponed' && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {formatDate(subtask.target_date)}
          </span>
        )}
        {subtask.estimated_hours && (
          isDailyCapacityConflict ? (
            <span className="flex items-center gap-1">
              ⚠️ {subtask.estimated_hours}h estimadas
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {subtask.estimated_hours}h estimadas
            </span>
          )
        )}
      </div>

      {subtask.status === 'postponed' && Boolean(postponedNote && String(postponedNote).trim()) && (
        <div className="w-full px-4 py-3 rounded-lg bg-[#F8FAFC] border border-dashed border-zinc-300 text-zinc-500 text-sm font-semibold text-center whitespace-pre-wrap">
          {String(postponedNote).trim()}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onEdit(subtask)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
        >
          <Pencil size={12} /> Editar
        </button>
        <button
          onClick={() => onDelete(subtask.id)}
          disabled={deleting}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 size={12} />
          {deleting ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>

    </div>
  )
}

export default SubtaskCard