import api from './api'
import { getActivities } from './activityService'
import { getLocalTodayStr } from '../utils/dateUtils'

const toLocalDate = (dateStr) => {
    if (!dateStr) return null
    // Interpretar YYYY-MM-DD como fecha local
    return new Date(`${dateStr}T00:00:00`)
}

const addDays = (dateObj, days) => {
    const copy = new Date(dateObj)
    copy.setDate(copy.getDate() + days)
    return copy
}

const buildTodaySubtasksFromActivities = (activities, params = {}) => {
    const todayStr = getLocalTodayStr()
    const todayDate = toLocalDate(todayStr)

    const daysFilter = params.days !== undefined && params.days !== '' && params.days !== null
        ? Number(params.days)
        : null
    const horizonDate = daysFilter !== null && !Number.isNaN(daysFilter) && todayDate
        ? addDays(todayDate, Math.max(0, daysFilter))
        : null

    const flattened = (Array.isArray(activities) ? activities : []).flatMap((act) => {
        const parent_activity = {
            id: act?.id,
            title: act?.title,
            type: act?.type,
            course: act?.course,
            weight: act?.weight,
            due_date: act?.due_date,
        }

        const subtasks = Array.isArray(act?.subtasks) ? act.subtasks : []
        return subtasks.map((sub) => ({
            ...sub,
            parent_activity,
        }))
    })

    const filtered = flattened.filter((sub) => {
        if (params.course && sub?.parent_activity?.course !== params.course) return false

        if (params.status && params.status !== 'all' && sub?.status !== params.status) return false

        if (horizonDate && sub?.target_date) {
            const target = toLocalDate(sub.target_date)
            // Mantener siempre las de hoy; filtrar hacia adelante por horizonte
            if (target && sub.target_date !== todayStr && target > horizonDate) return false
        }

        return true
    })

    const grouped = { overdue: [], today: [], upcoming: [] }
    for (const sub of filtered) {
        const td = sub?.target_date || null
        if (sub?.status === 'overdue') {
            grouped.overdue.push(sub)
            continue
        }

        if (td === todayStr) {
            grouped.today.push(sub)
            continue
        }

        // Cualquier otra cosa (incluye postponed, done, pending a futuro, sin fecha)
        grouped.upcoming.push(sub)
    }

    return grouped
}

//POST /api/activities/:activityID/subtasks/
export const createSubtask = async (activityId, subtaskData) => {
    const response = await api.post(`/activities/${activityId}/subtasks/`, subtaskData)
    return response.data
}

//GET /api/subtasks/:id/
export const getSubtaskById = async (id) => {
    const response = await api.get(`/subtasks/${id}/`)
    return response.data
}

// PATCH /api/subtasks/:id/
export const updateSubtask = async (id, subtaskData) => {
    const response = await api.patch(`/subtasks/${id}/`, subtaskData)
    return response.data
}

export const deleteSubtask = async (id) => {
    const response = await api.delete(`/subtasks/${id}/`)
    return response.data
}

// GET /api/today/
export const getTodaySubtasks = async (params = {}) => {
    const query = new URLSearchParams()
    if (params.course) query.append('course', params.course)
    if (params.status) query.append('status', params.status)
    if (params.days !== undefined && params.days !== '') query.append('days', params.days)
    
    const queryStr = query.toString()
    const url = queryStr ? `/subtasks/today/?${queryStr}` : '/subtasks/today/'

    try {
        const response = await api.get(url)
        return response.data.data  // { overdue: [...], today: [...], upcoming: [...] }
    } catch (err) {
        console.error("Error en getTodaySubtasks:", err)
        // Fallback: si el endpoint no existe, construir desde /activities/
        if (err?.response?.status === 404) {
            const activities = await getActivities()
            return buildTodaySubtasksFromActivities(activities, params)
        }
        throw err
    }
}

