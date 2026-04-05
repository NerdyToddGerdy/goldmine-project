import { useGameStore, getEmployeePayroll, getAssignedPower, PROSPECTOR_PAN_RATE, SLUICE_EXTRACTION_RATE, getEffectiveBucketCapacity, BASE_EXTRACTION, GOLD_PRICE_UPDATE_TICKS, EMPLOYEE_WAGES, type FloatingNumber } from "../store/gameStore";
import { formatNumber, formatRate } from "../utils/format";
import { Tooltip } from "./ui";

export function ResourceBar() {
    const gold = useGameStore((s) => s.gold);
    const goldBars = useGameStore((s) => s.goldBars);
    const money = useGameStore((s) => s.money);

    const employees = useGameStore((s) => s.employees);
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const hasFurnace = useGameStore((s) => s.hasFurnace);

    // Bucket/pan state for idle detection
    const bucketFilled = useGameStore((s) => s.bucketFilled);
    const panFilled = useGameStore((s) => s.panFilled);
    const bucketUpgrades = useGameStore((s) => s.bucketUpgrades);

    const unlockedTown = useGameStore((s) => s.unlockedTown);
    const goldPrice = useGameStore((s) => s.goldPrice);
    const lastGoldPriceUpdate = useGameStore((s) => s.lastGoldPriceUpdate);
    const tickCount = useGameStore((s) => s.tickCount);

    // Active payroll (simplified display — idle deduction handled in _fixedTick)
    const totalPayroll = getEmployeePayroll(employees);
    const bucketCap = getEffectiveBucketCapacity(bucketUpgrades);
    const minersIdle = bucketFilled >= bucketCap;
    const prospectsIdle = panFilled < 1;
    const assignedMinerWages = employees
        .filter(e => e.assignedRole === 'miner')
        .reduce((sum, e) => sum + EMPLOYEE_WAGES[e.rarity], 0);
    const assignedProspectorWages = employees
        .filter(e => e.assignedRole === 'prospector')
        .reduce((sum, e) => sum + EMPLOYEE_WAGES[e.rarity], 0);
    const activePayroll = totalPayroll
        - (minersIdle ? assignedMinerWages : 0)
        - (prospectsIdle ? assignedProspectorWages : 0);

    // Check if workers can be paid
    const canAffordWorkers = money >= activePayroll / 60;

    // Stat-driven rates
    const prospectorPower = (canAffordWorkers && !prospectsIdle) ? getAssignedPower(employees, 'prospector') : 0;
    const sluiceOpPower = canAffordWorkers ? getAssignedPower(employees, 'sluiceOperator') : 0;

    let extractionRate = BASE_EXTRACTION;
    extractionRate += sluiceOpPower * SLUICE_EXTRACTION_RATE * sluiceGear;

    const goldRate = prospectorPower * PROSPECTOR_PAN_RATE * extractionRate / BASE_EXTRACTION;

    const moneyRate = -activePayroll;

    const goldPriceProgress = unlockedTown
        ? Math.min(1, (tickCount - lastGoldPriceUpdate) / GOLD_PRICE_UPDATE_TICKS)
        : undefined;

    const floatingNumbers = useGameStore((s) => s.floatingNumbers);
    const goldFloats = floatingNumbers.filter((f) => f.resource === 'gold');
    const moneyFloats = floatingNumbers.filter((f) => f.resource === 'money');

    return (
        <div className="space-y-1.5">
            <div className="grid gap-2 grid-cols-2">
                <div className="relative">
                    <ResourceCard
                        label={hasFurnace ? "Gold Bars" : "Gold"}
                        value={hasFurnace ? goldBars : gold}
                        rate={goldRate}
                        icon={hasFurnace ? "🧱" : "✨"}
                        color="yellow"
                        priceInfo={goldPriceProgress !== undefined ? { price: goldPrice, progress: goldPriceProgress } : undefined}
                    />
                    {goldFloats.map((f: FloatingNumber) => (
                        <span key={f.id} className="absolute top-0 right-2 text-xs font-bold text-yellow-500 animate-float-up pointer-events-none">
                            +{formatNumber(f.amount)}
                        </span>
                    ))}
                </div>
                <div className="relative">
                    <ResourceCard label="Money" value={money} rate={moneyRate} icon="💰" color="green" />
                    {moneyFloats.map((f: FloatingNumber) => (
                        <span key={f.id} className="absolute top-0 right-2 text-xs font-bold text-green-500 animate-float-up pointer-events-none">
                            +${formatNumber(f.amount)}
                        </span>
                    ))}
                </div>
            </div>
            {totalPayroll > 0 && (
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                    <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase tracking-wide">Payroll</span>
                    <span className="text-xs font-semibold tabular-nums text-orange-900 dark:text-orange-100">💰 -{formatNumber(activePayroll)}/sec</span>
                </div>
            )}
        </div>
    );
}

function ResourceCard({
    label,
    value,
    rate,
    icon,
    color,
    priceInfo,
}: {
    label: string;
    value: number;
    rate: number;
    icon: string;
    color: 'amber' | 'cyan' | 'yellow' | 'green';
    priceInfo?: { price: number; progress: number };
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
                    {icon} {formatNumber(value)}
                </div>
                <div className={`text-xs font-semibold tabular-nums ${rateColor}`}>
                    {formatRate(rate)}
                </div>
                {priceInfo && (
                    <div className="text-xs tabular-nums text-gray-500 dark:text-gray-400 mt-0.5">
                        <Tooltip content={`Price updates every ~${Math.round(GOLD_PRICE_UPDATE_TICKS / 3600)} min. Bar below shows time until next update.`}>
                            <span className="underline decoration-dotted cursor-help">📈 ${priceInfo.price.toFixed(2)}/oz</span>
                        </Tooltip>
                    </div>
                )}
            </div>
            {priceInfo && (
                <div className="h-1 bg-black/10 dark:bg-white/10">
                    <div
                        className="h-full bg-yellow-400 dark:bg-yellow-500 transition-[width] duration-300"
                        style={{ width: `${priceInfo.progress * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
