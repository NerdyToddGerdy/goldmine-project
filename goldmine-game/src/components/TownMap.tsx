import { useState } from 'react';
import { gameStore, useGameStore, getCommissionOptions, getSeasonGoal, getSettlementStage, getTraderHeadStart } from '../store/gameStore';
import type { NPCId } from '../store/schema';
import { Building } from './ui/Building';

const NPC_META: Record<NPCId, { emoji: string; name: string }> = {
    trader:       { emoji: '🏪', name: 'Trader' },
    tavernKeeper: { emoji: '🍺', name: 'Tavern Keeper' },
    assayer:      { emoji: '⚖️', name: 'Assayer' },
    blacksmith:   { emoji: '🔨', name: 'Blacksmith' },
};

export type TownPanel = 'shop' | 'tavern' | 'assayer' | 'blacksmith';

interface TownMapProps {
    onOpenPanel: (panel: TownPanel) => void;
}

export function TownMap({ onOpenPanel }: TownMapProps) {
    const [showCommission, setShowCommission] = useState(false);

    const storyNPCs = useGameStore(s => s.storyNPCs);
    const npcLevels = useGameStore(s => s.npcLevels);
    const runGoldMined = useGameStore(s => s.runGoldMined);
    const seasonNumber = useGameStore(s => s.seasonNumber);
    const seasonGoal = getSeasonGoal(seasonNumber);
    const settlement = getSettlementStage(seasonNumber);
    const employees = useGameStore(s => s.employees);
    const isTraveling = useGameStore(s => s.isTraveling);

    const noneArrived = !storyNPCs.traderArrived && !storyNPCs.tavernBuilt;
    const traderArrived    = storyNPCs.traderArrived    || noneArrived;
    const tavernBuilt      = storyNPCs.tavernBuilt      || noneArrived;
    const assayerArrived   = storyNPCs.assayerArrived;
    const blacksmithArrived = storyNPCs.blacksmithArrived;

    const seasonPct = Math.min(100, (runGoldMined / seasonGoal) * 100);
    const seasonGoalMet = seasonPct >= 100;
    const nearEnd = seasonPct >= 70;

    const assignedCount = employees.filter(e => e.assignedRole !== null).length;

    const commissionOptions = getCommissionOptions(storyNPCs, npcLevels);

    return (
        <div className={`space-y-4${isTraveling ? ' pointer-events-none opacity-50' : ''}`}>

            {/* Season earnings bar */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-frontier-sage">
                    <span className="font-semibold">Season earnings</span>
                    <span className="font-body">{runGoldMined.toFixed(0)} oz / {seasonGoal.toLocaleString()} oz</span>
                </div>
                <div className="relative h-3 rounded-sm overflow-hidden border" style={{ background: 'linear-gradient(to bottom, #0e1a08, #1a2e0f)', borderColor: 'var(--fw-pine)' }}>
                    <div
                        className={`h-full transition-all duration-300 ${nearEnd ? 'bg-gradient-to-r from-blue-700 to-indigo-800' : 'frontier-progress-fill-sage'}`}
                        style={{ width: `${seasonPct}%` }}
                    />
                    {nearEnd && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs leading-none">❄️</span>
                    )}
                </div>

                {/* Prepare for Winter / Commission panel */}
                {seasonGoalMet && !showCommission && (
                    <button
                        onClick={() => setShowCommission(true)}
                        className="w-full mt-1 py-1.5 text-xs font-semibold rounded-sm bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-700 transition-all font-body"
                    >
                        ❄️ Prepare for Winter
                    </button>
                )}

                {seasonGoalMet && showCommission && (
                    <div className="mt-2 space-y-3 p-3 rounded-sm border-2 border-blue-900/60 bg-blue-950/40">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-blue-200">❄️ Commission a town improvement</p>
                            <button
                                onClick={() => setShowCommission(false)}
                                className="text-xs text-blue-400 hover:text-blue-200"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-blue-300">Choose one NPC to level up this winter. Season resets after.</p>

                        {/* Head-start preview */}
                        {(() => {
                            const traderLevel = npcLevels.trader ?? 0;
                            const currentStart = getTraderHeadStart(traderLevel);
                            const nextStart = getTraderHeadStart(traderLevel + 1);
                            if (currentStart > 0) {
                                return (
                                    <p className="text-xs text-frontier-nugget font-semibold text-center">
                                        🥇 Next season starts with {currentStart} oz (Trader L{traderLevel})
                                    </p>
                                );
                            } else if (nextStart > 0) {
                                return (
                                    <p className="text-xs text-frontier-dust text-center">
                                        Commission the Trader to start next season with {nextStart} oz
                                    </p>
                                );
                            }
                            return null;
                        })()}

                        {commissionOptions.length === 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs text-frontier-dust text-center">No NPCs have arrived yet — winter still approaches.</p>
                                <button
                                    onClick={() => { setShowCommission(false); gameStore.getState().selectCommission(null as unknown as NPCId); }}
                                    className="w-full py-2 text-xs font-semibold rounded-sm bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-700 transition-all font-body"
                                >
                                    Head into Winter
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {commissionOptions.map(npcId => {
                                    const meta = NPC_META[npcId];
                                    const currentLevel = npcLevels[npcId] ?? 0;
                                    const headStartGain = npcId === 'trader'
                                        ? getTraderHeadStart(currentLevel + 1) - getTraderHeadStart(currentLevel)
                                        : 0;
                                    return (
                                        <div key={npcId} className="flex items-center gap-2 p-2 rounded-sm bg-frontier-coal/40 border border-blue-900/40">
                                            <span className="text-xl">{meta.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-frontier-bone">{meta.name}</p>
                                                <p className="text-xs text-frontier-dust">
                                                    Level {currentLevel} → {currentLevel + 1}
                                                    {headStartGain > 0 && (
                                                        <span className="ml-1 text-frontier-nugget font-semibold">+{headStartGain} oz start</span>
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => { setShowCommission(false); gameStore.getState().selectCommission(npcId); }}
                                                className="text-xs px-2 py-1 rounded-sm bg-blue-900 hover:bg-blue-800 text-blue-100 border border-blue-700 font-semibold transition-all whitespace-nowrap font-body"
                                            >
                                                Choose
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mine Site — clickable, triggers travel */}
            <div
                onClick={() => gameStore.getState().startTravel('mine')}
                className="flex items-center gap-3 p-3 rounded-sm border-2 border-frontier-ember/40 bg-frontier-ember/10 hover:bg-frontier-ember/20 hover:border-frontier-ember active:scale-[0.99] transition-all cursor-pointer shadow-sm"
            >
                <span className="text-2xl">⛰️</span>
                <div className="flex-1">
                    <p className="font-semibold text-frontier-bone text-sm">Mine Site</p>
                    <p className="text-xs text-frontier-dust">Head back to work</p>
                </div>
                <span className="text-frontier-ember font-bold">›</span>
            </div>

            {/* Trail + Camp */}
            <div className="flex flex-col items-center gap-0 py-1">
                <div className="w-0.5 h-4 bg-frontier-hide/40" />
                <div className="px-4 py-2 rounded-sm border border-frontier-hide/40 bg-frontier-parchment/20 dark:bg-frontier-coal/40 text-sm text-frontier-aged font-semibold">
                    {settlement.emoji} Your {settlement.name}
                </div>
                <div className="w-0.5 h-4 bg-frontier-hide/40" />
                <div className="w-full h-px bg-frontier-hide/40" />
            </div>

            {/* Town buildings */}
            <div>
                <p className="frontier-label mb-3 text-center">Town</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-4 justify-items-center">
                    <Building
                        emoji="🏪"
                        name="Trading Post"
                        locked={!traderArrived}
                        lockHint="Sell gold to attract a trader"
                        onClick={() => onOpenPanel('shop')}
                    />

                    <Building
                        emoji="🍺"
                        name="Tavern"
                        locked={!tavernBuilt}
                        lockHint="As workers gather, someone will want to keep them fed and watered"
                        onClick={() => onOpenPanel('tavern')}
                    >
                        {assignedCount > 0 ? assignedCount : undefined}
                    </Building>

                    <Building
                        emoji="⚖️"
                        name="Assayer"
                        locked={!assayerArrived}
                        lockHint="Coming in a future update"
                        onClick={() => onOpenPanel('assayer')}
                    />

                    <Building
                        emoji="🔨"
                        name="Blacksmith"
                        locked={!blacksmithArrived}
                        lockHint="Sell gold to draw a blacksmith"
                        onClick={() => onOpenPanel('blacksmith')}
                    />
                </div>
                {/* Boardwalk strip */}
                <div
                    className="mt-1 w-full h-2.5 rounded-b-sm"
                    style={{
                        background: 'linear-gradient(to bottom, var(--fw-hide), var(--fw-rust))',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.4)'
                    }}
                />
            </div>
        </div>
    );
}
