/**
 * Barra de progreso reutilizable (US-10).
 * Muestra el avance visual como porcentaje del ancho.
 */
export default function ProgressBar({ percentage = 0, className = '', barClassName = '' }) {
    const clamped = Math.min(100, Math.max(0, percentage));

    return (
        <div className={`w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden ${className}`}>
            <div
                className={`h-full rounded-full transition-all duration-500 ${barClassName || 'bg-[#0B64F4]'}`}
                style={{ width: `${clamped}%` }}
                role="progressbar"
                aria-valuenow={clamped}
                aria-valuemin={0}
                aria-valuemax={100}
            />
        </div>
    );
}
