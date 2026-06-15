export const DAILY_CAPACITY_CONFLICT_STORAGE_KEY = 'daily_capacity_conflict';

export const storeDailyCapacityConflict = (conflictData) => {
    if (conflictData) {
        sessionStorage.setItem(DAILY_CAPACITY_CONFLICT_STORAGE_KEY, JSON.stringify(conflictData));
        // Disparar evento para que otros componentes se enteren
        window.dispatchEvent(new CustomEvent('daily-capacity-conflict', { detail: conflictData }));
    }
};

export const getStoredDailyCapacityConflict = () => {
    const stored = sessionStorage.getItem(DAILY_CAPACITY_CONFLICT_STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
    return null;
};

export const clearStoredDailyCapacityConflict = () => {
    sessionStorage.removeItem(DAILY_CAPACITY_CONFLICT_STORAGE_KEY);
};