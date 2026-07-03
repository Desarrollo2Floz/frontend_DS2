import { getActivities } from '../services/activityService';

export const DAILY_CAPACITY_CONFLICT_STORAGE_KEY = 'dailyCapacityOverloadConflict';

export const computeDailyCapacityConflicts = (activities, limitHours) => {
    const hoursLimit = Number(limitHours);
    if (!Number.isFinite(hoursLimit) || hoursLimit <= 0) {
        return { conflicts: [], conflictDates: [], activityIds: [] };
    }

    const dateTotals = new Map();
    const safeActivities = Array.isArray(activities) ? activities : [];

    for (const activity of safeActivities) {
        const activityId = activity?.id;
        const subtasks = Array.isArray(activity?.subtasks) ? activity.subtasks : [];
        for (const sub of subtasks) {
            const status = sub?.status;
            if (!sub?.target_date) continue;
            if (status === 'done' || status === 'postponed') continue;

            const est = Number(sub?.estimated_hours);
            if (!Number.isFinite(est) || est <= 0) continue;

            const key = String(sub.target_date);
            if (!dateTotals.has(key)) {
                dateTotals.set(key, { total: 0, activityIds: new Set() });
            }
            const bucket = dateTotals.get(key);
            bucket.total += est;
            if (activityId !== undefined && activityId !== null) {
                bucket.activityIds.add(activityId);
            }
        }
    }

    const conflicts = [];
    const conflictDates = [];
    const activityIds = new Set();

    for (const [date, info] of dateTotals.entries()) {
        if (info.total > hoursLimit) {
            const exceedsBy = info.total - hoursLimit;
            const ids = Array.from(info.activityIds);
            conflicts.push({
                date,
                planned_hours: info.total,
                limit_hours: hoursLimit,
                exceeds_by: exceedsBy,
                activity_ids: ids,
            });
            conflictDates.push(date);
            ids.forEach((id) => activityIds.add(id));
        }
    }

    conflicts.sort((a, b) => String(a.date).localeCompare(String(b.date)));

    return {
        conflicts,
        conflictDates,
        activityIds: Array.from(activityIds),
    };
};

export const broadcastDailyCapacityConflict = (conflict) => {
    try {
        window.dispatchEvent(new CustomEvent('daily-capacity-conflict', { detail: conflict }));
    } catch {
        // no-op
    }
};

export const setStoredDailyCapacityConflict = (conflict) => {
    try {
        if (!conflict) {
            sessionStorage.removeItem(DAILY_CAPACITY_CONFLICT_STORAGE_KEY);
            broadcastDailyCapacityConflict(null);
            return;
        }

        sessionStorage.setItem(
            DAILY_CAPACITY_CONFLICT_STORAGE_KEY,
            JSON.stringify({
                ...conflict,
                ts: Date.now(),
            })
        );

        broadcastDailyCapacityConflict(conflict);
    } catch {
        // no-op
    }
};

export const storeDailyCapacityConflict = (conflictData) => {
    if (conflictData) {
        sessionStorage.setItem(DAILY_CAPACITY_CONFLICT_STORAGE_KEY, JSON.stringify(conflictData));
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

export const syncDailyCapacityConflictWithBackend = async () => {
    const storedConflict = getStoredDailyCapacityConflict();
    if (!storedConflict) return;

    const limitHours = Number(storedConflict.limitHours);
    if (!Number.isFinite(limitHours)) {
        setStoredDailyCapacityConflict(null);
        return;
    }

    try {
        const activities = await getActivities();
        const computed = computeDailyCapacityConflicts(activities, limitHours);

        if (!computed.conflicts || computed.conflicts.length === 0) {
            setStoredDailyCapacityConflict(null);
            return;
        }

        setStoredDailyCapacityConflict({
            limitHours,
            conflicts: computed.conflicts,
            conflictDates: computed.conflictDates,
            activityIds: computed.activityIds,
        });
    } catch (err) {
        setStoredDailyCapacityConflict(null);
    }
};