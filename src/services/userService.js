import api from './api';

const DAILY_CAPACITY_STORAGE_KEY = 'daily_capacity_hours';
const DEFAULT_DAILY_CAPACITY_HOURS = 6;

const readStoredDailyCapacity = () => {
    try {
        const raw = localStorage.getItem(DAILY_CAPACITY_STORAGE_KEY);
        if (raw === null || raw === undefined || raw === '') return null;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

const writeStoredDailyCapacity = (hours) => {
    try {
        localStorage.setItem(DAILY_CAPACITY_STORAGE_KEY, String(hours));
    } catch {
        // no-op
    }
};

export const userService = {
    getDailyCapacity: async () => {
        try {
            const response = await api.get('/capacity/');
            const backendVal = response?.data?.data?.daily_limit_hours ?? response?.data?.daily_limit_hours;
            const hours = Number(backendVal);
            if (Number.isFinite(hours)) {
                writeStoredDailyCapacity(hours);
            }
            return response.data;
        } catch (err) {
            if (err?.response?.status === 404) {
                const stored = readStoredDailyCapacity();
                const hours = stored ?? DEFAULT_DAILY_CAPACITY_HOURS;
                return { status: 'success', data: { daily_limit_hours: hours } };
            }
            throw err;
        }
    },

    updateDailyCapacity: async (hours) => {
        try {
            const response = await api.put('/capacity/', { daily_limit_hours: hours });
            const backendVal = response?.data?.data?.daily_limit_hours ?? response?.data?.daily_limit_hours;
            const saved = Number(backendVal);
            if (Number.isFinite(saved)) {
                writeStoredDailyCapacity(saved);
            } else {
                writeStoredDailyCapacity(hours);
            }
            return response.data;
        } catch (err) {
            if (err?.response?.status === 404) {
                writeStoredDailyCapacity(hours);
                return { status: 'success', data: { daily_limit_hours: hours } };
            }
            throw err;
        }
    }
};
