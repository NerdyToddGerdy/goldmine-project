import { useGameStore, getAssignedPower, PROSPECTOR_PAN_RATE, SLUICE_EXTRACTION_RATE, BASE_EXTRACTION, MAX_EXTRACTION_RATE, type FloatingNumber } from "../store/gameStore";
import { formatNumber, formatRate } from "../utils/format";

export function ResourceBar() {
    const gold = useGameStore((s) => s.gold);
    const goldAtMine = useGameStore((s) => s.goldAtMine);
    const goldBarsAtMine = useGameStore((s) => s.goldBarsAtMine);
    const goldBars = useGameStore((s) => s.goldBars);

    const employees = useGameStore((s) => s.employees);
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const panFilled = useGameStore((s) => s.panFilled);

    const panSpeedUpgrades = useGameStore((s) => s.panSpeedUpgrades);
    const prospectsIdle = panFilled < 1;
    const prospectorPower = prospectsIdle ? 0 : getAssignedPower(employees, 'prospector');
    const sluiceOpPower = getAssignedPower(employees, 'sluiceOperator');
    let extractionRate = BASE_EXTRACTION;
    extractionRate += sluiceOpPower * SLUICE_EXTRACTION_RATE * sluiceGear;
    extractionRate = Math.min(extractionRate, MAX_EXTRACTION_RATE);
    const goldRate = prospectorPower * PROSPECTOR_PAN_RATE * (1 + 0.2 * panSpeedUpgrades) * extractionRate;

    const floatingNumbers = useGameStore((s) => s.floatingNumbers);
    const goldFloats = floatingNumbers.filter((f) => f.resource === 'gold');

    const pendingMine = goldAtMine + goldBarsAtMine;

    return (
        <div className="space-y-1.5">
            <div className="grid gap-2 grid-cols-2">
                <div className="relative">
                    <ResourceCard
                        label="Gold (Wallet)"
                        value={gold}
                        rate={goldRate}
                        icon="✨"
                        color="yellow"
                        pendingLine={pendingMine > 0 ? `⛰️ ${formatNumber(pendingMine)} oz at mine` : undefined}
                    />
                    {goldFloats.map((f: FloatingNumber) => (
                        <span key={f.id} className="absolute top-0 right-2 text-xs font-bold text-frontier-nugget animate-float-up pointer-events-none">
                            +{formatNumber(f.amount)}
                        </span>
                    ))}
                </div>
                {hasFurnace && goldBars > 0 && (
                    <ResourceCard
                        label="Gold Bars (Town)"
                        value={goldBars}
                        rate={0}
                        icon="🧱"
                        color="amber"
                        pendingLine="Sell at Trading Post"
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
    pendingLine,
}: {
    label: string;
    value: number;
    rate: number;
    icon: string;
    color: 'amber' | 'cyan' | 'yellow' | 'green';
    pendingLine?: string;
}) {
    const colorClasses = {
        amber: {
            border: 'border-frontier-nugget/40',
            textLabel: 'text-frontier-nugget',
            textValue: 'text-frontier-bone',
        },
        cyan: {
            border: 'border-frontier-dust/40',
            textLabel: 'text-frontier-dust',
            textValue: 'text-frontier-bone',
        },
        yellow: {
            border: 'border-frontier-nugget/40',
            textLabel: 'text-frontier-nugget',
            textValue: 'text-frontier-bone',
        },
        green: {
            border: 'border-frontier-sage/40',
            textLabel: 'text-frontier-sage',
            textValue: 'text-frontier-bone',
        },
    };

    const colors = colorClasses[color];

    const rateColor = rate > 0
        ? 'text-frontier-sage'
        : rate < 0
        ? 'text-frontier-rust'
        : 'text-frontier-dust';

    return (
        <div className={`rounded-sm border ${colors.border} overflow-hidden bg-frontier-coal/30 dark:bg-frontier-coal/60 shadow-sm`}>
            <div className="p-2">
                <div className={`font-display text-[9px] tracking-wide ${colors.textLabel}`}>
                    {label}
                </div>
                <div className={`text-base font-semibold tabular-nums ${colors.textValue}`}>
                    {icon} {formatNumber(value)} oz
                </div>
                <div className={`text-xs font-semibold tabular-nums ${rateColor}`}>
                    {formatRate(rate)}
                </div>
                {pendingLine && (
                    <div className="text-[9px] text-frontier-dust tabular-nums mt-0.5">
                        {pendingLine}
                    </div>
                )}
            </div>
        </div>
    );
}
