/**
 * US-10 — Cálculo de progreso por actividad
 *
 * Fuente de datos: GET /api/activities/ (cada actividad incluye su array `subtasks`).
 * No se requiere endpoint dedicado; los totales se derivan de los estados reales
 * de cada subtarea en el cliente.
 *
 * Reglas:
 * - completed = subtareas con status === 'done'
 * - total     = cantidad total de subtareas de la actividad
 * - percentage = total > 0 ? round((completed / total) * 100, 1) : 0
 * - Si total === 0 → 0% y microcopy de estado vacío
 */

export const ACTIVITY_TYPE_LABELS = {
    exam: 'Examen',
    quiz: 'Quiz',
    project: 'Proyecto',
    homework: 'Tarea',
    presentation: 'Presentación',
};

/**
 * Calcula el progreso de una actividad a partir de sus subtareas.
 * @param {Array} subtasks - Lista de subtareas con campo `status`
 * @returns {{ completed: number, total: number, percentage: number, hasSubtasks: boolean }}
 */
export const calcActivityProgress = (subtasks = []) => {
    const list = Array.isArray(subtasks) ? subtasks : [];
    const total = list.length;
    const completed = list.reduce((acc, s) => acc + (s?.status === 'done' ? 1 : 0), 0);
    const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    return {
        completed,
        total,
        percentage,
        hasSubtasks: total > 0,
    };
};

/**
 * Enriquece una actividad con campos de progreso calculados.
 */
export const enrichActivityWithProgress = (activity) => {
    const { completed, total, percentage, hasSubtasks } = calcActivityProgress(activity?.subtasks);

    return {
        ...activity,
        completed,
        total,
        percentage,
        hasSubtasks,
        total_subtasks: total,
        completed_subtasks: completed,
    };
};

/**
 * Agrega estadísticas globales a partir de una lista de actividades enriquecidas.
 */
export const calcGlobalProgressStats = (activities = []) => {
    const list = Array.isArray(activities) ? activities : [];
    const allSubtasks = list.flatMap((act) => (Array.isArray(act?.subtasks) ? act.subtasks : []));

    const total = allSubtasks.length;
    const completed = allSubtasks.reduce((acc, s) => acc + (s?.status === 'done' ? 1 : 0), 0);
    const pending = allSubtasks.reduce((acc, s) => acc + (s?.status === 'pending' ? 1 : 0), 0);
    const postponed = allSubtasks.reduce((acc, s) => acc + (s?.status === 'postponed' ? 1 : 0), 0);
    const overdue = allSubtasks.reduce((acc, s) => acc + (s?.status === 'overdue' ? 1 : 0), 0);
    const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

    return {
        total,
        completed,
        pending,
        postponed,
        overdue,
        percentage,
        activityCount: list.length,
    };
};
