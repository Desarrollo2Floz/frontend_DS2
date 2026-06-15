import { useState, useCallback, useEffect } from 'react';
import { getTodaySubtasks } from '../services/subtaskService';

export const useTodaySubtasks = () => {
    const [viewState, setViewState] = useState('loading'); // 'loading' | 'success' | 'empty' | 'error'
    const [data, setData] = useState({ overdue: [], today: [], upcoming: [] });
    const [filters, setFilters] = useState({
        course: '',
        status: '',
        days: '7',
    });

    const loadData = useCallback(async () => {
        setViewState('loading');
        try {
            const result = await getTodaySubtasks(filters);
            setData(result);
            if (result.overdue.length === 0 && result.today.length === 0 && result.upcoming.length === 0) {
                setViewState('empty');
            } else {
                setViewState('success');
            }
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