import { useGameStore, getAssignedPower, PROSPECTOR_PAN_RATE, SLUICE_EXTRACTION_RATE, BASE_EXTRACTION, type FloatingNumber } from "../store/gameStore";
import { formatNumber, formatRate } from "../utils/format";

export function ResourceBar() {
    const gold = useGameStore((s) => s.gold);
    const goldBars = useGameStore((s) => s.goldBars);

    const employees = useGameStore((s) => s.employees);
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const panFilled = useGameStore((s) => s.panFilled);

    // Stat-driven gold production rate (prospectors only produce when pan has material)
    const prospectsIdle = panFilled < 1;
    const prospectorPower = prospectsIdle ? 0 : getAssignedPower(employees, 'prospector');
    const sluiceOpPower = getAssignedPower(employees, 'sluiceOperator');
    let extractionRate = BASE_EXTRACTION;
    extractionRate += sluiceOpPower * SLUICE_EXTRACTION_RATE * sluiceGear;
    const goldRate = prospectorPower * PROSPECTOR_PAN_RATE * extractionRate / BASE_EXTRACTION;

    const floatingNumbers = useGameStore((s) => s.floatingNumbers);
    const goldFloats = floatingNumbers.filter((f) => f.resource === 'gold');

    return (
        <div className="space-y-1.5">
            <div className="grid gap-2 grid-cols-2">
                <div className="relative">
                    <ResourceCard
                        label="Gold"
                        value={gold}
                        rate={goldRate}
                        icon="✨"
                        color="yellow"
                    />
                    {goldFloats.map((f: FloatingNumber) => (
                        <span key={f.id} className="absolute top-0 right-2 text-xs font-bold text-yellow-500 animate-float-up pointer-events-none">
                            +{formatNumber(f.amount)}
                        </span>
                    ))}
                </div>
                {hasFurnace && goldBars > 0 && (
                    <ResourceCard
                        label="Gold Bars"
                        value={goldBars}
                        rate={0}
                        icon="🧱"
                        color="amber"
                    />
                )}
            </div>
        </div>
    );
}

function ResourceCard({
    label,
    value,
    rate,
    icon,
    color,
}: {
    label: string;
    value: number;
    rate: number;
    icon: string;
    color: 'amber' | 'cyan' | 'yellow' | 'green';
}) {
    const colorClasses = {
        amber: {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800',
            textLabel: 'text-amber-600 dark:text-amber-400',
            textValue: 'text-amber-900 dark:text-amber-100'
        },
        cyan: {
            bg: 'bg-cyan-50 dark:bg-cyan-900/20',
            border: 'border-cyan-200 dark:border-cyan-800',
            textLabel: 'text-cyan-600 dark:text-cyan-400',
            textValue: 'text-cyan-900 dark:text-cyan-100'
        },
        yellow: {
            bg: 'bg-yellow-50 dark:bg-yellow-900/20',
            border: 'border-yellow-200 dark:border-yellow-800',
            textLabel: 'text-yellow-600 dark:text-yellow-400',
            textValue: 'text-yellow-900 dark:text-yellow-100'
        },
        green: {
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800',
            textLabel: 'text-green-600 dark:text-green-400',
            textValue: 'text-green-900 dark:text-green-100'
        }
    };

    const colors = colorClasses[color];

    const rateColor = rate > 0
        ? 'text-green-600 dark:text-green-400'
        : rate < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500 dark:text-gray-400';

    return (
        <div className={`rounded-xl border ${colors.border} shadow-sm overflow-hidden ${colors.bg}`}>
            <div className="p-2">
                <div className={`font-arcade text-[9px] ${colors.textLabel}`}>
                    {label}
                </div>
                <div className={`text-base font-semibold tabular-nums ${colors.textValue}`}>
                    {icon} {formatNumber(value)} oz
                </div>
                <div className={`text-xs font-semibold tabular-nums ${rateColor}`}>
                    {formatRate(rate)}
                </div>
            </div>
        </div>
    );
}

