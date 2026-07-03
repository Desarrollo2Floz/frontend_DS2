import { Link } from 'react-router-dom';
import {
    Plus,
    UserCircle,
    Loader2,
    AlertCircle,
    BarChart2,
    RefreshCw,
    BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useActivities } from '../hooks/useActivities';
import DonutChart from '../components/progress/DonutChart';
import ProgressBar from '../components/progress/ProgressBar';
import ActivityProgressCard from '../components/progress/ActivityProgressCard';
import { STATUS_LEGEND } from '../components/progress/ActivityProgressSummary';

export default function ProgressPage() {
    const { user, loading: authLoading } = useAuth();
    const { activities, viewState, stats, reload } = useActivities();

    const displayName = (() => {
        const fullName = `${user?.name ?? ''} ${user?.last_name ?? ''}`.trim();
        if (fullName) return fullName;
        return 'Estudiante';
    })();

    const legendValues = {
        completed: stats.completed,
        pending: stats.pending,
        postponed: stats.postponed,
        overdue: stats.overdue,
    };

    return (
        <div className="p-8 w-full min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-zinc-100">
                <div>
                    <h1 className="text-4xl font-extrabold text-[#0B1525] mb-2 tracking-tight">Progreso</h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Consulta cuánto avanzas en cada actividad y en general
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-4 py-2 shadow-sm">
                        <UserCircle size={20} className="text-zinc-400" />
                        <span className="text-sm font-semibold text-zinc-700">
                            {authLoading ? '...' : displayName}
                        </span>
                    </div>
                    <Link
                        to="/crear"
                        className="bg-[#0B64F4] hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow"
                    >
                        <Plus size={16} />
                        Crear actividad
                    </Link>
                </div>
            </div>

            {/* Loading */}
            {viewState === 'loading' && (
                <div className="flex flex-col items-center justify-center h-[60vh]">
                    <Loader2 className="animate-spin text-[#0B64F4] mb-4" size={48} />
                    <p className="text-zinc-500 font-medium">Cargando progreso...</p>
                </div>
            )}

            {/* Error */}
            {viewState === 'error' && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                    <AlertCircle className="text-red-500 mb-4" size={48} />
                    <h2 className="text-lg font-bold text-zinc-800 mb-2">
                        No pudimos cargar tu progreso
                    </h2>
                    <p className="text-zinc-500 text-sm mb-6 max-w-md">
                        Ocurrió un problema al consultar tus actividades. Verifica tu conexión e inténtalo de nuevo.
                    </p>
                    <button
                        onClick={reload}
                        className="inline-flex items-center gap-2 bg-[#0B64F4] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                        <RefreshCw size={16} />
                        Reintentar
                    </button>
                </div>
            )}

            {/* Empty — sin actividades */}
            {viewState === 'empty' && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                    <BookOpen className="text-zinc-300 mb-4" size={56} />
                    <h2 className="text-lg font-bold text-zinc-800 mb-2">
                        Aún no tienes actividades
                    </h2>
                    <p className="text-zinc-500 text-sm mb-6 max-w-md">
                        Crea tu primera actividad y agrega subtareas para empezar a ver tu progreso aquí.
                    </p>
                    <Link
                        to="/crear"
                        className="inline-flex items-center gap-2 bg-[#0B64F4] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                        <Plus size={16} />
                        Crear actividad
                    </Link>
                </div>
            )}

            {/* Success */}
            {viewState === 'success' && (
                <>
                    {/* Badge de conteo */}
                    <div className="mb-6">
                        <span className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-600 text-sm font-semibold px-4 py-2 rounded-full shadow-sm">
                            <BarChart2 size={16} className="text-[#0B64F4]" />
                            {stats.activityCount} {stats.activityCount === 1 ? 'actividad' : 'actividades'}
                        </span>
                    </div>

                    {/* Progreso general */}
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <DonutChart percentage={stats.percentage} size={140} strokeWidth={14} />

                            <div className="flex-1 w-full">
                                <h2 className="text-xl font-bold text-[#0B1525] mb-1">Progreso General</h2>
                                <p className="text-zinc-500 text-sm font-medium mb-4">
                                    {stats.completed} de {stats.total} tareas completadas en {stats.activityCount}{' '}
                                    {stats.activityCount === 1 ? 'actividad' : 'actividades'}
                                </p>
                                <ProgressBar percentage={stats.percentage} className="mb-5" />

                                <div className="flex flex-wrap gap-x-6 gap-y-2">
                                    {STATUS_LEGEND.map(({ key, label, color }) => (
                                        <div key={key} className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                                            <span className="text-sm font-semibold text-zinc-600">
                                                {legendValues[key]}
                                            </span>
                                            <span className="text-sm text-zinc-400">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Grid de actividades */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activities.map((activity) => (
                            <ActivityProgressCard key={activity.id} activity={activity} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
