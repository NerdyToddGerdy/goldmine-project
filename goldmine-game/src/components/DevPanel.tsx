import { useState } from 'react';
import { gameStore, useGameStore, getEffectiveBucketCapacity, getEffectivePanCapacity } from '../store/gameStore';
import { formatNumber } from '../utils/format';

const SPEEDS = [1, 2, 5, 10, 50];

const FLAGS = [
    { key: 'unlockedPanning',        label: '⛏️ Panning' },
    { key: 'unlockedTown',           label: '🏘️ Town' },
    { key: 'unlockedBanking',        label: '🏦 Banking' },
    { key: 'hasSluiceBox',           label: '💧 Sluice Box' },
    { key: 'hasFurnace',             label: '⚒️ Furnace' },
    { key: 'hasDriver',              label: '🚗 Driver' },
] as const;

type FlagKey = typeof FLAGS[number]['key'];

function card(children: React.ReactNode) {
    return (
        <div className="p-4 bg-white dark:bg-gray-800 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl space-y-3">
            {children}
        </div>
    );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {children}
        </h3>
    );
}

export function DevPanel() {
    const timeScale = useGameStore(s => s.timeScale);
    const gold = useGameStore(s => s.gold);
    const money = useGameStore(s => s.money);
    const dustBucketSize = useGameStore(s => s.dustBucketSize);
    const bucketUpgrades = useGameStore(s => s.bucketUpgrades);
    const dustPanCapacity = useGameStore(s => s.dustPanCapacity);
    const panCapUpgrades = useGameStore(s => s.panCapUpgrades);
    const devLogs = useGameStore(s => s.devLogs);

    const flags = useGameStore(s => ({
        unlockedPanning: s.unlockedPanning,
        unlockedTown: s.unlockedTown,
        unlockedBanking: s.unlockedBanking,
        hasSluiceBox: s.hasSluiceBox,
        hasFurnace: s.hasFurnace,
        hasDriver: s.hasDriver,
    }));

    const snap = useGameStore(s => ({
        tickCount: s.tickCount,
        timePlayed: s.timePlayed,
        timeScale: s.timeScale,
        isPaused: s.isPaused,
        location: s.location,
        bucketFilled: s.bucketFilled,
        panFilled: s.panFilled,
        goldInPocket: s.goldInPocket,
        gold: s.gold,
        money: s.money,
        goldPrice: s.goldPrice,
        lastGoldPriceUpdate: s.lastGoldPriceUpdate,
        driverTripTicks: s.driverTripTicks,
        lastRiskCheck: s.lastRiskCheck,
        runMoneyEarned: s.runMoneyEarned,
        legacyDust: s.legacyDust,
        prestigeCount: s.prestigeCount,
    }));

    const bucketCap = getEffectiveBucketCapacity(dustBucketSize + bucketUpgrades);
    const panCap = getEffectivePanCapacity(dustPanCapacity + panCapUpgrades);

    const [goldAmount, setGoldAmount] = useState('100');
    const [moneyAmount, setMoneyAmount] = useState('1000');
    const [bucketAmount, setBucketAmount] = useState(String(bucketCap));
    const [panAmount, setPanAmount] = useState(String(panCap));

    const inspectorRows: [string, string][] = [
        ['tickCount',           String(snap.tickCount)],
        ['timePlayed',          String(snap.timePlayed)],
        ['timeScale',           `${snap.timeScale}×`],
        ['isPaused',            snap.isPaused ? 'yes' : 'no'],
        ['location',            snap.location],
        ['bucketFilled',        snap.bucketFilled.toFixed(3)],
        ['panFilled',           snap.panFilled.toFixed(3)],
        ['gold',                formatNumber(snap.gold)],
        ['goldInPocket',        formatNumber(snap.goldInPocket)],
        ['money',               `$${formatNumber(snap.money)}`],
        ['goldPrice',           `$${snap.goldPrice.toFixed(3)}`],
        ['priceAge (ticks)',    String(snap.tickCount - snap.lastGoldPriceUpdate)],
        ['driverTripTicks',     String(snap.driverTripTicks)],
        ['lastRiskCheck',       String(snap.lastRiskCheck)],
        ['runMoneyEarned',      `$${formatNumber(snap.runMoneyEarned)}`],
        ['legacyDust',          String(snap.legacyDust)],
        ['prestigeCount',       String(snap.prestigeCount)],
    ];

    return (
        <div className="space-y-4">
            <h2 className="font-arcade text-sm text-zinc-700 dark:text-zinc-300">🛠️ Dev Tools</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Press <kbd className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 font-mono text-xs">Ctrl+Shift+D</kbd> to toggle dev mode.</p>

            {/* Speed (#26) */}
            {card(
                <>
                    <SectionHeader>⚡ Tick Speed</SectionHeader>
                    <div className="flex gap-2 flex-wrap">
                        {SPEEDS.map(s => (
                            <button
                                key={s}
                                onClick={() => gameStore.getState().setTimeScale(s)}
                                className={`px-3 py-1.5 rounded-lg font-mono text-sm font-bold border-2 transition-all ${
                                    timeScale === s
                                        ? 'bg-amber-400 border-amber-600 text-white'
                                        : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:border-amber-400'
                                }`}
                            >
                                {s}×
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Add Resources (#25) */}
            {card(
                <>
                    <SectionHeader>💰 Add Resources</SectionHeader>
                    <div className="space-y-2">
                        {/* Gold */}
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-xs text-zinc-600 dark:text-zinc-400">Gold (oz)</span>
                            <input
                                type="number"
                                value={goldAmount}
                                onChange={e => setGoldAmount(e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm font-mono text-zinc-900 dark:text-zinc-100"
                            />
                            <button
                                onClick={() => gameStore.setState({ gold: gold + (parseFloat(goldAmount) || 0) })}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 transition-all"
                            >
                                + Add
                            </button>
                        </div>
                        {/* Money */}
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-xs text-zinc-600 dark:text-zinc-400">Money ($)</span>
                            <input
                                type="number"
                                value={moneyAmount}
                                onChange={e => setMoneyAmount(e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm font-mono text-zinc-900 dark:text-zinc-100"
                            />
                            <button
                                onClick={() => gameStore.setState({ money: money + (parseFloat(moneyAmount) || 0) })}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-100 dark:bg-green-900/30 border border-green-400 text-green-800 dark:text-green-300 hover:bg-green-200 transition-all"
                            >
                                + Add
                            </button>
                        </div>
                        {/* Bucket fill */}
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-xs text-zinc-600 dark:text-zinc-400">Bucket</span>
                            <input
                                type="number"
                                value={bucketAmount}
                                onChange={e => setBucketAmount(e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm font-mono text-zinc-900 dark:text-zinc-100"
                            />
                            <button
                                onClick={() => gameStore.setState({ bucketFilled: Math.min(parseFloat(bucketAmount) || 0, bucketCap) })}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-stone-100 dark:bg-stone-900/30 border border-stone-400 text-stone-800 dark:text-stone-300 hover:bg-stone-200 transition-all"
                            >
                                Set
                            </button>
                        </div>
                        {/* Pan fill */}
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-xs text-zinc-600 dark:text-zinc-400">Pan</span>
                            <input
                                type="number"
                                value={panAmount}
                                onChange={e => setPanAmount(e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-sm font-mono text-zinc-900 dark:text-zinc-100"
                            />
                            <button
                                onClick={() => gameStore.setState({ panFilled: Math.min(parseFloat(panAmount) || 0, panCap) })}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 border border-blue-400 text-blue-800 dark:text-blue-300 hover:bg-blue-200 transition-all"
                            >
                                Set
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Unlock Flags (#28) */}
            {card(
                <>
                    <div className="flex items-center justify-between">
                        <SectionHeader>🔓 Unlock Flags</SectionHeader>
                        <button
                            onClick={() => gameStore.setState({
                                unlockedPanning: true, unlockedTown: true, unlockedBanking: true,
                                hasSluiceBox: true,
                                hasFurnace: true, hasDriver: true,
                            })}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 border border-purple-400 text-purple-800 dark:text-purple-300 hover:bg-purple-200 transition-all"
                        >
                            Unlock All
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {FLAGS.map(({ key, label }) => {
                            const active = flags[key as FlagKey];
                            return (
                                <button
                                    key={key}
                                    onClick={() => gameStore.setState({ [key]: !active })}
                                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all text-left ${
                                        active
                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 text-emerald-800 dark:text-emerald-300'
                                            : 'bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* State Inspector (#27) */}
            {card(
                <>
                    <SectionHeader>🔬 State Inspector</SectionHeader>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-xs">
                        {inspectorRows.map(([k, v]) => (
                            <>
                                <span key={`k-${k}`} className="text-zinc-500 dark:text-zinc-400 truncate">{k}</span>
                                <span key={`v-${k}`} className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">{v}</span>
                            </>
                        ))}
                    </div>
                </>
            )}

            {/* Event Log (#29) */}
            {card(
                <>
                    <div className="flex items-center justify-between">
                        <SectionHeader>📋 Event Log</SectionHeader>
                        <button
                            onClick={() => gameStore.setState({ devLogs: [] })}
                            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="h-40 overflow-y-auto font-mono text-xs space-y-0.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg p-2">
                        {devLogs.length === 0
                            ? <span className="text-zinc-400">No events yet. Driver sales, gold price changes, and risk events will appear here.</span>
                            : devLogs.map((line, i) => (
                                <div key={i} className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{line}</div>
                            ))
                        }
                    </div>
                </>
            )}
        </div>
    );
}
