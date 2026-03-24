type ProgressBarColor = 'amber' | 'yellow' | 'green' | 'blue' | 'red' | 'cyan';

const COLOR = {
    amber: {
        track: 'bg-amber-100 border-amber-300',
        fill: 'from-amber-500 to-amber-600',
        text: 'text-amber-700',
    },
    yellow: {
        track: 'bg-yellow-100 border-yellow-300',
        fill: 'from-yellow-500 to-yellow-600',
        text: 'text-yellow-700',
    },
    green: {
        track: 'bg-green-100 border-green-300',
        fill: 'from-green-500 to-green-600',
        text: 'text-green-700',
    },
    blue: {
        track: 'bg-blue-100 border-blue-300',
        fill: 'from-blue-500 to-blue-600',
        text: 'text-blue-700',
    },
    red: {
        track: 'bg-red-100 border-red-300',
        fill: 'from-red-500 to-red-600',
        text: 'text-red-700',
    },
    cyan: {
        track: 'bg-cyan-100 border-cyan-300',
        fill: 'from-cyan-500 to-cyan-600',
        text: 'text-cyan-700',
    },
};

export function ProgressBar({
    value,
    max,
    color = 'amber',
    label,
    showPercent = true,
}: {
    value: number;
    max: number;
    color?: ProgressBarColor;
    label?: string;
    showPercent?: boolean;
}) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    const c = COLOR[color];

    return (
        <div>
            {label && (
                <div className={`text-xs font-semibold uppercase tracking-wide ${c.text} mb-1`}>
                    {label}
                </div>
            )}
            <div className={`w-full ${c.track} rounded-full h-5 overflow-hidden border`}>
                <div
                    className={`h-full bg-gradient-to-r ${c.fill} transition-all duration-150 flex items-center justify-center text-white text-xs font-bold`}
                    style={{ width: `${pct}%` }}
                >
                    {showPercent && pct > 15 && `${pct.toFixed(0)}%`}
                </div>
            </div>
        </div>
    );
}
