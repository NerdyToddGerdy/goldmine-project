type ProgressBarColor = 'amber' | 'yellow' | 'green' | 'blue' | 'red' | 'cyan';

const COLOR = {
    amber: {
        track: 'bg-amber-100 border-amber-300',
        fill: 'from-amber-500 to-amber-600',
        fillMid: 'from-amber-500 to-orange-500',
        fillFull: 'from-orange-500 to-red-500',
        glow: 'ring-2 ring-amber-400',
        text: 'text-amber-700',
    },
    yellow: {
        track: 'bg-yellow-100 border-yellow-300',
        fill: 'from-yellow-500 to-yellow-600',
        fillMid: 'from-yellow-500 to-yellow-600',
        fillFull: 'from-yellow-500 to-yellow-600',
        glow: 'ring-2 ring-yellow-400',
        text: 'text-yellow-700',
    },
    green: {
        track: 'bg-green-100 border-green-300',
        fill: 'from-green-500 to-green-600',
        fillMid: 'from-green-500 to-green-600',
        fillFull: 'from-green-500 to-green-600',
        glow: 'ring-2 ring-green-400',
        text: 'text-green-700',
    },
    blue: {
        track: 'bg-blue-100 border-blue-300',
        fill: 'from-blue-500 to-blue-600',
        fillMid: 'from-blue-500 to-blue-600',
        fillFull: 'from-blue-500 to-blue-600',
        glow: 'ring-2 ring-blue-400',
        text: 'text-blue-700',
    },
    red: {
        track: 'bg-red-100 border-red-300',
        fill: 'from-red-500 to-red-600',
        fillMid: 'from-red-500 to-red-600',
        fillFull: 'from-red-500 to-red-600',
        glow: 'ring-2 ring-red-400',
        text: 'text-red-700',
    },
    cyan: {
        track: 'bg-cyan-100 border-cyan-300',
        fill: 'from-cyan-500 to-cyan-600',
        fillMid: 'from-cyan-500 to-cyan-600',
        fillFull: 'from-cyan-500 to-cyan-600',
        glow: 'ring-2 ring-cyan-400',
        text: 'text-cyan-700',
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
            <div className={`w-full ${c.track} rounded-full h-5 overflow-hidden border transition-shadow duration-300 ${isFull ? `${c.glow} animate-pulse` : ''}`}>
                <div
                    className={`relative h-full bg-gradient-to-r ${fillClass} transition-all duration-150 flex items-center justify-center text-white text-xs font-bold overflow-hidden`}
                    style={{ width: `${pct}%` }}
                >
                    {showPercent && pct > 15 && `${pct.toFixed(0)}%`}
                    {isActive && (
                        <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    )}
                </div>
            </div>
        </div>
    );
}