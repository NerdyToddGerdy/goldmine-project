import { useState } from 'react';
import { gameStore, useGameStore, getCommissionCost, getCommissionOptions, getSeasonGoal, getSettlementStage } from '../store/gameStore';
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
    const gold = useGameStore(s => s.gold);

    // Graceful fallback: if NPC triggers haven't fired yet,
    // treat the core two buildings as arrived once town is unlocked.
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
                <div className="flex items-center justify-between text-xs text-green-700">
                    <span className="font-semibold">Season earnings</span>
                    <span className="font-mono">{runGoldMined.toFixed(0)} oz / {seasonGoal.toLocaleString()} oz</span>
                </div>
                <div className="relative h-3 rounded-full overflow-hidden bg-green-100 border border-green-200">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${nearEnd ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`}
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
                        className="w-full mt-1 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
                    >
                        ❄️ Prepare for Winter
                    </button>
                )}

                {seasonGoalMet && showCommission && (
                    <div className="mt-2 space-y-3 p-3 rounded-xl border-2 border-indigo-200 bg-indigo-50">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-indigo-800">❄️ Commission a town improvement</p>
                            <button
                                onClick={() => setShowCommission(false)}
                                className="text-xs text-indigo-500 hover:text-indigo-700"
                            >
                                ✕
                            </button>
                        </div>
                        <p className="text-xs text-indigo-600">Choose one NPC to level up this winter. Season resets after.</p>

                        {commissionOptions.length === 0 ? (
                            <div className="space-y-2">
                                <p className="text-xs text-gray-400 text-center">No NPCs have arrived yet — winter still approaches.</p>
                                <button
                                    onClick={() => { setShowCommission(false); gameStore.getState().selectCommission(null as unknown as NPCId); }}
                                    className="w-full py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-all"
                                >
                                    Head into Winter
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {commissionOptions.map(npcId => {
                                    const meta = NPC_META[npcId];
                                    const currentLevel = npcLevels[npcId] ?? 0;
                                    const cost = getCommissionCost(npcId, currentLevel);
                                    const canAfford = gold >= cost;
                                    return (
                                        <div key={npcId} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-indigo-200">
                                            <span className="text-xl">{meta.emoji}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-gray-800">{meta.name}</p>
                                                <p className="text-xs text-gray-500">Level {currentLevel} → {currentLevel + 1}</p>
                                            </div>
                                            <button
                                                onClick={() => { setShowCommission(false); gameStore.getState().selectCommission(npcId); }}
                                                disabled={!canAfford}
                                                className="text-xs px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            >
                                                {cost.toLocaleString()} oz
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
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 active:scale-[0.99] transition-all cursor-pointer shadow-sm"
            >
                <span className="text-2xl">⛰️</span>
                <div className="flex-1">
                    <p className="font-semibold text-amber-900 text-sm">Mine Site</p>
                    <p className="text-xs text-amber-600">Head back to work</p>
                </div>
                <span className="text-amber-400 font-bold">›</span>
            </div>

            {/* Trail + Camp */}
            <div className="flex flex-col items-center gap-0 py-1">
                <div className="w-0.5 h-4 bg-amber-200" />
                <div className="px-4 py-2 rounded-xl border border-amber-200 bg-amber-50/60 text-sm text-amber-700 font-semibold">
                    {settlement.emoji} Your {settlement.name}
                </div>
                <div className="w-0.5 h-4 bg-amber-200" />
                <div className="w-full h-px bg-amber-300" />
            </div>

            {/* Town buildings */}
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">Town</p>
                <div className="flex flex-wrap justify-center gap-4">
                    <Building
                        emoji="🏪"
                        name="Trading Post"
                        locked={!traderArrived}
                        lockHint="Sell gold to attract a trader"
                        onClick={() => onOpenPanel('shop')}
                    >
                        {gold > 0 ? null : undefined}
                    </Building>

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
            </div>
        </div>
    );
}
