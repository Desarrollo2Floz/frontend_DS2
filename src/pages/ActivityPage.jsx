import React from 'react';
import {
    Calendar,
    Eye,
    Pencil,
    Trash2,
    Plus,
    UserCircle,
    Loader2,
    BookOpen,
    AlertCircle,
    LayoutList,
    HelpCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useActivities } from '../hooks/useActivities';
import { deleteActivity } from '../services/activityService';
import { useAuth } from '../context/useAuth';
import { getStoredDailyCapacityConflict, syncDailyCapacityConflictWithBackend } from '../utils/dailyCapacityConflict';
import { StreakWidget } from '../components/StreakWidget';


const ACTIVITY_TYPES_MAP = {
    'exam': 'Examen',
    'quiz': 'Quiz',
    'project': 'Proyecto',
    'homework': 'Tarea',
    'presentation': 'Presentación'
};

const ActivityPage = () => {
    const { activities = [], viewState, reload } = useActivities();
    const { user, loading: authLoading } = useAuth();
    const [dailyCapacityConflict, setDailyCapacityConflict] = React.useState(null);
    const [deletingId, setDeletingId] = React.useState(null)
    const [searchTerm, setSearchTerm] = React.useState('');
    const [itemsPerPage, setItemsPerPage] = React.useState(5);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [statusFilter, setStatusFilter] = React.useState('all');

     React.useEffect(() => {
        const loadStored = () => {
            setDailyCapacityConflict(getStoredDailyCapacityConflict())
        }

        const onConflictEvent = (evt) => {
            setDailyCapacityConflict(evt?.detail || null)
        }

        loadStored()
        window.addEventListener('daily-capacity-conflict', onConflictEvent)
        return () => window.removeEventListener('daily-capacity-conflict', onConflictEvent)
    }, [])

    const displayName = (() => {
        const fullName = `${user?.name ?? ''} ${user?.last_name ?? ''}`.trim();
        if (fullName) return fullName;
        return 'Estudiante';
    })();

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta actividad?')) return
        setDeletingId(id)
        try {
            await deleteActivity(id)
            reload() // Recarga la lista después de eliminar
            await syncDailyCapacityConflictWithBackend()
        } catch {
            alert('Ocurrió un error al eliminar la actividad. Intenta de nuevo.')
        } finally {
            setDeletingId(null)
        }
    }

    const filteredActivities = activities.filter(activity =>
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.course && activity.course.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const statusFilters = [
        { value: 'all', label: 'Todas' },
        { value: 'pending', label: 'Pendientes' },
        { value: 'completed', label: 'Completadas' },
        { value: 'overdue', label: 'Vencidas' },
    ];

    const filteredByStatus = filteredActivities.filter(activity => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'pending') {
            return activity?.status !== 'done' &&
                   !(Number(activity?.total_subtasks) > 0 &&
                     Number(activity?.completed_subtasks) === Number(activity?.total_subtasks));
        }
        if (statusFilter === 'completed') {
            return activity?.status === 'done' ||
                   (Number(activity?.total_subtasks) > 0 &&
                    Number(activity?.completed_subtasks) === Number(activity?.total_subtasks));
        }
        if (statusFilter === 'overdue') return activity?.status === 'overdue';
        return true;
    });

    const totalPages = Math.ceil(filteredByStatus.length / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedActivities = filteredByStatus.slice(startIdx, startIdx + itemsPerPage);

    const getStatusBadge = (activity) => {
        const isCompleted = activity?.status === 'done' ||
            (Number(activity?.total_subtasks) > 0 &&
                Number(activity?.completed_subtasks) === Number(activity?.total_subtasks));

        if (isCompleted) {
            return { text: 'Completada', className: 'bg-green-50 border-green-200 text-green-700' };
        }

        const isInProgress = Number(activity?.completed_subtasks) > 0 &&
            Number(activity?.completed_subtasks) < Number(activity?.total_subtasks);

        if (isInProgress) {
            return { text: 'En progreso', className: 'bg-blue-50 border-blue-200 text-blue-700' };
        }

        return { text: 'Pendiente', className: 'bg-zinc-50 border-zinc-200 text-zinc-700' };
    };

    const renderHeader = () => (
        <div className="flex justify-between items-start mb-10 pb-6 border-b border-zinc-100">
            <div className="flex gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-[#0B1525] mb-2 tracking-tight">Actividades Evaluativas</h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Gestiona y planifica tus compromisos académicos
                    </p>
                </div>
            </div>
            <div className="hidden md:flex flex-col items-end gap-3">
                <div>
                    <StreakWidget />
                </div>
                <div className="relative group">
                    <button className="flex items-center gap-1.5 justify-center text-blue-500 text-sm font-semibold hover:text-blue-600 transition-colors">
                        <HelpCircle size={16} />
                        ¿Cómo se ordena?
                    </button>
                    <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-800 text-zinc-200 text-xs rounded-xl p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none leading-relaxed">
                        <span className="font-bold text-white block mb-2">Estados de actividades</span>
                        <div className="space-y-1.5">
                            <div><span className="font-semibold text-white">Pendiente:</span> Tiene subtareas sin completar y su fecha límite aún no ha vencido.</div>
                            <div><span className="font-semibold text-white">Completada:</span> Todas sus subtareas han sido completadas.</div>
                            <div><span className="font-semibold text-white">Vencida:</span> Su fecha límite ya ha pasado.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (viewState === 'loading') {
        return (
            <div className="p-8 max-w-5xl mx-auto">
                {renderHeader()}
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
                    <p className="text-zinc-500 font-medium">Cargando actividades...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 w-full min-h-screen bg-[#F8FAFC]">
            {renderHeader()}

            {viewState !== 'error' && (
                <div className="mb-6 space-y-4">
                    {/* Buscador */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar actividades..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500 bg-white"
                        />
                    </div>

                    {/* Filtros y controles */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {statusFilters.map(filter => (
                                <button
                                    key={filter.value}
                                    onClick={() => {
                                        setStatusFilter(filter.value);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        statusFilter === filter.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-zinc-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-zinc-600">Mostrar:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 outline-none focus:border-blue-500 bg-white"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>

                            <Link
                                to="/crear"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow"
                            >
                                <Plus size={16} />
                                Nueva actividad
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {viewState === 'error' && (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <AlertCircle className="text-red-600 mb-4" size={48} />
                    <p className="text-red-600 font-medium">Ocurrió un error al cargar las actividades</p>
                </div>
            )}

            {viewState !== 'error' && filteredByStatus.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <BookOpen className="text-zinc-300 mb-4" size={48} />
                    <p className="text-zinc-500 font-medium">No hay actividades para mostrar</p>
                </div>
            )}

            {viewState !== 'error' && filteredByStatus.length > 0 && (
                <div className="space-y-4">
                    {paginatedActivities.map(activity => {
                        const badge = getStatusBadge(activity);
                        const completedCount = activity?.completed_subtasks || 0;
                        const totalCount = activity?.total_subtasks || 0;
                        
                        return (
                            <div
                                key={activity.id}
                                className="bg-white border border-zinc-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                                {/* Header: Título, Estado y Contador */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold text-zinc-800">
                                            {activity.title}
                                        </h3>
                                        <div className={`inline-block border px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}>
                                            {badge.text}
                                        </div>
                                    </div>
                                    <span className="text-lg text-zinc-400 font-semibold">
                                        {completedCount}/{totalCount}
                                    </span>
                                </div>

                                {/* Tipo y Fecha */}
                                <div className="flex items-center gap-4 mb-4">
                                    {activity.activity_type && (
                                        <span className="text-sm font-semibold bg-zinc-100 text-zinc-600 px-3 py-1 rounded">
                                            {ACTIVITY_TYPES_MAP[activity.activity_type] || activity.activity_type}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-2 text-sm text-zinc-600">
                                        <Calendar size={16} />
                                        <span>Límite: {new Date(activity.due_date).toLocaleDateString('es-ES')}</span>
                                    </div>
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex items-center gap-3">
                                    <Link
                                        to={`/actividad/${activity.id}`}
                                        className="flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                                    >
                                        <Eye size={16} />
                                        Ver
                                    </Link>
                                    <Link
                                        to={`/actividad/${activity.id}?edit=true`}
                                        className="flex items-center gap-2 px-4 py-2 border border-zinc-300 rounded-lg text-zinc-700 font-medium hover:bg-zinc-50 transition-colors"
                                    >
                                        <Pencil size={16} />
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(activity.id)}
                                        disabled={deletingId === activity.id}
                                        className="flex items-center gap-2 px-4 py-2 border border-red-300 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === activity.id ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Eliminando
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 size={16} />
                                                Eliminar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    
                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-2 border border-zinc-200 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            currentPage === page
                                                ? 'bg-blue-600 text-white'
                                                : 'border border-zinc-200 hover:bg-zinc-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 border border-zinc-200 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ActivityPage;