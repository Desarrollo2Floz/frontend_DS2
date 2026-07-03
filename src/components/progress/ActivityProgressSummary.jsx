import ProgressBar from './ProgressBar';
import DonutChart from './DonutChart';

const STATUS_LEGEND = [
    { key: 'completed', label: 'Completadas', color: 'bg-green-500' },
    { key: 'pending', label: 'Pendientes', color: 'bg-zinc-300' },
    { key: 'postponed', label: 'Pospuestas', color: 'bg-amber-400' },
    { key: 'overdue', label: 'Vencidas', color: 'bg-red-500' },
];

/**
 * Resumen compacto de progreso para el detalle de una actividad (US-10).
 */
export default function ActivityProgressSummary({ completed = 0, total = 0, percentage = 0 }) {
    const hasSubtasks = total > 0;

    return (
        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5">
            <div className="flex items-center gap-5">
                <DonutChart percentage={percentage} size={88} strokeWidth={10} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-500 mb-1">Progreso de la actividad</p>
                    {hasSubtasks ? (
                        <>
                            <p className="text-lg font-bold text-[#0B1525] mb-1">
                                {completed} de {total} subtareas completadas
                            </p>
                            <p className="text-sm text-zinc-500 mb-3">{percentage}% completado</p>
                            <ProgressBar percentage={percentage} />
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-bold text-[#0B1525] mb-1">0 de 0 subtareas</p>
                            <p className="text-sm text-amber-700 font-medium">
                                Aún no tienes subtareas. Crea un plan inicial.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export { STATUS_LEGEND };
