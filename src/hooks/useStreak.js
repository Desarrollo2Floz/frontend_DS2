import { useState, useEffect } from 'react';
import { getStreakData } from '../services/streakService';
import { useAuth } from '../context/useAuth';

export const useStreak = () => {
    const [streak, setStreak] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchStreak = async () => {
            try {
                setLoading(true);
                const response = await getStreakData();
                setStreak(response.data);
                setError(null);
            } catch (err) {
                setError(err);
                setStreak(null);
            } finally {
                setLoading(false);
            }
        };

        fetchStreak();
    }, [isAuthenticated]);

    return { streak, loading, error };
};