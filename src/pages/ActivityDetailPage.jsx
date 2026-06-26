import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Calendar, RotateCcw } from 'lucide-react'
import { useActivity } from '../hooks/useActivity'
import { useSubtasks } from '../hooks/useSubtasks'
import { updateActivity, deleteActivity } from '../services/activityService'
import { updateSubtask } from '../services/subtaskService'
import SubtaskCard from '../components/activities/SubtaskCard'
import SubtaskForm from '../components/activities/SubtaskForm'
import Modal from '../components/Modal'
import { syncDailyCapacityConflictWithBackend } from '../utils/dailyCapacityConflict'
import { parseOverloadError } from '../utils/errorUtils'
import { calcActivityProgress } from '../utils/progressUtils'
import ActivityProgressSummary from '../components/progress/ActivityProgressSummary'

const ACTIVITY_TYPES_MAP = {
  exam: 'Examen',
  quiz: 'Quiz',
  project: 'Proyecto',
  homework: 'Tarea',
  presentation: 'Presentación',
}

const ACTIVITY_TYPES_OPTIONS = [
  { value: 'exam', label: 'Examen' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'project', label: 'Proyecto' },
  { value: 'homework', label: 'Tarea' },
  { value: 'presentation', label: 'Presentación' },
]
import { getLocalTodayStr } from '../utils/dateUtils'

