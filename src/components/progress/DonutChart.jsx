/**
 * Gráfico circular de progreso (US-10).
 * Implementado con SVG puro, sin dependencias externas.
 */
export default function DonutChart({ percentage = 0, size = 120, strokeWidth = 12 }) {
    const clamped = Math.min(100, Math.max(0, percentage));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (clamped / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#E4E4E7"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#0B64F4"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-700 ease-out"
                />
            </svg>
            <span className="absolute text-2xl font-extrabold text-[#0B1525]">
                {clamped}%
            </span>
        </div>
    );
}
