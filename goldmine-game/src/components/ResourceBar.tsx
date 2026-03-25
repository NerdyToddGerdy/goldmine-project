import { useGameStore, getTotalPayroll, getTotalWageForType, getEffectiveBucketCapacity, UPGRADES, BASE_EXTRACTION, SMELTING_FEE_PERCENT, GOLD_PRICE_UPDATE_TICKS } from "../store/gameStore";
import { formatNumber, formatRate } from "../utils/format";

export function ResourceBar() {
    const gold = useGameStore((s) => s.gold);
    const money = useGameStore((s) => s.money);

    // Get worker counts and equipment
    const shovels = useGameStore((s) => s.shovels);
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
    const hasFurnace = useGameStore((s) => s.hasFurnace);

    // Bucket/pan state for idle detection
    const bucketFilled = useGameStore((s) => s.bucketFilled);
    const panFilled = useGameStore((s) => s.panFilled);
    const dustBucketSize = useGameStore((s) => s.dustBucketSize);
    const bucketUpgrades = useGameStore((s) => s.bucketUpgrades);

    const legacyDust = useGameStore((s) => s.legacyDust);
    const prestigeCount = useGameStore((s) => s.prestigeCount);
    const unlockedTown = useGameStore((s) => s.unlockedTown);
    const goldPrice = useGameStore((s) => s.goldPrice);
    const lastGoldPriceUpdate = useGameStore((s) => s.lastGoldPriceUpdate);
    const tickCount = useGameStore((s) => s.tickCount);

    // Calculate total payroll, then subtract idle workers
    const totalPayroll = useGameStore((s) => getTotalPayroll(s));
    const bucketCap = getEffectiveBucketCapacity(dustBucketSize + bucketUpgrades);
    const minersIdle = bucketFilled >= bucketCap;
    const prospectsIdle = panFilled < 1;
    const activePayroll = totalPayroll
        - (minersIdle ? getTotalWageForType('shovel', shovels) : 0)
        - (prospectsIdle ? getTotalWageForType('pan', pans) : 0);

    // Check if workers can be paid
    const canAffordWorkers = money >= activePayroll / 60;

    // Calculate effective workers (0 if can't afford payroll or blocked)
    const effectivePans = (canAffordWorkers && !prospectsIdle) ? pans : 0;
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

        // Smelting fee applies without a furnace; furnace workers reduce it
        let effectiveFeePercent = !hasFurnace ? SMELTING_FEE_PERCENT : 0;
        if (!hasFurnace && furnaceWorkers > 0) {
            effectiveFeePercent = Math.max(0, SMELTING_FEE_PERCENT - (furnaceWorkers * 0.015));
        }

        const baseValue = goldSellRate * valueMultiplier;
        const fee = baseValue * effectiveFeePercent;
        autoSellIncome = baseValue - fee;
    }

    // Money rate: auto-sell income - active payroll
    const moneyRate = autoSellIncome - activePayroll;

    const goldPriceProgress = unlockedTown
        ? Math.min(1, (tickCount - lastGoldPriceUpdate) / GOLD_PRICE_UPDATE_TICKS)
        : undefined;

    return (
        <div className="space-y-1.5">
            <div className={`grid gap-2 ${prestigeCount > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <ResourceCard
                    label="Gold"
                    value={gold}
                    rate={goldRate}
                    icon="✨"
                    color="yellow"
                    priceInfo={goldPriceProgress !== undefined ? { price: goldPrice, progress: goldPriceProgress } : undefined}
                />
                <ResourceCard label="Money" value={money} rate={moneyRate} icon="💰" color="green" />
                {prestigeCount > 0 && (
                    <ResourceCard label="Legacy Dust" value={legacyDust} rate={0} icon="✨" color="amber" />
                )}
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
                <div className={`text-xs uppercase tracking-wide ${colors.textLabel} font-semibold`}>
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
                        📈 ${priceInfo.price.toFixed(2)}/oz
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
