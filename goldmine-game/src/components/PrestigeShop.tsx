import { useGameStore, gameStore, DUST_UPGRADE_COSTS, DUST_UPGRADE_MAX_LEVEL, DUST_HEAD_START_AMOUNTS } from "../store/gameStore";
import { formatNumber } from "../utils/format";

type DustUpgradeKey = 'scoopBoost' | 'panYield' | 'goldValue' | 'headStart' | 'bucketSize' | 'panSpeed' | 'panCapacity';

const DUST_UPGRADES: {
    key: DustUpgradeKey;
    name: string;
    icon: string;
    description: (level: number) => string;
}[] = [
    {
        key: 'scoopBoost',
        name: 'Scoop Boost',
        icon: '⛏️',
        description: (lvl) => `+${lvl * 10}% bucket fill speed${lvl < DUST_UPGRADE_MAX_LEVEL ? ` → +${(lvl + 1) * 10}%` : ' (maxed)'}`,
    },
    {
        key: 'panYield',
        name: 'Pan Yield',
        icon: '🥘',
        description: (lvl) => `+${lvl * 10}% gold extraction${lvl < DUST_UPGRADE_MAX_LEVEL ? ` → +${(lvl + 1) * 10}%` : ' (maxed)'}`,
    },
    {
        key: 'goldValue',
        name: 'Gold Value',
        icon: '💰',
        description: (lvl) => `+${lvl * 10}% sell price${lvl < DUST_UPGRADE_MAX_LEVEL ? ` → +${(lvl + 1) * 10}%` : ' (maxed)'}`,
    },
    {
        key: 'headStart',
        name: 'Head Start',
        icon: '🚀',
        description: (lvl) => {
            const curr = DUST_HEAD_START_AMOUNTS[lvl];
            const next = lvl < DUST_UPGRADE_MAX_LEVEL ? DUST_HEAD_START_AMOUNTS[lvl + 1] : curr;
            return lvl === 0
                ? `Begin each run with $${next} bonus money`
                : lvl < DUST_UPGRADE_MAX_LEVEL
                ? `+$${curr}/run → +$${next}/run`
                : `+$${curr}/run (maxed)`;
        },
    },
];

export function PrestigeShop() {
    const legacyDust = useGameStore((s) => s.legacyDust);
    const dustScoopBoost = useGameStore((s) => s.dustScoopBoost);
    const dustPanYield = useGameStore((s) => s.dustPanYield);
    const dustGoldValue = useGameStore((s) => s.dustGoldValue);
    const dustHeadStart = useGameStore((s) => s.dustHeadStart);
    const levelOf = (key: DustUpgradeKey) => {
        if (key === 'scoopBoost') return dustScoopBoost;
        if (key === 'panYield') return dustPanYield;
        if (key === 'goldValue') return dustGoldValue;
        return dustHeadStart;
    };

    const buy = (key: DustUpgradeKey) => gameStore.getState().buyDustUpgrade(key);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-amber-800">✨ Legacy Upgrades</h3>
                <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-sm font-semibold text-amber-800">
                    ✨ {formatNumber(legacyDust)} Dust
                </span>
            </div>
            <p className="text-sm text-amber-700">
                Permanent upgrades that persist through every New Creek reset.
            </p>

            <div className="space-y-3">
                {DUST_UPGRADES.map((upg) => {
                    const level = levelOf(upg.key);
                    const maxed = level >= DUST_UPGRADE_MAX_LEVEL;
                    const cost = maxed ? 0 : DUST_UPGRADE_COSTS[level];
                    const canAfford = !maxed && legacyDust >= cost;

                    return (
                        <div
                            key={upg.key}
                            className="p-4 bg-white border border-amber-200 rounded-xl shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-amber-900">
                                    {upg.icon} {upg.name}
                                </span>
                                <div className="flex gap-1">
                                    {Array.from({ length: DUST_UPGRADE_MAX_LEVEL }, (_, i) => (
                                        <span
                                            key={i}
                                            className={`w-3 h-3 rounded-full border ${
                                                i < level
                                                    ? 'bg-amber-500 border-amber-600'
                                                    : 'bg-amber-100 border-amber-300'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-amber-700 mb-3">{upg.description(level)}</p>
                            <button
                                onClick={() => buy(upg.key)}
                                disabled={maxed || !canAfford}
                                className={`w-full px-3 py-2 text-sm font-semibold rounded-lg transition-all ${
                                    maxed
                                        ? 'bg-green-100 text-green-700 cursor-default'
                                        : canAfford
                                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                        : 'bg-amber-100 text-amber-400 cursor-not-allowed'
                                }`}
                            >
                                {maxed ? '✅ Maxed' : `Buy — ✨ ${cost} Dust`}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}