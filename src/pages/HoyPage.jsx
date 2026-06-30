import React, { useState, useEffect } from 'react';
import { useTodaySubtasks } from '../hooks/useTodaySubtasks';
import { getActivities } from '../services/activityService';
import { updateSubtask } from '../services/subtaskService';
import { getLocalTodayStr } from '../utils/dateUtils';
import { parseOverloadError } from '../utils/errorUtils';
import { DAILY_CAPACITY_CONFLICT_STORAGE_KEY } from '../utils/dailyCapacityConflict';


// US-09: Ya no se usa el workaround de localStorage para notas, el backend las maneja directamente.

import Modal from '../components/Modal';
import { UserCircle, AlertCircle, AlertTriangle, HelpCircle, Calendar, Clock, CheckCircle2, CalendarClock, Loader2, Coffee, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { StreakWidget } from '../components/StreakWidget';


const ACTIVITY_TYPES_MAP = {
    'exam': 'Examen',
    'quiz': 'Quiz',
    'project': 'Proyecto',
    'homework': 'Tarea',
    'presentation': 'Presentación'
};

const STATUS_TO_API = {
    'Todos': 'all',
    'Pendiente': 'pending',
    'Completada': 'done',
    'Postergada': 'postponed',
    'Vencida': 'overdue',
};

const STATUS_BADGE = {
    'pending': { text: 'Pendiente', className: 'bg-zinc-200 text-zinc-600' },
    'done': { text: 'Completada', className: 'bg-green-100 text-green-700' },
    'postponed': { text: 'Postergada', className: 'bg-yellow-100 text-yellow-700' },
    'overdue': { text: 'Vencida', className: 'bg-red-600 text-white' },
};

const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + "T00:00:00");
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
};

const getBadge = (subtask, groupDefault) => {
    return STATUS_BADGE[subtask.status] || groupDefault;
};

