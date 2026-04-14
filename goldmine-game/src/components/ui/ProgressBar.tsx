type ProgressBarColor = 'amber' | 'yellow' | 'green' | 'blue' | 'red' | 'cyan' | 'violet';

const COLOR = {
    amber: {
        track: 'frontier-progress-track',
        fill: 'frontier-progress-fill-amber',
        fillMid: 'frontier-progress-fill-amber',
        fillFull: 'frontier-progress-fill-rust',
        glow: 'ring-2 ring-frontier-nugget/70',
        text: 'text-frontier-nugget',
    },
    yellow: {
        track: 'frontier-progress-track',
        fill: 'frontier-progress-fill-amber',
        fillMid: 'frontier-progress-fill-amber',
        fillFull: 'frontier-progress-fill-rust',
        glow: 'ring-2 ring-frontier-nugget/70',
        text: 'text-frontier-nugget',
    },
    green: {
        track: 'frontier-progress-track',
        fill: 'frontier-progress-fill-sage',
        fillMid: 'frontier-progress-fill-sage',
        fillFull: 'frontier-progress-fill-sage',
        glow: 'ring-2 ring-frontier-sage/70',
        text: 'text-frontier-sage',
    },
    blue: {
        track: 'frontier-progress-track',
        fill: 'bg-gradient-to-r from-blue-600 to-blue-700 h-full transition-all duration-150',
        fillMid: 'bg-gradient-to-r from-blue-600 to-blue-700 h-full transition-all duration-150',
        fillFull: 'bg-gradient-to-r from-blue-600 to-blue-700 h-full transition-all duration-150',
        glow: 'ring-2 ring-blue-500/70',
        text: 'text-blue-400',
    },
    red: {
        track: 'frontier-progress-track',
        fill: 'frontier-progress-fill-rust',
        fillMid: 'frontier-progress-fill-rust',
        fillFull: 'frontier-progress-fill-rust',
        glow: 'ring-2 ring-frontier-rust/70',
        text: 'text-frontier-rust',
    },
    cyan: {
        track: 'frontier-progress-track',
        fill: 'frontier-progress-fill-mud',
        fillMid: 'frontier-progress-fill-mud',
        fillFull: 'frontier-progress-fill-mud',
        glow: 'ring-2 ring-frontier-dust/70',
        text: 'text-frontier-dust',
    },
    violet: {
        track: 'frontier-progress-track',
        fill: 'frontier-progress-fill-iron',
        fillMid: 'frontier-progress-fill-iron',
        fillFull: 'frontier-progress-fill-iron',
        glow: 'ring-2 ring-frontier-iron/70',
        text: 'text-frontier-dust',
    },
};

export function ProgressBar({
    value,
    max,
    color = 'amber',
    label,
    showPercent = true,
    isActive = false,
    isFull = false,
}: {
    value: number;
    max: number;
    color?: ProgressBarColor;
    label?: string;
    showPercent?: boolean;
    isActive?: boolean;
    isFull?: boolean;
}) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    const c = COLOR[color];

    const fillClass = isFull ? c.fillFull : pct >= 60 ? c.fillMid : c.fill;

    return (
        <div>
            {label && (
                <div className={`text-xs font-semibold uppercase tracking-wide ${c.text} mb-1`}>
                    {label}
                </div>
            )}
            <div className={`w-full ${c.track} rounded-sm h-5 overflow-hidden border transition-shadow duration-300 ${isFull ? `${c.glow} animate-pulse` : ''}`}>
                <div
                    className={`relative h-full ${fillClass} flex items-center justify-center text-frontier-bone text-xs font-bold overflow-hidden`}
                    style={{ width: `${pct}%` }}
                >
                    {showPercent && pct > 15 && `${pct.toFixed(0)}%`}
                    {isActive && (
                        <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    )}
                </div>
            </div>
        </div>
    );
}
