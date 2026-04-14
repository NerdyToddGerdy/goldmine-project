import { useGameStore, gameStore, OIL_DERRICK_COST_BARS, EXCAVATOR_COST_BARS, WASHPLANT_COST_BARS, EXCAVATOR_MINE_MULT, WASHPLANT_SLUICE_MULT } from '../store/gameStore';

export function Mechanic() {
    const goldBars = useGameStore(s => s.goldBars);
    const hasOilDerrick = useGameStore(s => s.hasOilDerrick);
    const hasExcavator = useGameStore(s => s.hasExcavator);
    const hasWashplant = useGameStore(s => s.hasWashplant);

    const buy = (item: 'oilDerrick' | 'excavator' | 'washplant') =>
        gameStore.getState().buyFromMechanic(item);

    const items: {
        key: 'oilDerrick' | 'excavator' | 'washplant';
        icon: string;
        name: string;
        desc: string;
        cost: number;
        owned: boolean;
        requires?: string;
        available: boolean;
    }[] = [
        {
            key: 'oilDerrick',
            icon: '⛽',
            name: 'Oil Derrick',
            desc: 'Unlocks the Oil Field — drill crude oil and refine it into fuel.',
            cost: OIL_DERRICK_COST_BARS,
            owned: hasOilDerrick,
            available: true,
        },
        {
            key: 'excavator',
            icon: '🚜',
            name: 'Excavator',
            desc: `Boosts mining rate ×${EXCAVATOR_MINE_MULT} while the fuel tank is topped up.`,
            cost: EXCAVATOR_COST_BARS,
            owned: hasExcavator,
            available: true,
        },
        {
            key: 'washplant',
            icon: '🏭',
            name: 'Wash Plant',
            desc: `Boosts sluice throughput ×${WASHPLANT_SLUICE_MULT} while the fuel tank is topped up.`,
            cost: WASHPLANT_COST_BARS,
            owned: hasWashplant,
            requires: 'Sluice Box',
            available: true,
        },
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-display text-base text-frontier-bone tracking-wide">⚙️ Mechanic</h3>
            <p className="text-xs text-frontier-dust">Heavy machinery — purchased with gold bars.</p>

            <div className="space-y-3">
                {items.map(item => (
                    <div
                        key={item.key}
                        className={`p-3 rounded-sm border-2 space-y-2 ${
                            item.owned
                                ? 'border-frontier-sage/40 bg-frontier-sage/5'
                                : 'frontier-card'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-frontier-coal dark:text-frontier-bone">
                                    {item.icon} {item.name}
                                </p>
                                <p className="text-xs text-frontier-dust mt-0.5">{item.desc}</p>
                                {item.requires && !item.owned && (
                                    <p className="text-xs text-frontier-ember mt-0.5">Requires: {item.requires}</p>
                                )}
                            </div>
                            {item.owned ? (
                                <span className="shrink-0 text-xs font-bold text-frontier-sage bg-frontier-sage/10 px-2 py-1 rounded-sm">
                                    Owned
                                </span>
                            ) : (
                                <button
                                    onClick={() => buy(item.key)}
                                    disabled={goldBars < item.cost}
                                    className="shrink-0 frontier-btn-primary text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    {item.cost} bars
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-frontier-iron">
                            <span>Your bars: {goldBars.toFixed(2)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
