import { useState, useEffect, useMemo } from 'react';
import { getActivities } from '../services/activityService';

export const useActivities = () => {
    const [viewState, setViewState] = useState('loading'); // 'loading', 'success', 'empty', 'error'
    const [activities, setActivities] = useState([]);

    const withSubtaskStats = (activity) => {
        const subtasks = Array.isArray(activity?.subtasks) ? activity.subtasks : [];
        const totalSubtasks = subtasks.length;
        const completedSubtasks = subtasks.reduce((acc, s) => acc + (s?.status === 'done' ? 1 : 0), 0);

        return {
            ...activity,
            // Fields used in ProgressPage today
            total: totalSubtasks,
            completed: completedSubtasks,
            // Fields used elsewhere (ActivityPage)
            total_subtasks: totalSubtasks,
            completed_subtasks: completedSubtasks,
        };
    };

    const loadData = async () => {
        await Promise.resolve();
        setViewState('loading');
        try {
            const data = await getActivities();
            const enriched = (Array.isArray(data) ? data : []).map(withSubtaskStats);
            setActivities(enriched);
            setViewState(enriched.length > 0 ? 'success' : 'empty');
        } catch {
            setViewState('error');
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadData();
    }, []);

    // Calcular estadísticas dinámicamente con useMemo para optimizar
    const stats = useMemo(() => {
        const totalTasks = activities.reduce((acc, act) => acc + (act.total ?? act.total_subtasks ?? 0), 0);
        const completedTasks = activities.reduce((acc, act) => acc + (act.completed ?? act.completed_subtasks ?? 0), 0);
        const allSubtasks = activities.flatMap((act) => (Array.isArray(act?.subtasks) ? act.subtasks : []));

        const pendingTasks = allSubtasks.reduce(
            (acc, s) => acc + (s?.status === 'pending' ? 1 : 0),
            0
        );

        const overdueTasks = allSubtasks.reduce(
            (acc, s) => acc + (s?.status === 'overdue' ? 1 : 0),
            0
        );

        const postponedTasks = allSubtasks.reduce(
            (acc, s) => acc + (s?.status === 'postponed' ? 1 : 0),
            0
        );
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 1000) / 10 : 0;

        return {
            total: totalTasks,
            completed: completedTasks,
            pending: pendingTasks,
            postponed: postponedTasks,
            overdue: overdueTasks,
            percentage: percentage,
            activityCount: activities.length
        };
    }, [activities]);

    return {
        activities,
        viewState,
        stats,
        reload: loadData
    };
};