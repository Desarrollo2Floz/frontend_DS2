import api from './api'

/**
 * POST /api/conflicts/overload/
 * Valida proactivamente si asignar horas a una fecha excede la capacidad diaria.
 * 
 * @param {Object} params
 * @param {string} params.target_date - Fecha objetivo (YYYY-MM-DD)
 * @param {number} params.estimated_hours - Horas estimadas a asignar
 * @param {number|string} [params.subtask_id] - ID de la subtarea (para excluirla del cálculo si se está reprogramando)
 * @returns {Promise<Object>} Respuesta con planned_hours, limit_hours, exceeds_by, alternative_dates
 */
export const validateOverload = async ({ target_date, estimated_hours, subtask_id }) => {
    const payload = { target_date, estimated_hours }
    if (subtask_id) payload.subtask_id = subtask_id

    try {
        const response = await api.post('/conflicts/overload/', payload)
        // 200 = sin conflicto
        return {
            hasConflict: false,
            ...response.data
        }
    } catch (error) {
        if (error.response?.status === 409) {
            // 409 = conflicto detectado
            return {
                hasConflict: true,
                ...error.response.data
            }
        }
        // Otro error inesperado
        throw error
    }
}
