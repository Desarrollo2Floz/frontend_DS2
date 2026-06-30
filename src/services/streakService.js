import api from './api';

export const getStreakData = async () => {
    try {
        const response = await api.get('/user/streak/');
        return response.data;
    } catch (error) {
        console.error('Error fetching streak data:', error);
        throw error;
    }
};