import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Plus, X, ListTodo } from 'lucide-react'
import { createActivity } from '../services/activityService'
import Modal from '../components/Modal'
import SubtaskForm from '../components/activities/SubtaskForm'

import { getLocalTodayStr } from '../utils/dateUtils'

const todayStr = getLocalTodayStr()
const ACTIVITY_TYPES = [
  { value: 'exam', label: 'Examen' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'project', label: 'Proyecto' },
  { value: 'homework', label: 'Tarea' },
  { value: 'presentation', label: 'Presentación' },
]

const INITIAL_FORM = {
  title: '',
  type: '',
  course: '',
  due_date: '',
  weight: '',
}

// Validaciones del frontend — retorna un objeto con los errores encontrados
const validateForm = (form, subtasks = []) => {
  const errors = {}

  if (!form.title.trim()) {
    errors.title = 'El título es obligatorio.'
  }

  if (!form.type) {
    errors.type = 'Debes seleccionar un tipo de actividad.'
  }

  if (!form.due_date) {
    errors.due_date = 'La fecha límite es obligatoria.'
  } else if (form.due_date < todayStr) {
    errors.due_date = 'La fecha límite debe ser mayor o igual a hoy.'
  } else if (subtasks.some(s => s.target_date > form.due_date)) {
    errors.due_date = 'La fecha límite no puede ser anterior a las fechas de sus subtareas.'
  }

  if (form.weight !== '') {
    const w = parseFloat(form.weight)
    if (isNaN(w) || w < 0 || w > 100) {
      errors.weight = 'El peso debe ser un número entre 0 y 100.'
    }
  }

  return errors
}


function CreatePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [subtasks, setSubtasks] = useState([])
  const [showSubtaskForm, setShowSubtaskForm] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    // Limpia el error del campo cuando el usuario empieza a corregirlo
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    const errors = validateForm(form, subtasks)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return // No manda nada al backend si hay errores
    }

    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(),
        type: form.type,
        course: form.course.trim(),
        due_date: form.due_date,
        weight: form.weight !== '' ? parseFloat(form.weight) : null,
        subtasks: subtasks // array con las subtareas a crear
      }
      await createActivity(payload)
      setShowSuccessModal(true) // mostrar modal en lugar de navegar directo
    } catch (err) {
      // Intenta mostrar el mensaje específico que manda Django
      const data = err.response?.data
      if (err.response?.status === 409) {
        // Parse the error message to get the date: "La fecha YYYY-MM-DD quedaría con..."
        const match = data?.message?.match(/La fecha (\d{4}-\d{2}-\d{2})/)
        if (match) {
          const conflictDate = match[1]
          const conflictSubtask = subtasks.find(s => s.target_date === conflictDate)
          if (conflictSubtask) {
            setServerError(`Reduce el número de horas o cambia la fecha sugerida de la subtarea "${conflictSubtask.title}" para poder crear la actividad.`)
          } else {
             setServerError('Reduce el número de horas o cambia las fechas de las subtareas para poder crear la actividad.')
          }
        } else {
           setServerError('Reduce el número de horas o cambia las fechas de las subtareas para poder crear la actividad.')
        }
      } else if (data?.errors) {
        // El backend mandó errores por campo, los mapeamos
        setFieldErrors(data.errors)
      } else {
        setServerError('Ocurrió un error al crear la actividad. Intenta de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddSubtask = (subtaskData) => {
    setSubtasks((prev) => [...prev, { ...subtaskData, id: Date.now() }])
    setShowSubtaskForm(false)
  }

  const handleRemoveSubtask = (idToRemove) => {
    setSubtasks((prev) => prev.filter(s => s.id !== idToRemove))
  }

  return (
    <div className="max-w-2xl mx-auto mt-10">

      {/* Modal éxito */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => navigate('/actividades')}
        onConfirm={() => navigate('/actividades')}
        title="¡Actividad creada!"
        message="La actividad fue creada correctamente."
        type="success"
        confirmText="Aceptar"
      />

      {/* Header centrado */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-[#0B1525] mb-2 tracking-tight">Crear nueva actividad</h1>
        <p className="text-zinc-500 text-sm font-medium">Completa los datos de tu actividad evaluativa</p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* Título */}
          <div className="flex flex-col gap-1">
            <label htmlFor="activity-title" className="text-sm text-gray-700 font-medium">Título *</label>
            <input
              id="activity-title"
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ej: Parcial de Cálculo"
              className={`bg-gray-50 text-gray-900 rounded-lg px-4 py-3 text-sm outline-none border transition-colors
                ${fieldErrors.title ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
            />
            {fieldErrors.title && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label htmlFor="activity-type" className="text-sm text-gray-700 font-medium">Tipo *</label>
            <div className="relative">
              <select
                id="activity-type"
                name="type"
                value={form.type}
                onChange={handleChange}
                className={`w-full bg-gray-50 text-gray-900 rounded-lg pl-4 pr-10 py-3 text-sm outline-none border transition-colors appearance-none cursor-pointer
                  ${fieldErrors.type ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
              >
                <option value="">Selecciona un tipo</option>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={16} />
              </div>
            </div>
            {fieldErrors.type && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.type}</p>
            )}
          </div>

          {/* Curso */}
          <div className="flex flex-col gap-1">
            <label htmlFor="activity-course" className="text-sm text-gray-700 font-medium">
              Curso <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="activity-course"
              type="text"
              name="course"
              value={form.course}
              onChange={handleChange}
              placeholder="Ej: Cálculo III"
              className="bg-gray-50 text-gray-900 rounded-lg px-4 py-3 text-sm outline-none border border-gray-200 focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Separador */}
          <hr className="border-gray-100" />

          {/* Fecha y Peso en la misma fila */}
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="activity-due-date" className="text-sm text-gray-700 font-medium">Fecha límite *</label>
              <input
                id="activity-due-date"
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                className={`w-full bg-gray-50 text-gray-900 rounded-lg px-4 py-3 text-sm outline-none border transition-colors cursor-pointer
                  ${fieldErrors.due_date ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
              />
              {fieldErrors.due_date && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.due_date}</p>
              )}
            </div>

            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="activity-weight" className="text-sm text-gray-700 font-medium">
                Peso <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                id="activity-weight"
                type="number"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                placeholder="Ej: 30"
                className={`bg-gray-50 text-gray-900 rounded-lg px-4 py-3 text-sm outline-none border transition-colors
                  ${fieldErrors.weight ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
              />
              {fieldErrors.weight && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.weight}</p>
              )}
            </div>
          </div>

          {/* Error general del servidor */}
          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <p className="text-red-500 text-sm">{serverError}</p>
            </div>
          )}

          {/* Subtareas */}
          <div className="flex flex-col gap-3 mt-2">
            <h2 className="text-lg font-bold text-gray-900">Subtareas</h2>

            {/* Lista de subtareas agendadas */}
            {subtasks.length > 0 && (
              <div className="flex flex-col gap-2">
                {subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg group">
                    <div className="flex items-start gap-3">
                      <ListTodo size={18} className="text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 leading-none mb-1">{subtask.title}</p>
                        <p className="text-xs text-gray-500">
                          {subtask.target_date ? `Fecha: ${subtask.target_date}` : 'Sin fecha'}
                          {subtask.estimated_hours && ` • ${subtask.estimated_hours} horas`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(subtask.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                      aria-label="Remove subtask"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Formulario Inline de Subtarea */}
            {showSubtaskForm ? (
              <div className="mt-2">
                <SubtaskForm
                  onSubmit={handleAddSubtask}
                  onCancel={() => setShowSubtaskForm(false)}
                  activityDueDate={form.due_date}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSubtaskForm(true)}
                className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors w-fit p-1"
              >
                <Plus size={16} /> Agregar subtarea
              </button>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold rounded-lg py-3 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? 'Creando...' : 'Crear actividad'}
          </button>

        </form>
      </div>
    </div>
  )
}

export default CreatePage