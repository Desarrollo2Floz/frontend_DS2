import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { ACTIVITY_TYPE_LABELS } from '../../utils/progressUtils';

/**
 * Tarjeta de progreso por actividad (US-10).
 * Muestra conteo DONE/TOTAL, barra y enlace al detalle.
 */
export default function ActivityProgressCard({ activity }) {
    const completed = activity?.completed ?? activity?.completed_subtasks ?? 0;
    const total = activity?.total ?? activity?.total_subtasks ?? 0;
    const percentage = activity?.percentage ?? (total > 0 ? Math.round((completed / total) * 1000) / 10 : 0);
    const hasSubtasks = total > 0;
    const isComplete = hasSubtasks && completed === total;

    const typeLabel = ACTIVITY_TYPE_LABELS[activity?.type] || activity?.type || 'Actividad';

    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-zinc-800 leading-snug line-clamp-2">
                    {activity.title}
                </h3>
                <span className="text-[10px] font-bold tracking-wider uppercase bg-zinc-100 text-zinc-500 px-2 py-1 rounded shrink-0">
                    {typeLabel}
                </span>
            </div>

            {activity.course && (
                <p className="text-sm text-zinc-400 font-medium -mt-1">{activity.course}</p>
            )}

            <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 font-medium">
                    {completed}/{total} tareas
                </span>
                {hasSubtasks && (
                    <span className="text-zinc-400 font-semibold">{percentage}%</span>
                )}
            </div>

            {hasSubtasks ? (
                <ProgressBar
                    percentage={percentage}
                    barClassName={isComplete ? 'bg-green-500' : 'bg-[#0B64F4]'}
                />
            ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-700 font-medium leading-relaxed">
                        Aún no tienes subtareas. Crea un plan inicial.
                    </p>
                </div>
            )}

            <Link
                to={`/actividad/${activity.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B64F4] hover:text-blue-700 transition-colors mt-auto"
            >
                Ver detalle
                <ArrowRight size={14} />
            </Link>
        </div>
    );
}