const todayStr = getLocalTodayStr()
function ActivityDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activity, viewState, reload } = useActivity(id)
  const { subtasks, loading: subtaskLoading, error: subtaskError, addSubtask, editSubtask, removeSubtask } = useSubtasks(activity)

  const [form, setForm] = useState({
    title: '',
    type: '',
    course: '',
    due_date: '',
    weight: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    onConfirm: null,
  })
  const [fieldErrors, setFieldErrors] = useState({}) // ← agregar esto
  const [showForm, setShowForm] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [searchParams] = useSearchParams()
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')

  // --- US-07/08: Estado para conflicto de sobrecarga ---
  const [conflictModal, setConflictModal] = useState({
    isOpen: false,
    subtask: null,
    conflictData: null
  })
  const [rescheduleModal, setRescheduleModal] = useState({
    isOpen: false,
    subtask: null,
    newDate: ''
  })
  const [reduceModal, setReduceModal] = useState({
    isOpen: false,
    subtask: null,
    newDate: '',
    newHours: 0
  })
  const [isResolving, setIsResolving] = useState(false)

  // Cuando carga la actividad, llena el formulario con sus datos
  useEffect(() => {
    if (activity) {
      const savedDate = activity.due_date || ''
      setForm({
        title: activity.title || '',
        type: activity.type || '',
        course: activity.course || '',
        due_date: savedDate,
        weight: activity.weight ?? '',
      })
    }
  }, [activity])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Limpia el error del campo cuando el usuario lo corrige
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()

    const errors = {}

    if (!form.title.trim()) {
      errors.title = 'El título es obligatorio.'
    }

    if (!form.type) {
      errors.type = 'Debes seleccionar un tipo de actividad.'
    }

    if (!form.due_date) {
      errors.due_date = 'La fecha límite es obligatoria.'
    } else if (
      form.due_date !== activity.due_date &&
      form.due_date < todayStr
    ) {
      errors.due_date = 'La fecha límite debe ser mayor o igual a hoy.'
    }

    if (form.weight !== '') {
      const w = parseFloat(form.weight)
      if (isNaN(w) || w < 0 || w > 100) {
        errors.weight = 'El peso debe ser un número entre 0 y 100.'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSaving(true)
    try {
      await updateActivity(id, {
        ...form,
        weight: form.weight !== '' ? parseFloat(form.weight) : null,
      })
      setIsEditing(false) // ← volver a vista de detalle
      reload() // Recarga la actividad desde el backend
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Actividad Editada',
        message: 'La actividad ha sido editada de manera exitosa.',
        onConfirm: null,
      })
    } catch (err) {
      // Extract specific field errors from backend response
      const backendErrors = err.response?.data?.errors;
      let errorMessage = 'Ha ocurrido un error intentando editar la actividad. Inténtelo de nuevo.';

      if (backendErrors) {
        // Check for due_date conflict with subtasks
        if (backendErrors.due_date) {
          const dueDateErr = Array.isArray(backendErrors.due_date) ? backendErrors.due_date[0] : backendErrors.due_date;
          errorMessage = dueDateErr;
        } else {
          // Collect all field errors
          const messages = Object.values(backendErrors).flat();
          if (messages.length > 0) {
            errorMessage = messages.join(' ');
          }
        }
      }

      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al editar',
        message: errorMessage,
        onConfirm: null,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = () => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: '¿Eliminar actividad?',
      message: 'Esta acción eliminará la actividad y todas sus subtareas. No se puede deshacer.',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }))
        setDeleting(true)
        try {
          await deleteActivity(id)
          await syncDailyCapacityConflictWithBackend()
          setModalConfig({
            isOpen: true,
            type: 'success',
            title: 'Actividad Eliminada',
            message: 'La actividad ha sido eliminada de manera exitosa junto con sus tareas.',
            onConfirm: () => navigate('/hoy'),
          })
        } catch {
          setModalConfig({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Ha ocurrido un error eliminando la actividad. Inténtelo de nuevo.',
            onConfirm: null,
          })
          setDeleting(false)
        }
      },
    })
  }

  const handleAddSubtask = async (data) => {
    const result = await addSubtask(data)
    if (result === true) {
      setShowForm(false)
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: '¡Subtarea creada!',
        message: 'La subtarea fue creada correctamente.',
        onConfirm: null,
      })
    } else if (result?.error && result?.rawError) {
      const { isOverloadConflict, conflictMessage, errorMessage, conflictPayload } = parseOverloadError(result.rawError, 'Ha ocurrido un error al crear la subtarea. Inténtelo de nuevo.')
      if (isOverloadConflict) {
        setConflictModal({
          isOpen: true,
          subtask: data,
          conflictData: {
            message: conflictMessage || errorMessage,
            attemptedDate: data.target_date,
            payload: conflictPayload,
            isNew: true,
            activityId: activity?.id
          }
        })
      } else {
        setModalConfig({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: errorMessage,
          onConfirm: null,
        })
      }
    } else {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Ha ocurrido un error al crear la subtarea. Inténtelo de nuevo.',
        onConfirm: null,
      })
    }
  }

  const handleEditSubtask = async (data) => {
    const result = await editSubtask(editingSubtask.id, data)
    if (result === true) {
      setEditingSubtask(null)
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: '¡Subtarea editada!',
        message: 'La subtarea fue editada correctamente.',
        onConfirm: null,
      })
    } else if (result?.error && result?.rawError) {
      const { isOverloadConflict, conflictMessage, errorMessage, conflictPayload } = parseOverloadError(result.rawError, 'Ha ocurrido un error al editar la subtarea. Inténtelo de nuevo.')
      if (isOverloadConflict) {
        setEditingSubtask(null)
        setConflictModal({
          isOpen: true,
          subtask: { ...editingSubtask, ...data },
          conflictData: {
            message: conflictMessage || errorMessage,
            attemptedDate: data.target_date || editingSubtask.target_date,
            payload: conflictPayload
          }
        })
      } else {
        setModalConfig({
          isOpen: true,
          type: 'error',
          title: 'Error',
          message: errorMessage,
          onConfirm: null,
        })
      }
    } else {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Ha ocurrido un error al editar la subtarea. Inténtelo de nuevo.',
        onConfirm: null,
      })
    }
  }

  // --- US-08: Handlers para resolver conflicto desde detalle ---
  const handleConflictRescheduleConfirm = async () => {
    if (!rescheduleModal.subtask || !rescheduleModal.newDate) return
    setIsResolving(true)
    try {
      const subtaskId = rescheduleModal.subtask.id
      const response = await updateSubtask(subtaskId, {
        target_date: rescheduleModal.newDate,
        status: 'pending'
      })
      setRescheduleModal({ isOpen: false, subtask: null, newDate: '' })

      if (response?.exceeds) {
        setConflictModal({
          isOpen: true,
          subtask: rescheduleModal.subtask,
          conflictData: {
            message: response.message,
            attemptedDate: rescheduleModal.newDate,
            payload: {
              planned_hours: response.planned_hours,
              limit_hours: response.limit_hours,
              exceeds_by: response.exceeds_by,
              hours_to_reduce: response.exceeds_by,
              min_hours: 0.5,
              alternative_dates: []
            }
          }
        })
        reload()
        return
      }

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: response?.resolved ? 'Conflicto resuelto' : 'Reprogramar',
        message: response?.resolved
          ? 'La subtarea fue reprogramada y el conflicto de sobrecarga fue resuelto.'
          : 'La fecha de la subtarea se actualizó correctamente.',
        onConfirm: null,
      })
      reload()
    } catch (error) {
      const { isOverloadConflict, conflictMessage, errorMessage, conflictPayload } = parseOverloadError(error, 'Ha ocurrido un error reprogramando la subtarea.')
      if (isOverloadConflict) {
        setRescheduleModal({ isOpen: false, subtask: null, newDate: '' })
        setConflictModal({
          isOpen: true,
          subtask: rescheduleModal.subtask,
          conflictData: { message: conflictMessage || errorMessage, attemptedDate: rescheduleModal.newDate, payload: conflictPayload }
        })
        return
      }
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al actualizar',
        message: errorMessage,
        onConfirm: null,
      })
    } finally {
      setIsResolving(false)
    }
  }

  const handleConflictReduceConfirm = async () => {
    if (!reduceModal.subtask || !reduceModal.newDate || reduceModal.newHours <= 0) return
    setIsResolving(true)
    try {
      const subtaskId = reduceModal.subtask.id
      const response = await updateSubtask(subtaskId, {
        target_date: reduceModal.newDate,
        estimated_hours: reduceModal.newHours,
        status: 'pending'
      })
      setReduceModal({ isOpen: false, subtask: null, newDate: '', newHours: 0 })

      if (response?.exceeds) {
        setConflictModal({
          isOpen: true,
          subtask: { ...reduceModal.subtask, estimated_hours: reduceModal.newHours },
          conflictData: {
            message: response.message,
            attemptedDate: reduceModal.newDate,
            payload: {
              planned_hours: response.planned_hours,
              limit_hours: response.limit_hours,
              exceeds_by: response.exceeds_by,
              hours_to_reduce: response.exceeds_by,
              min_hours: 0.5,
              alternative_dates: []
            }
          }
        })
        reload()
        return
      }

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: response?.resolved ? 'Conflicto resuelto' : 'Horas reducidas',
        message: response?.resolved
          ? 'Las horas fueron reducidas y el conflicto de sobrecarga fue resuelto.'
          : 'La fecha y las horas de la subtarea se actualizaron correctamente.',
        onConfirm: null,
      })
      reload()
    } catch (error) {
      const { isOverloadConflict, conflictMessage, errorMessage, conflictPayload } = parseOverloadError(error, 'Ha ocurrido un error al actualizar las horas.')
      if (isOverloadConflict) {
        setReduceModal({ isOpen: false, subtask: null, newDate: '', newHours: 0 })
        setConflictModal({
          isOpen: true,
          subtask: reduceModal.subtask,
          conflictData: { message: conflictMessage || errorMessage, attemptedDate: reduceModal.newDate, payload: conflictPayload }
        })
        return
      }
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Error al actualizar',
        message: errorMessage,
        onConfirm: null,
      })
    } finally {
      setIsResolving(false)
    }
  }

  const formatDateShort = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + "T00:00:00")
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    return `${d.getDate()} ${months[d.getMonth()]}`
  }

  const formatDateLong = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr + "T00:00:00")
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    return `${d.getDate()} de ${months[d.getMonth()]}`
  }

  const handleDeleteSubtask = async (subtaskId) => {
    setModalConfig({
      isOpen: true,
      type: 'warning',
      title: '¿Eliminar subtarea?',
      message: 'Esta acción eliminará la subtarea. No se puede deshacer.',
      onConfirm: async () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }))
        setDeletingId(subtaskId)
        const ok = await removeSubtask(subtaskId)
        setDeletingId(null)
        if (ok) {
          setModalConfig({
            isOpen: true,
            type: 'success',
            title: 'Subtarea eliminada',
            message: 'La subtarea fue eliminada correctamente.',
            onConfirm: null,
          })
        } else {
          setModalConfig({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Ha ocurrido un error al eliminar la subtarea. Inténtelo de nuevo.',
            onConfirm: null,
          })
        }
      },
    })
  }

  // Estados de carga
  if (viewState === 'loading') {
    return <p className="text-gray-500 text-sm">Cargando actividad...</p>
  }

  if (viewState === 'error') {
    return <p className="text-red-500 text-sm">No se pudo cargar la actividad.</p>
  }

  return (
    <div className="w-full mx-auto p-8">

      {/* Volver */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Volver a actividades
      </button>

      {/* Vista detalle o edición */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">

        {isEditing ? (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Editar Actividad</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              {/* Título */}
              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-700 font-medium">Título *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={`bg-gray-50 text-gray-900 rounded-lg px-4 py-2 text-sm outline-none border transition-colors
                    ${fieldErrors.title ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                />
                {fieldErrors.title && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>
                )}
              </div>

              {/* Tipo y Curso */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm text-gray-700 font-medium">Tipo *</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className={`bg-gray-50 text-gray-900 rounded-lg px-4 py-2 text-sm outline-none border transition-colors
                      ${fieldErrors.type ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                  >
                    <option value="">Selecciona un tipo</option>
                    {ACTIVITY_TYPES_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {fieldErrors.type && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.type}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm text-gray-700 font-medium">Curso <span className="text-gray-400">(opcional)</span></label>
                  <input
                    type="text"
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    className="bg-gray-50 text-gray-900 rounded-lg px-4 py-2 text-sm outline-none border border-gray-200 focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>

              {/* Fecha y Peso */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm text-gray-700 font-medium">Fecha límite *</label>
                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    className={`bg-gray-50 text-gray-900 rounded-lg px-4 py-2 text-sm outline-none border transition-colors
                      ${fieldErrors.due_date ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                  />
                  {fieldErrors.due_date && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.due_date}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-sm text-gray-700 font-medium">
                    Peso <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={form.weight}
                    onChange={handleChange}
                    placeholder="Ej: 30"
                    className={`bg-gray-50 text-gray-900 rounded-lg px-4 py-2 text-sm outline-none border transition-colors
                      ${fieldErrors.weight ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
                  />
                  {fieldErrors.weight && (
                    <p className="text-red-500 text-sm mt-1">{fieldErrors.weight}</p>
                  )}
                </div>
              </div>

              {/* Mensajes
               Eliminados en favor del Modal. */}

              {/* Botones */}
              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white font-semibold rounded-lg py-2 px-6 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="bg-white text-gray-700 font-semibold rounded-lg py-2 px-6 text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={deleting}
                  className="ml-auto text-red-500 font-semibold rounded-lg py-2 px-6 text-sm border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar actividad'}
                </button>
              </div>

            </form>
          </>
        ) : (
          <>
            {/* Vista solo lectura */}
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{activity.title}</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Editar
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm text-gray-700">
              <div className="flex gap-2">
                <span className="font-medium text-gray-500">Tipo:</span>
                <span>{ACTIVITY_TYPES_MAP[activity.type] || activity.type}</span>
              </div>
              {activity.course && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-500">Curso:</span>
                  <span>{activity.course}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="font-medium text-gray-500">Fecha límite:</span>
                <span>{activity.due_date}</span>
              </div>
              {activity.weight !== null && (
                <div className="flex gap-2">
                  <span className="font-medium text-gray-500">Peso:</span>
                  <span>{activity.weight}%</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={deleting}
              className="mt-5 text-red-500 font-semibold rounded-lg py-2 px-6 text-sm border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Eliminar actividad'}
            </button>
          </>
        )}
      </div>

      {/* Progreso US-10 */}
      {!isEditing && (
        <div className="mb-6">
          <ActivityProgressSummary
            {...calcActivityProgress(subtasks)}
          />
        </div>
      )}

      {/* Subtareas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Subtareas
            {subtasks.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({subtasks.length})</span>
            )}
          </h2>
          {!showForm && !editingSubtask && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Agregar subtarea
            </button>
          )}
        </div>

        {/* Error de subtareas */}
        {subtaskError && (
          <p className="text-red-500 text-sm mb-4">
            {typeof subtaskError === 'string' ? subtaskError : subtaskError?.message || 'Error en las subtareas'}
          </p>
        )}

        {/* Formulario crear */}
        {showForm && (
          <div className="mb-4">
            <SubtaskForm
              onSubmit={handleAddSubtask}
              onCancel={() => setShowForm(false)}
              loading={subtaskLoading}
              activityDueDate={activity.due_date} // ← agregar
            />
          </div>
        )}

        {/* Lista de subtareas */}
        {subtasks.length === 0 && !showForm ? (
          <p className="text-gray-400 text-sm">No hay subtareas aún. ¡Agrega una!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {subtasks.map((subtask) => (
              editingSubtask?.id === subtask.id ? (
                <SubtaskForm
                  key={subtask.id}
                  initialData={editingSubtask}
                  onSubmit={handleEditSubtask}
                  onCancel={() => setEditingSubtask(null)}
                  loading={subtaskLoading}
                  activityDueDate={activity.due_date} // ← agregar
                />
              ) : (
                <SubtaskCard
                  key={subtask.id}
                  subtask={subtask}
                  onEdit={(s) => { setEditingSubtask(s); setShowForm(false) }}
                  onDelete={handleDeleteSubtask}
                  deleting={deletingId === subtask.id}
                />
              )
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
      />

      {/* US-07/08: Modal de conflicto de sobrecarga */}
      <Modal
        isOpen={conflictModal.isOpen}
        onClose={() => setConflictModal({ isOpen: false, subtask: null, conflictData: null })}
        title="Conflicto de sobrecarga"
        icon={<AlertTriangle size={22} className="text-amber-500" />}
        hideFooter={true}
        size="lg"
      >
        {conflictModal.conflictData && (() => {
          const payload = conflictModal.conflictData.payload;
          const alternativeDates = payload?.alternative_dates || [];
          const alternativeDate = alternativeDates[0];
          const hoursToReduce = payload?.hours_to_reduce;
          const minHours = payload?.min_hours || 0.5;
          const subtaskHours = conflictModal.subtask?.estimated_hours || 0;
          const plannedHours = payload?.planned_hours;
          const limitHoursVal = payload?.limit_hours;

          let reducedHoursValue = subtaskHours;
          let reducedHoursLabel = 'Reducir horas estimadas';
          if (hoursToReduce > 0 && subtaskHours > hoursToReduce) {
            reducedHoursValue = Math.max(subtaskHours - hoursToReduce, minHours);
            reducedHoursLabel = `Reducir a ${reducedHoursValue}h`;
          } else if (hoursToReduce > 0 && subtaskHours <= hoursToReduce) {
            reducedHoursValue = 0;
          }

          return (
            <div className="flex flex-col">
              <p className="text-slate-600 font-medium text-[15px] mb-4">
                {conflictModal.conflictData.message}
              </p>

              {plannedHours !== undefined && limitHoursVal !== undefined && (
                <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">
                    {plannedHours}h planificadas de {limitHoursVal}h disponibles
                  </p>
                </div>
              )}

              <p className="text-slate-500 font-medium text-[14px] mb-3">
                ¿Cómo deseas resolverlo?
              </p>

              <div className="flex flex-col gap-2.5 mb-4">
                {conflictModal.subtask?.id && (
                  <button
                    onClick={() => {
                      const subtask = conflictModal.subtask;
                      setConflictModal({ isOpen: false, subtask: null, conflictData: null });
                      setRescheduleModal({
                        isOpen: true,
                        subtask: subtask,
                        newDate: alternativeDate || subtask.target_date || ''
                      });
                    }}
                    className="flex items-center gap-2 bg-[#3b82f6] text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-blue-600 transition-colors shadow-sm w-full"
                  >
                    <Calendar size={18} strokeWidth={2.5} />
                    {alternativeDate ? `Mover al ${formatDateLong(alternativeDate)}` : 'Mover a otro día'}
                  </button>
                )}

                {alternativeDates.length > 1 && conflictModal.subtask?.id && (
                  <div className="flex flex-wrap gap-1.5 pl-1">
                    <span className="text-xs text-slate-400 font-medium">Otras fechas disponibles:</span>
                    {alternativeDates.slice(1).map((altDate) => (
                      <button
                        key={altDate}
                        onClick={() => {
                          const subtask = conflictModal.subtask;
                          setConflictModal({ isOpen: false, subtask: null, conflictData: null });
                          setRescheduleModal({
                            isOpen: true,
                            subtask: subtask,
                            newDate: altDate
                          });
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors"
                      >
                        {formatDateLong(altDate)}
                      </button>
                    ))}
                  </div>
                )}

                {reducedHoursValue > 0 && conflictModal.subtask?.id && (
                  <button
                    onClick={() => {
                      const subtask = conflictModal.subtask;
                      const targetDate = conflictModal.conflictData.attemptedDate || subtask.target_date;
                      setConflictModal({ isOpen: false, subtask: null, conflictData: null });
                      setReduceModal({
                        isOpen: true,
                        subtask: subtask,
                        newDate: targetDate,
                        newHours: reducedHoursValue
                      });
                    }}
                    className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-slate-200 transition-colors w-full"
                  >
                    <RotateCcw size={18} strokeWidth={2.5} /> {reducedHoursLabel}
                  </button>
                )}
              </div>

              <button
                onClick={() => setConflictModal({ isOpen: false, subtask: null, conflictData: null })}
                className="text-slate-500 text-[13px] font-medium hover:text-slate-700 transition-colors self-end"
              >
                Cancelar
              </button>
            </div>
          );
        })()}
      </Modal>

      {/* US-08: Modal reprogramar desde conflicto */}
      <Modal
        isOpen={rescheduleModal.isOpen}
        onClose={() => setRescheduleModal({ isOpen: false, subtask: null, newDate: '' })}
        onConfirm={handleConflictRescheduleConfirm}
        title="Reprogramar"
        confirmText="Reprogramar"
        showCancel={true}
        isLoading={isResolving}
      >
        <div className="py-2">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700">Elige una nueva fecha</label>
            <input
              type="date"
              value={rescheduleModal.newDate}
              onChange={(e) => setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })}
              className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </Modal>

      {/* US-08: Modal reducir horas desde conflicto */}
      <Modal
        isOpen={reduceModal.isOpen}
        onClose={() => setReduceModal({ isOpen: false, subtask: null, newDate: '', newHours: 0 })}
        onConfirm={handleConflictReduceConfirm}
        title="Reducir horas estimadas"
        confirmText="Guardar"
        showCancel={true}
        isLoading={isResolving}
      >
        <div className="py-2">
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Ajusta el tiempo que le dedicarás a esta tarea el <b>{formatDateShort(reduceModal.newDate)}</b> para no exceder tu límite.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-zinc-700">Nuevas horas estimadas</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={reduceModal.newHours}
                onChange={(e) => setReduceModal({ ...reduceModal, newHours: parseFloat(e.target.value) || '' })}
                className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ActivityDetailPage