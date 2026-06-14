import { useState, useEffect } from 'react'
import { createSubtask, updateSubtask, deleteSubtask } from '../services/subtaskService'

export const useSubtasks = (activity) => {
    const [subtasks, setSubtasks] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Cuando carga la ctividad, carga sus subtareas
    useEffect(() => {
        if (activity?.subtasks) {
            setSubtasks(activity.subtasks)
        }
    }, [activity])

    //crear subtarea
    const addSubtask = async (subtasksData) => {
        setLoading(true)
        setError(null)
        try {
            const response = await createSubtask(activity.id, subtasksData)
            setSubtasks((prev) => [...prev, response.data])
            return true
        } catch (err) {
            setError('Error al crear la subtarea.')
            return { error: true, rawError: err }
        } finally {
            setLoading(false)
        }
    }

    //actualizar subtarea
    const editSubtask = async (id, subtaskData) => {
        setLoading(true)
        setError(null)
        try {
            const response = await updateSubtask(id, subtaskData)
            setSubtasks((prev) =>
                prev.map((s) => s.id === id ? response.data : s)
            )
            return true
        } catch (err) {
            setError('Error al actualizar la subtarea.')
            return { error: true, rawError: err }
        } finally {
            setLoading(false)
        }
    }

    //eliminar subtarea
    const removeSubtask = async (id) => {
        setLoading(true)
        setError(null)
        try {
            await deleteSubtask(id)
            setSubtasks((prev) => prev.filter((s) => s.id !== id))
            return true
        } catch {
            setError('Error al eliminar la subtarea.')
            return false
        } finally {
            setLoading(false)
        }
    }

    return { subtasks, loading, error, addSubtask, editSubtask, removeSubtask }
}