const HoyPage = () => {
    const { data, viewState, setFilters, reload } = useTodaySubtasks();
    const { user, loading: authLoading } = useAuth();
    const { overdue, today: todayTasks, upcoming } = data;
    const todayStr = getLocalTodayStr();

    const displayName = (() => {
        const fullName = `${user?.name ?? ''} ${user?.last_name ?? ''}`.trim();
        if (fullName) return fullName;
        return 'Estudiante';
    })();

    const [dailyCapacityConflict, setDailyCapacityConflict] = useState(null);

    useEffect(() => {
        const loadConflict = () => {
            try {
                const raw = sessionStorage.getItem(DAILY_CAPACITY_CONFLICT_STORAGE_KEY);
                if (!raw) {
                    setDailyCapacityConflict(null);
                    return;
                }
                const parsed = JSON.parse(raw);
                setDailyCapacityConflict(parsed);
            } catch {
                setDailyCapacityConflict(null);
            }
        };

        const onConflictEvent = (evt) => {
            const detail = evt?.detail;
            if (!detail) {
                setDailyCapacityConflict(null);
                return;
            }
            setDailyCapacityConflict(detail);
        };

        loadConflict();
        window.addEventListener('daily-capacity-conflict', onConflictEvent);
        return () => window.removeEventListener('daily-capacity-conflict', onConflictEvent);
    }, []);

    const [courses, setCourses] = useState(['Todos']);
    const [courseFilter, setCourseFilter] = useState('Todos');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [daysFilter, setDaysFilter] = useState('');

    const [conflictModal, setConflictModal] = useState({
        isOpen: false,
        subtask: null, // La subtarea que causó el problema
        conflictData: null // El objeto de error que mande el backend
    });

    // Cargar lista de cursos para el dropdown
    useEffect(() => {
        getActivities()
            .then(activities => {
                const unique = [...new Set(activities.map(a => a.course).filter(Boolean))];
                setCourses(['Todos', ...unique]);
            })
            .catch((error) => { console.error("Error al cargar actividades:", error); });
    }, []);

    const handleCourseChange = (value) => {
        setCourseFilter(value);
        setFilters(prev => ({ ...prev, course: value === 'Todos' ? '' : value }));
    };

    const handleStatusChange = (value) => {
        setStatusFilter(value);
        setFilters(prev => ({ ...prev, status: STATUS_TO_API[value] || '' }));
    };

    const handleDaysChange = (value) => {
        setDaysFilter(value);
        setFilters(prev => ({ ...prev, days: value }));
    };

    const hasActiveFilters = courseFilter !== 'Todos' || statusFilter !== 'Todos' || daysFilter !== '';


    const [rescheduleModal, setRescheduleModal] = useState({
        isOpen: false,
        subtask: null,
        newDate: ''
    });
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [alertModal, setAlertModal] = useState({
        isOpen: false,
        type: 'success', // 'success' o 'error'
        title: '',
        message: ''
    });

    const [reduceModal, setReduceModal] = useState({
        isOpen: false,
        subtask: null,
        newDate: '',
        newHours: 0
    });
    const [isReducing, setIsReducing] = useState(false);

    const [postponeModal, setPostponeModal] = useState({
        isOpen: false,
        subtask: null,
        note: ''
    });
    const [isPostponing, setIsPostponing] = useState(false);

    const handleOpenPostpone = (subtask) => {
        if (!subtask?.id) return;
        setPostponeModal({
            isOpen: true,
            subtask,
            note: ''
        });
    };

    const handleClosePostpone = () => {
        if (isPostponing) return;
        setPostponeModal({ isOpen: false, subtask: null, note: '' });
    };

    const handleMarkDone = async (subtask) => {
        if (!subtask?.id) return;

        try {
            await updateSubtask(subtask.id, { status: 'done' });

            // US-09: Ya no es necesario, el backend maneja la nota automáticamente al reprogramar.
            // clearStoredPostponeNote(rescheduleModal.subtask.id);


            await reload();
        } catch (error) {
            const { errorMessage } = parseOverloadError(error, 'Ha ocurrido un error marcando la subtarea como hecha.');
            setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Error al actualizar',
                message: errorMessage
            });
        }
    };

    const handlePostponeConfirm = async () => {
        const subtask = postponeModal.subtask;
        if (!subtask?.id) return;

        const trimmedNote = (postponeModal.note || '').trim();

        // US-09: El backend ya soporta el campo `note` en Subtask,
        // por lo que se envía directamente en el payload en vez de
        // guardarlo en localStorage (workaround anterior, ya no necesario).
        const payload = { status: 'postponed', note: trimmedNote };

        setIsPostponing(true);
        try {
            await updateSubtask(subtask.id, payload);

            setIsPostponing(false);
            handleClosePostpone();
            reload();
        } catch (error) {
            const { errorMessage } = parseOverloadError(error, 'Ha ocurrido un error posponiendo la subtarea.');
            setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Error al actualizar',
                message: errorMessage
            });
        } finally {
            setIsPostponing(false);
        }
    };


    const handleOpenReschedule = (subtask) => {
        setRescheduleModal({
            isOpen: true,
            subtask: subtask,
            newDate: subtask.target_date || ''
        });
    };

    const handleCloseReschedule = () => {
        setRescheduleModal({ isOpen: false, subtask: null, newDate: '' });
    };

    const handleRescheduleConfirm = async () => {
        if (!rescheduleModal.subtask || !rescheduleModal.newDate) return;

        setIsRescheduling(true);
        try {
            const response = await updateSubtask(rescheduleModal.subtask.id, {
                target_date: rescheduleModal.newDate,
                // Reprogramar = volver a planificar (no es posponer)
                status: 'pending'
            });

            handleCloseReschedule();

            // US-08: Si el backend indica que aún hay sobrecarga tras guardar, re-mostrar conflicto
            if (response?.exceeds) {
                setConflictModal({
                    isOpen: true,
                    subtask: rescheduleModal.subtask,
                    conflictData: {
                        message: response.message || `Aún quedarías con ${response.planned_hours}h planificadas (límite ${response.limit_hours}h)`,
                        attemptedDate: rescheduleModal.newDate,
                        payload: {
                            planned_hours: response.planned_hours,
                            limit_hours: response.limit_hours,
                            exceeds_by: response.exceeds_by,
                            hours_to_reduce: response.exceeds_by,
                            min_hours: 0.5,
                            alternative_dates: []
                        }
                    }
                });
                reload();
                return;
            }

            // US-08: Mostrar "Conflicto resuelto" si venía de un conflicto
            const successTitle = response?.resolved ? 'Conflicto resuelto' : 'Reprogramar';
            const successMessage = response?.resolved
                ? 'La subtarea fue reprogramada y el conflicto de sobrecarga fue resuelto.'
                : 'La fecha de la subtarea se actualizó correctamente.';

            setAlertModal({
                isOpen: true,
                type: 'success',
                title: successTitle,
                message: successMessage
            });
            reload();

        } catch (error) {
            const { isOverloadConflict, conflictMessage, errorMessage, conflictPayload } = parseOverloadError(error, 'Ha ocurrido un error reprogramando la subtarea.');

            if (isOverloadConflict) {
                handleCloseReschedule();

                setConflictModal({
                    isOpen: true,
                    subtask: rescheduleModal.subtask,
                    conflictData: { message: conflictMessage || errorMessage, attemptedDate: rescheduleModal.newDate, payload: conflictPayload }
                });
                return;
            }

            setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Error al actualizar',
                message: errorMessage
            });
            handleCloseReschedule();

        } finally {
            setIsRescheduling(false);
        }
    };

    const handleOpenReduce = (subtask, newDate) => {
        setReduceModal({
            isOpen: true,
            subtask: subtask,
            newDate: newDate,
            newHours: subtask.estimated_hours || 1
        });
    };

    const handleCloseReduce = () => {
        setReduceModal({ isOpen: false, subtask: null, newDate: '', newHours: 0 });
    };

    const handleReduceConfirm = async () => {
        if (!reduceModal.subtask || !reduceModal.newDate || reduceModal.newHours <= 0) return;

        setIsReducing(true);
        try {
            const response = await updateSubtask(reduceModal.subtask.id, {
                target_date: reduceModal.newDate,
                estimated_hours: reduceModal.newHours,
                // Reducir horas para resolver conflicto mantiene la subtarea planificada
                status: 'pending'
            });

            handleCloseReduce();

            // US-08 Escenario 2: Si aún excede tras reducir, re-mostrar conflicto
            if (response?.exceeds) {
                setConflictModal({
                    isOpen: true,
                    subtask: { ...reduceModal.subtask, estimated_hours: reduceModal.newHours },
                    conflictData: {
                        message: response.message || `Aún quedarías con ${response.planned_hours}h planificadas (límite ${response.limit_hours}h)`,
                        attemptedDate: reduceModal.newDate,
                        payload: {
                            planned_hours: response.planned_hours,
                            limit_hours: response.limit_hours,
                            exceeds_by: response.exceeds_by,
                            hours_to_reduce: response.exceeds_by,
                            min_hours: 0.5,
                            alternative_dates: []
                        }
                    }
                });
                reload();
                return;
            }

            // US-08: Mostrar "Conflicto resuelto"
            const successTitle = response?.resolved ? 'Conflicto resuelto' : 'Horas reducidas';
            const successMessage = response?.resolved
                ? 'Las horas fueron reducidas y el conflicto de sobrecarga fue resuelto.'
                : 'La fecha y las horas de la subtarea se actualizaron correctamente.';

            setAlertModal({
                isOpen: true,
                type: 'success',
                title: successTitle,
                message: successMessage
            });
            reload();

        } catch (error) {
            const { isOverloadConflict, conflictMessage, errorMessage, conflictPayload } = parseOverloadError(error, 'Ha ocurrido un error al actualizar las horas.');

            if (isOverloadConflict) {
                handleCloseReduce();
                setConflictModal({
                    isOpen: true,
                    subtask: reduceModal.subtask,
                    conflictData: { message: conflictMessage || errorMessage, attemptedDate: reduceModal.newDate, payload: conflictPayload }
                });
                return;
            }

            setAlertModal({
                isOpen: true,
                type: 'error',
                title: 'Error al actualizar',
                message: errorMessage
            });
            handleCloseReduce();

        } finally {
            setIsReducing(false);
        }
    };

    const renderHeader = () => (
        <div className="flex justify-between items-start mb-8 pb-0">
            <div>
                <h1 className="text-4xl font-extrabold text-[#0B1525] mb-2 tracking-tight">Hoy</h1>
                <p className="text-zinc-500 text-sm font-medium">Gestiona y planifica tus compromisos académicos</p>
            </div>
            <div className="hidden md:flex">
                <StreakWidget />
            </div>
        </div>
    );

    const renderFilters = () => (
        <div className="flex flex-wrap items-end gap-6 mb-10 pb-6 border-b border-zinc-100">
            <div htmlFor="course-filter" className="flex flex-col gap-1.5">
                <label htmlFor="course-filter" className="text-xs font-semibold text-zinc-500">Curso</label>
                <select
                    id="course-filter"
                    value={courseFilter}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500 bg-white"
                >
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="status-filter" className="text-xs font-semibold text-zinc-500">Estado</label>
                <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500 bg-white"
                >
                    <option value="Todos">Todos</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Completada">Completada</option>
                    <option value="Postergada">Postergada</option>
                    <option value="Vencida">Vencida</option>
                </select>
            </div>
            <div className="flex flex-col gap-1.5">
                <label htmlFor="days-filter" className="text-xs font-semibold text-zinc-500">Días</label>
                <input
                    id="days-filter"
                    type="number"
                    value={daysFilter}
                    onChange={(e) => handleDaysChange(e.target.value === '' ? '' : Number(e.target.value))}
                    min={0}
                    placeholder="Todos"
                    className="border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500 bg-white w-20"
                />
            </div>
            <div className="ml-auto relative group mb-3">
                <button
                    type="button"
                    aria-label="Ver ayuda sobre cómo se ordenan las subtareas"
                    className="flex items-center gap-1.5 justify-center text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors">
                    <HelpCircle size={16} />
                    ¿Cómo se ordena?
                </button>
                <div className="absolute right-0 top-full mt-2 w-96 bg-zinc-800 text-zinc-200 text-xs rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none leading-relaxed">
                    <span className="font-bold text-white block mb-1">Regla de prioridad</span>
                    Las subtareas se agrupan en Vencidas, Para hoy y Próximas según su fecha objetivo.
                    Dentro de cada grupo se ordenan por fecha (más antigua/cercana primero).
                    En caso de empate, se muestra primero la de menor esfuerzo estimado.
                </div>
            </div>
        </div>
    );

    const SubtaskCard = ({ subtask, badgeText, badgeClassName }) => {
        const parent = subtask.parent_activity;
        const conflictDates = dailyCapacityConflict?.conflictDates || dailyCapacityConflict?.conflicts?.map(c => c.date) || [];
        const isDailyConflict = Boolean(subtask?.target_date && conflictDates.includes(subtask.target_date));

        // US-09: La nota ahora viene directamente del backend, ya no se usa localStorage.
        const postponedNote = subtask?.note ? String(subtask.note).trim() : '';

        let icon = '📝';
        if (parent.type === 'project') icon = '💻';
        if (parent.type === 'exam' || parent.type === 'quiz') icon = '📚';
        if (parent.type === 'presentation') icon = '📊';

        return (
            <div className={`rounded-2xl p-5 hover:shadow-sm transition-all shadow-sm mb-4 ${isDailyConflict
                ? 'bg-red-50 border-2 border-red-600'
                : 'bg-white border border-zinc-300'
                }`}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <Link to={`/actividad/${parent.id}`}>
                            <h3 className="text-[17px] font-bold text-zinc-900 leading-tight mb-1 hover:text-blue-600 transition-colors">
                                {subtask.title}
                            </h3>
                        </Link>
                        <p className="text-sm text-zinc-500 mb-2">De: {parent.title}</p>
                        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                            <span>{icon}</span>
                            {ACTIVITY_TYPES_MAP[parent.type] || parent.type} {parent.course ? `- ${parent.course}` : ''}
                        </div>
                    </div>
                    {badgeText && (
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${badgeClassName}`}>
                            {badgeText}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-5 text-zinc-400 text-xs font-semibold mb-6">
                    {subtask.status !== 'postponed' && (
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {formatDateShort(subtask.target_date)}
                        </div>
                    )}
                    {subtask.estimated_hours && (
                        <div className="flex items-center gap-1.5">
                            {isDailyConflict ? '⚠️' : <Clock size={14} />}
                            {subtask.estimated_hours}h estimadas
                        </div>
                    )}
                </div>

                {subtask.status === 'postponed' && Boolean(postponedNote && String(postponedNote).trim()) && (
                    <div className="w-full mb-6 px-4 py-3 rounded-lg bg-[#F8FAFC] border border-dashed border-zinc-300 text-zinc-500 text-sm font-semibold text-center whitespace-pre-wrap">
                        {String(postponedNote).trim()}
                    </div>
                )}

                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => handleMarkDone(subtask)}
                        disabled={subtask.status === 'done'}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:bg-zinc-300 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:hover:bg-zinc-300"
                    >
                        <CheckCircle2 size={18} /> Hecha
                    </button>
                    <button
                        onClick={() => handleOpenPostpone(subtask)}
                        disabled={subtask.status === 'done'}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-200 disabled:cursor-not-allowed disabled:hover:bg-zinc-100"
                    >
                        <Clock size={18} /> Posponer
                    </button>
                    <button
                        onClick={() => handleOpenReschedule(subtask)}
                        disabled={subtask.status === 'done'}
                        className="flex-1 min-w-[100px] flex items-center justify-center gap-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-200 disabled:cursor-not-allowed disabled:hover:bg-zinc-100"
                    >
                        <CalendarClock size={18} /> Reprogramar
                    </button>
                </div>
            </div>
        );
    };

    const renderSuccess = () => {
        const sortByDateAndHours = (a, b) => {
            const dateA = a.status === 'postponed' ? '9999-12-31' : (a.target_date || '9999-12-31');
            const dateB = b.status === 'postponed' ? '9999-12-31' : (b.target_date || '9999-12-31');
            if (dateA !== dateB) return dateA.localeCompare(dateB);
            const hoursA = Number(a.estimated_hours) || 0;
            const hoursB = Number(b.estimated_hours) || 0;
            return hoursA - hoursB;
        };

        const allSubtasks = [...overdue, ...todayTasks, ...upcoming];

        const doneGrouped = allSubtasks
            .filter((sub) => sub.status === 'done')
            .sort(sortByDateAndHours);

        const overdueGrouped = overdue
            .filter((sub) => sub.status !== 'done' && sub.status !== 'postponed')
            .sort(sortByDateAndHours);

        const todayGrouped = todayTasks
            .filter((sub) => sub.target_date === todayStr && sub.status !== 'done' && sub.status !== 'postponed')
            .sort(sortByDateAndHours);

        const upcomingGrouped = [
            ...upcoming.filter((sub) => sub.status !== 'done' && sub.status !== 'postponed'),
            ...allSubtasks.filter((sub) => sub.status === 'postponed')
        ].sort(sortByDateAndHours);

        const showDoneGroup = statusFilter !== 'Todos';

        const groups = [
            {
                key: 'overdue',
                title: 'Vencidas',
                titleClass: 'text-red-600',
                countClass: 'bg-red-600 text-white',
                items: overdueGrouped,
            },
            {
                key: 'today',
                title: 'Para Hoy',
                titleClass: 'text-blue-700',
                countClass: 'bg-blue-100 text-blue-700',
                items: todayGrouped,
            },
            {
                key: 'upcoming',
                title: 'Próximas',
                titleClass: 'text-zinc-700',
                countClass: 'bg-zinc-200 text-zinc-600',
                items: upcomingGrouped,
            },
        ];

        if (showDoneGroup) {
            groups.push({
                key: 'done',
                title: 'Completadas',
                titleClass: 'text-green-700',
                countClass: 'bg-green-100 text-green-700',
                items: doneGrouped,
            });
        }

        return (
            <div className="flex flex-row gap-6 overflow-x-auto pb-8 items-start w-full snap-x">
                {groups.map((group) => {
                    if (!group.items || group.items.length === 0) return null;
                    return (
                        <section key={group.key} className="flex-1 min-w-[340px] bg-zinc-50 rounded-2xl p-5 border border-zinc-200/60 snap-start">
                            <h2 className={`text-xl font-bold mb-5 flex items-center gap-2 ${group.titleClass}`}>
                                {group.title}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${group.countClass}`}>{group.items.length}</span>
                            </h2>
                            <div className="flex flex-col">
                                {group.items.map((sub) => {
                                    const badge = STATUS_BADGE[sub.status] || { text: 'Pendiente', className: 'bg-zinc-200 text-zinc-600' };
                                    return <SubtaskCard key={sub.id} subtask={sub} badgeText={badge.text} badgeClassName={badge.className} />;
                                })}
                            </div>
                        </section>
                    );
                })}
            </div>
        );
    };

    const renderModals = () => (
        <>
            {/* Modal Posponer con nota opcional */}
            <Modal
                isOpen={postponeModal.isOpen}
                onClose={handleClosePostpone}
                onConfirm={handlePostponeConfirm}
                title="Posponer"
                confirmText="Posponer"
                cancelText="Cancelar"
                showCancel={true}
                isLoading={isPostponing}
                size="md"
            >
                <div className="py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">
                            Mensaje (opcional)
                        </label>
                        <textarea
                            value={postponeModal.note}
                            onChange={(e) => setPostponeModal(prev => ({ ...prev, note: e.target.value }))}
                            rows={4}
                            placeholder="Escribe una nota sobre por qué la pospones (opcional)"
                            className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500 resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal Reprogramar */}
            <Modal
                isOpen={rescheduleModal.isOpen}
                onClose={handleCloseReschedule}
                onConfirm={handleRescheduleConfirm}
                title="Reprogramar"
                confirmText="Reprogramar"
                showCancel={true}
                isLoading={isRescheduling}
            >
                <div className="py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-zinc-700">Elige una nueva fecha</label>
                        <input
                            type="date"
                            value={rescheduleModal.newDate}
                            onChange={(e) => setRescheduleModal({ ...rescheduleModal, newDate: e.target.value })}
                            className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal Alerta */}
            <Modal
                isOpen={alertModal.isOpen}
                onClose={() => setAlertModal({ isOpen: false, type: 'success', title: '', message: '' })}
                onConfirm={() => setAlertModal({ isOpen: false, type: 'success', title: '', message: '' })}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                confirmText="Aceptar"
            />
        </>
    );

    const renderConflictModal = () => {
        const payload = conflictModal.conflictData?.payload;
        const alternativeDates = payload?.alternative_dates || [];
        const alternativeDate = alternativeDates[0];
        const hoursToReduce = payload?.hours_to_reduce;
        const minHours = payload?.min_hours || 0.5;
        const subtaskHours = conflictModal.subtask?.estimated_hours || 0;
        const plannedHours = payload?.planned_hours;
        const limitHours = payload?.limit_hours;

        let reducedHoursLabel = "Reducir horas estimadas";
        let reducedHoursValue = subtaskHours;

        if (hoursToReduce > 0 && subtaskHours > hoursToReduce) {
            reducedHoursValue = Math.max(subtaskHours - hoursToReduce, minHours);
            reducedHoursLabel = `Reducir a ${reducedHoursValue}h`;
        } else if (hoursToReduce > 0 && subtaskHours <= hoursToReduce) {
            // Si la reducción requerida haría que las horas fueran <= min_hours
            reducedHoursValue = 0;
        }

        const formatDateLong = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr + "T00:00:00");
            const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
            return `${d.getDate()} de ${months[d.getMonth()]}`;
        };

        return (
            <Modal
                isOpen={conflictModal.isOpen}
                onClose={() => setConflictModal({ isOpen: false, subtask: null, conflictData: null })}
                title="Conflicto de sobrecarga"
                icon={<AlertTriangle size={22} className="text-amber-500" />}
                hideFooter={true}
                size="lg"
            >
                {conflictModal.conflictData && (
                    <div className="flex flex-col">
                        <p className="text-slate-600 font-medium text-[15px] mb-4">
                            {conflictModal.conflictData.message}
                        </p>

                        {/* Detalle visual de horas */}
                        {plannedHours !== undefined && limitHours !== undefined && (
                            <div className="flex items-center gap-3 mb-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                                <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                                <p className="text-sm text-amber-800 font-medium">
                                    {plannedHours}h planificadas de {limitHours}h disponibles
                                </p>
                            </div>
                        )}

                        <p className="text-slate-500 font-medium text-[14px] mb-3">
                            ¿Cómo deseas resolverlo?
                        </p>

                        <div className="flex flex-col gap-2.5 mb-4">
                            {/* Opción: Mover a otro día */}
                            <button
                                onClick={() => {
                                    const subtask = conflictModal.subtask;
                                    setConflictModal({ isOpen: false, subtask: null, conflictData: null });

                                    setRescheduleModal({
                                        isOpen: true,
                                        subtask: subtask,
                                        newDate: alternativeDate || subtask.target_date || ''
                                    });
                                }}
                                className="flex items-center gap-2 bg-[#3b82f6] text-white px-4 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-blue-600 transition-colors shadow-sm w-full"
                            >
                                <Calendar size={18} strokeWidth={2.5} />
                                {alternativeDate ? `Mover al ${formatDateLong(alternativeDate)}` : 'Mover a otro día'}
                            </button>

                            {/* Más sugerencias si hay varias fechas alternativas */}
                            {alternativeDates.length > 1 && (
                                <div className="flex flex-wrap gap-1.5 pl-1">
                                    <span className="text-xs text-slate-400 font-medium">Otras fechas disponibles:</span>
                                    {alternativeDates.slice(1).map((altDate) => (
                                        <button
                                            key={altDate}
                                            onClick={() => {
                                                const subtask = conflictModal.subtask;
                                                setConflictModal({ isOpen: false, subtask: null, conflictData: null });
                                                setRescheduleModal({
                                                    isOpen: true,
                                                    subtask: subtask,
                                                    newDate: altDate
                                                });
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2 transition-colors"
                                        >
                                            {formatDateLong(altDate)}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Opción: Reducir horas */}
                            {reducedHoursValue > 0 && (
                                <button
                                    onClick={() => {
                                        const subtask = conflictModal.subtask;
                                        const targetDate = conflictModal.conflictData.attemptedDate || rescheduleModal.newDate || subtask.target_date;
                                        setConflictModal({ isOpen: false, subtask: null, conflictData: null });

                                        setReduceModal({
                                            isOpen: true,
                                            subtask: subtask,
                                            newDate: targetDate,
                                            newHours: reducedHoursValue
                                        });
                                    }}
                                    className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-[14px] font-semibold hover:bg-slate-200 transition-colors w-full"
                                >
                                    <RotateCcw size={18} strokeWidth={2.5} /> {reducedHoursLabel}
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setConflictModal({ isOpen: false, subtask: null, conflictData: null })}
                            className="text-slate-500 text-[13px] font-medium hover:text-slate-700 transition-colors self-end"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </Modal>
        );
    };

    const renderReduceModal = () => (
        <Modal
            isOpen={reduceModal.isOpen}
            onClose={handleCloseReduce}
            onConfirm={handleReduceConfirm}
            title="Reducir horas estimadas"
            confirmText="Guardar"
            showCancel={true}
            isLoading={isReducing}
        >
            <div className="py-2">
                <div className="space-y-4">
                    <p className="text-sm text-zinc-600">
                        Ajusta el tiempo que le dedicarás a esta tarea el <b>{formatDateShort(reduceModal.newDate)}</b> para no exceder tu límite.
                    </p>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-zinc-700">Nuevas horas estimadas</label>
                        <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={reduceModal.newHours}
                            onChange={(e) => setReduceModal({ ...reduceModal, newHours: parseFloat(e.target.value) || '' })}
                            className="w-full border border-zinc-300 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );

    return (
        <div className="p-8 w-full min-h-screen bg-[#F8FAFC]">
            {renderHeader()}
            {renderFilters()}

            {viewState === 'loading' && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                    <p className="text-zinc-500 font-medium">Cargando tu planificación...</p>
                </div>
            )}

            {viewState === 'success' && renderSuccess()}

            {viewState === 'empty' && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    {hasActiveFilters ? (
                        <p className="text-zinc-500 font-medium">
                            No hay tareas que coincidan con los filtros aplicados.
                        </p>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                            <Coffee size={64} strokeWidth={1.5} className="mb-4 text-zinc-300" />
                            <p className="font-medium text-zinc-500 text-lg mb-6">
                                No hay tareas programadas.
                            </p>
                            <Link to="/crear" className="bg-[#0B64F4] hover:bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95">
                                Crear actividad
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {viewState === 'error' && (
                <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-500">
                    <div className="w-40 h-40 bg-[#cbd5e1] rounded-full flex items-center justify-center mb-8">
                        <AlertCircle size={70} className="text-white" strokeWidth={2} />
                    </div>
                    <p className="text-[#94a3b8] text-lg font-medium max-w-md leading-relaxed mb-6">
                        Ha ocurrido un error cargando la información,
                        <br />inténtelo de nuevo.
                    </p>
                    <button
                        onClick={() => reload()}
                        className="flex items-center gap-2 bg-[#3b82f6] hover:bg-blue-600 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                    >
                        <RotateCcw size={18} /> Reintentar
                    </button>
                </div>
            )}
            {renderModals()}
            {renderConflictModal()}
            {renderReduceModal()}
        </div>
    );
};

export default HoyPage;