import { useState } from 'react'
import { X } from 'lucide-react'
import { getLocalTodayStr } from '../../utils/dateUtils'

const todayStr = getLocalTodayStr()
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'done', label: 'Completada' },
]

const EMPTY_FORM = {
  title: '',
  description: '',
  target_date: '',
  estimated_hours: '',
  status: 'pending',
}

const SubtaskForm = ({ onSubmit, onCancel, loading, initialData, activityDueDate }) => {
  const [form, setForm] = useState(initialData ? {
    title: initialData.title || '',
    description: initialData.description || '',
    target_date: initialData.target_date || '',
    estimated_hours: initialData.estimated_hours || '',
    status: initialData.status || 'pending',
  } : EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const errors = {}
    if (!form.title.trim()) {
      errors.title = 'El título es obligatorio.'
    }
    if (!form.target_date) {
      errors.target_date = 'La fecha objetivo es obligatoria.'
    } else if (
      (!initialData || form.target_date !== initialData.target_date) &&
      form.target_date < todayStr
    ) {
      errors.target_date = 'La fecha objetivo debe ser mayor o igual a hoy.'
    } else if (activityDueDate !== undefined && !activityDueDate) {
      errors.target_date = 'Selecciona la fecha límite de la actividad primero.'
    } else if (activityDueDate && form.target_date > activityDueDate) {
      errors.target_date = `La fecha objetivo no puede ser mayor a la fecha límite (${activityDueDate}).`
    }
    if (!form.estimated_hours) {
      errors.estimated_hours = 'Las horas estimadas son obligatorias.'
    } else {
      const h = parseFloat(form.estimated_hours)
      if (isNaN(h) || h <= 0 || h > 16) {
        errors.estimated_hours = 'Las horas estimadas deben ser un número entre 0 y 16.'
      }
    }
    return errors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    // Construye el payload limpio
    const payload = {
      title: form.title.trim(),
      estimated_hours: parseFloat(form.estimated_hours),
      ...(form.description && { description: form.description.trim() }),
      ...(initialData && { status: form.status }),
    }

    if (!initialData || form.target_date !== initialData.target_date) {
      payload.target_date = form.target_date
    }

    onSubmit(payload)
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          {initialData ? 'Editar subtarea' : 'Nueva subtarea'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-4">

        {/* Título */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">Título *</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ej: Repasar álgebra lineal"
            className={`bg-white rounded-lg px-3 py-2 text-sm outline-none border transition-colors
              ${fieldErrors.title ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
          />
          {fieldErrors.title && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.title}</p>
          )}
        </div>

        {/* Descripción */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-700">
            Descripción <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Agrega una descripción..."
            rows={2}
            className="bg-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-200 focus:border-blue-400 transition-colors resize-none"
          />
        </div>

        {/* Fecha objetivo */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-gray-700">Fecha objetivo *</label>
          <input
            type="date"
            name="target_date"
            value={form.target_date}
            onChange={handleChange}
            className={`bg-white rounded-lg px-3 py-2 text-sm outline-none border transition-colors
              ${fieldErrors.target_date ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
          />
          {fieldErrors.target_date && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.target_date}</p>
          )}
        </div>

        {/* Horas estimadas */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-xs font-medium text-gray-700">Horas estimadas *</label>
          <input
            type="number"
            name="estimated_hours"
            value={form.estimated_hours}
            onChange={handleChange}
            placeholder="Ej: 2"
            min="0"
            step="0.5"
            className={`bg-white rounded-lg px-3 py-2 text-sm outline-none border transition-colors
              ${fieldErrors.estimated_hours ? 'border-red-400' : 'border-gray-200 focus:border-blue-400'}`}
          />
          {fieldErrors.estimated_hours && (
            <p className="text-red-500 text-sm mt-1">{fieldErrors.estimated_hours}</p>
          )}
        </div>

        {/* Estado - SOLO en editar */}
        {initialData && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-700">Estado</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="bg-white rounded-lg px-3 py-2 text-sm outline-none border border-gray-200 focus:border-blue-400 transition-colors"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white font-semibold rounded-lg py-2 px-5 text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : initialData ? 'Guardar cambios' : 'Agregar subtarea'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-white text-gray-700 font-semibold rounded-lg py-2 px-5 text-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  )
}

export default SubtaskForm