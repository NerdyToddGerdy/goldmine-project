import { useGameStore, getTotalPayroll, UPGRADES, BASE_EXTRACTION, SMELTING_FEE_PERCENT } from "../store/gameStore";

export function ResourceBar() {
    const gold = useGameStore((s) => s.gold);
    const money = useGameStore((s) => s.money);

    // Get worker counts and equipment
    const pans = useGameStore((s) => s.pans);
    const sluiceWorkers = useGameStore((s) => s.sluiceWorkers);
    const separatorWorkers = useGameStore((s) => s.separatorWorkers);
    const ovenWorkers = useGameStore((s) => s.ovenWorkers);
    const furnaceWorkers = useGameStore((s) => s.furnaceWorkers);
    const bankerWorkers = useGameStore((s) => s.bankerWorkers);
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const separatorGear = useGameStore((s) => s.separatorGear);
    const ovenGear = useGameStore((s) => s.ovenGear);
    const furnaceGear = useGameStore((s) => s.furnaceGear);

    // Calculate total payroll
    const totalPayroll = useGameStore((s) => getTotalPayroll(s));

    // Check if workers can be paid
    const canAffordWorkers = money >= totalPayroll / 60;

    // Calculate effective workers (0 if can't afford payroll)
    const effectivePans = canAffordWorkers ? pans : 0;
    const effectiveSluiceWorkers = canAffordWorkers ? sluiceWorkers : 0;
    const effectiveSeparatorWorkers = canAffordWorkers ? separatorWorkers : 0;
    const effectiveBankerWorkers = canAffordWorkers ? bankerWorkers : 0;

    // Calculate extraction rate from workers
    let extractionRate = BASE_EXTRACTION;
    extractionRate += effectiveSluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * sluiceGear;
    extractionRate += effectiveSeparatorWorkers * UPGRADES.separatorWorker.extractionBonus * separatorGear;

    // Gold rate: prospectors produce gold - bankers sell gold
    const goldSellRate = effectiveBankerWorkers > 0
        ? effectiveBankerWorkers * UPGRADES.bankerWorker.goldPerSec
        : 0;
    const goldRate = (effectivePans * UPGRADES.pan.goldPerSec * extractionRate / BASE_EXTRACTION) - goldSellRate;

    // Calculate auto-sell income from bankers
    let autoSellIncome = 0;
    if (goldSellRate > 0) {
        // Calculate value bonuses from oven/furnace workers
        let valueMultiplier = 1.0;
        valueMultiplier += ovenWorkers * UPGRADES.ovenWorker.valueBonus * ovenGear;
        valueMultiplier += furnaceWorkers * UPGRADES.furnaceWorker.valueBonus * furnaceGear;

        // Calculate smelting fee (furnace workers reduce it)
        let effectiveFeePercent = SMELTING_FEE_PERCENT;
        if (furnaceWorkers > 0) {
            effectiveFeePercent = Math.max(0, SMELTING_FEE_PERCENT - (furnaceWorkers * 0.015));
        }

        const baseValue = goldSellRate * valueMultiplier;
        const fee = baseValue * effectiveFeePercent;
        autoSellIncome = baseValue - fee;
    }

    // Money rate: auto-sell income - payroll
    const moneyRate = autoSellIncome - totalPayroll;

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <ResourceCard label="Gold" value={gold} rate={goldRate} icon="✨" color="yellow" />
                <ResourceCard label="Money" value={money} rate={moneyRate} icon="💰" color="green" />
            </div>
            {totalPayroll > 0 && (
                <div className="rounded-2xl border border-orange-200 dark:border-orange-800 shadow-sm p-3 bg-orange-50 dark:bg-orange-900/20">
                    <div className="flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wide text-orange-600 dark:text-orange-400 font-semibold">
                            Total Payroll
                        </div>
                        <div className="text-lg font-semibold tabular-nums text-orange-900 dark:text-orange-100">
                            💰 -${totalPayroll.toFixed(2)}/sec
                        </div>
                    </div>
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
    color
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

    // Determine rate display
    const ratePrefix = rate > 0 ? '+' : '';
    const rateColor = rate > 0
        ? 'text-green-600 dark:text-green-400'
        : rate < 0
        ? 'text-red-600 dark:text-red-400'
        : 'text-gray-500 dark:text-gray-400';

    return (
        <div className={`rounded-2xl border ${colors.border} shadow-sm p-4 ${colors.bg}`}>
            <div className={`text-xs uppercase tracking-wide ${colors.textLabel} font-semibold`}>
                {label}
            </div>
            <div className={`text-2xl font-semibold tabular-nums ${colors.textValue}`}>
                {icon} {value.toFixed(2)}
            </div>
            <div className={`text-xs font-semibold tabular-nums ${rateColor} mt-1`}>
                {ratePrefix}{rate.toFixed(2)}/sec
            </div>
        </div>
    );
}
