import { useState, useEffect, useCallback } from 'react'
import { getActivitiesById } from '../services/activityService'

export const useActivity = (id) => {
    const [viewState, setViewState] = useState('loading')
    const [activity, setActivity] = useState(null)

    const loadData = useCallback(async () => {
        await Promise.resolve()
        setViewState('loading')
        try {
            const data = await getActivitiesById(id)
            setActivity(data)
            setViewState('success')
        } catch {
            setViewState('error')
        }
    }, [id])

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (id) loadData()
    }, [id, loadData])

    return { activity, viewState, reload: loadData }
}