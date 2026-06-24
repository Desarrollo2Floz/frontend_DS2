import { useState, useEffect, useMemo } from 'react';
import { getActivities } from '../services/activityService';
import { enrichActivityWithProgress, calcGlobalProgressStats } from '../utils/progressUtils';

export const useActivities = () => {
    const [viewState, setViewState] = useState('loading'); // 'loading', 'success', 'empty', 'error'
    const [activities, setActivities] = useState([]);

    const loadData = async () => {
        setViewState('loading');
        try {
            const data = await getActivities();
            const enriched = (Array.isArray(data) ? data : []).map(enrichActivityWithProgress);
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

    const stats = useMemo(() => calcGlobalProgressStats(activities), [activities]);

    return {
        activities,
        viewState,
        stats,
        reload: loadData,
    };
};
