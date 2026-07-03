import { useState, useCallback, useEffect } from 'react';
import { getTodaySubtasks } from '../services/subtaskService';

export const useTodaySubtasks = () => {
    const [viewState, setViewState] = useState('loading'); // 'loading' | 'success' | 'empty' | 'error'
    const [data, setData] = useState({ overdue: [], today: [], upcoming: [] });
    const [filters, setFilters] = useState({
        course: '',
        status: 'all',
        days: '',
    });

    const loadData = useCallback(async () => {
        setViewState('loading');
        try {
            const result = await getTodaySubtasks(filters);
            const hasAnyItems = result.overdue.length > 0 
                             || result.today.length > 0 
                             || result.upcoming.length > 0;
            const hasVisibleItems = !filters.status
                ? [...result.overdue, ...result.today, ...result.upcoming].some((subtask) => subtask?.status !== 'done')
                : hasAnyItems;
            setData(result);
            setViewState(hasVisibleItems ? 'success' : 'empty');
        } catch (error) {
            console.error('Error loading today subtasks:', error);
            setViewState('error');
        }
    }, [filters]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        data,
        viewState,
        filters,
        setFilters,
        reload: loadData,
    };
};