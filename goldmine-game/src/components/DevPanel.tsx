import { useState } from 'react';
import { gameStore, useGameStore, getEffectiveBucketCapacity, getEffectivePanCapacity } from '../store/gameStore';
import { formatNumber } from '../utils/format';

const SPEEDS = [1, 2, 5, 10, 50];

const FLAGS = [
    { key: 'unlockedPanning',        label: '⛏️ Panning' },
    { key: 'unlockedTown',           label: '🏘️ Town' },
    { key: 'hasSluiceBox',           label: '💧 Sluice Box' },
    { key: 'hasFurnace',             label: '⚒️ Furnace' },
] as const;

type FlagKey = typeof FLAGS[number]['key'];

function card(children: React.ReactNode) {
    return (
        <div className="p-3 bg-frontier-coal/60 border border-frontier-iron/60 rounded-sm space-y-3">
            {children}
        </div>
    );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="frontier-label">
            {children}
        </h3>
    );
}

export function DevPanel() {
    const timeScale = useGameStore(s => s.timeScale);
    const gold = useGameStore(s => s.gold);
    const bucketUpgrades = useGameStore(s => s.bucketUpgrades);
    const panCapUpgrades = useGameStore(s => s.panCapUpgrades);
    const devLogs = useGameStore(s => s.devLogs);

    const flags = useGameStore(s => ({
        unlockedPanning: s.unlockedPanning,
        unlockedTown: s.unlockedTown,
        hasSluiceBox: s.hasSluiceBox,
        hasFurnace: s.hasFurnace,
    }));

    const snap = useGameStore(s => ({
        tickCount: s.tickCount,
        timePlayed: s.timePlayed,
        timeScale: s.timeScale,
        isPaused: s.isPaused,
        location: s.location,
        bucketFilled: s.bucketFilled,
        panFilled: s.panFilled,
        gold: s.gold,
        driverTripTicks: s.driverTripTicks,
        runGoldMined: s.runGoldMined,
        seasonNumber: s.seasonNumber,
    }));

    const bucketCap = getEffectiveBucketCapacity(bucketUpgrades);
    const panCap = getEffectivePanCapacity(panCapUpgrades);

    const [goldAmount, setGoldAmount] = useState('100');
    const [bucketAmount, setBucketAmount] = useState(String(bucketCap));
    const [panAmount, setPanAmount] = useState(String(panCap));

    const inspectorRows: [string, string][] = [
        ['tickCount',       String(snap.tickCount)],
        ['timePlayed',      String(snap.timePlayed)],
        ['timeScale',       `${snap.timeScale}×`],
        ['isPaused',        snap.isPaused ? 'yes' : 'no'],
        ['location',        snap.location],
        ['bucketFilled',    snap.bucketFilled.toFixed(3)],
        ['panFilled',       snap.panFilled.toFixed(3)],
        ['gold (oz)',       formatNumber(snap.gold)],
        ['driverTripTicks', String(snap.driverTripTicks)],
        ['runGoldMined',    `${formatNumber(snap.runGoldMined)} oz`],
        ['seasonNumber',    String(snap.seasonNumber)],
    ];

    return (
        <div className="space-y-4">
            <h2 className="font-display text-base text-frontier-bone tracking-wide">🛠️ Dev Tools</h2>
            <p className="text-xs text-frontier-dust font-body">Press <kbd className="px-1 py-0.5 rounded-sm bg-frontier-iron/40 border border-frontier-iron font-mono text-xs text-frontier-bone">Ctrl+Shift+D</kbd> to toggle dev mode.</p>

            {/* Speed */}
            {card(
                <>
                    <SectionHeader>⚡ Tick Speed</SectionHeader>
                    <div className="flex gap-2 flex-wrap">
                        {SPEEDS.map(s => (
                            <button
                                key={s}
                                onClick={() => gameStore.getState().setTimeScale(s)}
                                className={`px-3 py-1.5 rounded-sm font-mono text-sm font-bold border-2 transition-all ${
                                    timeScale === s
                                        ? 'bg-frontier-nugget/20 border-frontier-nugget text-frontier-nugget'
                                        : 'bg-frontier-coal/40 border-frontier-iron/60 text-frontier-dust hover:border-frontier-dust'
                                }`}
                            >
                                {s}×
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Add Resources */}
            {card(
                <>
                    <SectionHeader>💰 Add Resources</SectionHeader>
                    <div className="space-y-2">
                        {/* Gold */}
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-xs text-frontier-dust font-body">Gold (oz)</span>
                            <input
                                type="number"
                                value={goldAmount}
                                onChange={e => setGoldAmount(e.target.value)}
                                className="frontier-input w-24 text-xs font-mono py-1"
                            />
                            <button
                                onClick={() => gameStore.setState({ gold: gold + (parseFloat(goldAmount) || 0) })}
                                className="frontier-btn-ghost text-xs px-3 py-1 border border-frontier-nugget/50 text-frontier-nugget hover:bg-frontier-nugget/10"
                            >
                                + Add
                            </button>
                        </div>
                        {/* Bucket fill */}
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-xs text-frontier-dust font-body">Bucket</span>
                            <input
                                type="number"
                                value={bucketAmount}
                                onChange={e => setBucketAmount(e.target.value)}
                                className="frontier-input w-24 text-xs font-mono py-1"
                            />
                            <button
                                onClick={() => gameStore.setState({ bucketFilled: Math.min(parseFloat(bucketAmount) || 0, bucketCap) })}
                                className="frontier-btn-ghost text-xs px-3 py-1 border border-frontier-iron/60 text-frontier-dust hover:bg-frontier-iron/20"
                            >
                                Set
                            </button>
                        </div>
                        {/* Pan fill */}
                        <div className="flex items-center gap-2">
                            <span className="w-20 text-xs text-frontier-dust font-body">Pan</span>
                            <input
                                type="number"
                                value={panAmount}
                                onChange={e => setPanAmount(e.target.value)}
                                className="frontier-input w-24 text-xs font-mono py-1"
                            />
                            <button
                                onClick={() => gameStore.setState({ panFilled: Math.min(parseFloat(panAmount) || 0, panCap) })}
                                className="frontier-btn-ghost text-xs px-3 py-1 border border-frontier-iron/60 text-frontier-dust hover:bg-frontier-iron/20"
                            >
                                Set
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Unlock Flags */}
            {card(
                <>
                    <div className="flex items-center justify-between">
                        <SectionHeader>🔓 Unlock Flags</SectionHeader>
                        <button
                            onClick={() => gameStore.setState({
                                unlockedPanning: true, unlockedTown: true,
                                hasSluiceBox: true,
                                hasFurnace: true,
                            })}
                            className="frontier-btn-ghost text-xs px-2 py-1 border border-frontier-iron/60 text-frontier-dust"
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
                                    className={`px-2 py-1.5 rounded-sm text-xs font-semibold border-2 transition-all text-left font-body ${
                                        active
                                            ? 'bg-frontier-sage/20 border-frontier-sage text-frontier-sage'
                                            : 'bg-frontier-coal/40 border-frontier-iron/60 text-frontier-iron hover:border-frontier-dust'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* State Inspector */}
            {card(
                <>
                    <SectionHeader>🔬 State Inspector</SectionHeader>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-xs">
                        {inspectorRows.map(([k, v]) => (
                            <>
                                <span key={`k-${k}`} className="text-frontier-iron truncate">{k}</span>
                                <span key={`v-${k}`} className="text-frontier-bone font-semibold truncate">{v}</span>
                            </>
                        ))}
                    </div>
                </>
            )}

            {/* Event Log */}
            {card(
                <>
                    <div className="flex items-center justify-between">
                        <SectionHeader>📋 Event Log</SectionHeader>
                        <button
                            onClick={() => gameStore.setState({ devLogs: [] })}
                            className="text-xs text-frontier-iron hover:text-frontier-dust transition-colors font-body"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="h-40 overflow-y-auto font-mono text-xs space-y-0.5 bg-frontier-coal border border-frontier-iron/40 rounded-sm p-2">
                        {devLogs.length === 0
                            ? <span className="text-frontier-iron">No events yet. Driver sales, gold price changes, and risk events will appear here.</span>
                            : devLogs.map((line, i) => (
                                <div key={i} className="text-frontier-dust leading-relaxed">{line}</div>
                            ))
                        }
                    </div>
                </>
            )}
        </div>
    );
}
