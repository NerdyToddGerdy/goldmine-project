import { gameStore, useGameStore, VEHICLE_TIERS, getTravelDurationTicks, TRADER_FUEL_COST, FUEL_TANK_CAP } from "../store/gameStore";
import { useState } from "react";
import { HiringHall } from "./HiringHall";
import { TownMap, type TownPanel } from "./TownMap";
import { Assayer } from "./Assayer";
import { Blacksmith } from "./Blacksmith";
import { UpgradeButton, SpriteAnimation } from "./ui";
import minerWalkSrc from '../assets/miner-walk.png';

const PANEL_LABELS: Record<TownPanel, string> = {
    shop:        '🏪 Trading Post',
    tavern:      '🍺 Tavern',
    assayer:     '⚖️ Assayer',
    blacksmith:  '🔨 Blacksmith',
};

const PANEL_NPC: Record<TownPanel, 'trader' | 'tavernKeeper' | 'assayer' | 'blacksmith'> = {
    shop:       'trader',
    tavern:     'tavernKeeper',
    assayer:    'assayer',
    blacksmith: 'blacksmith',
};

export function Town() {
    const [openPanel, setOpenPanel] = useState<TownPanel | null>(null);

    const gold = useGameStore((s) => s.gold);
    const goldBars = useGameStore((s) => s.goldBars);
    const vehicleTier = useGameStore((s) => s.vehicleTier);
    const traderLevel = useGameStore((s) => s.npcLevels.trader);
    const npcLevels = useGameStore((s) => s.npcLevels);
    const isTraveling = useGameStore((s) => s.isTraveling);
    const travelProgress = useGameStore((s) => s.travelProgress);
    const travelDestination = useGameStore((s) => s.travelDestination);
    const fuelTank = useGameStore((s) => s.fuelTank);
    const traderFuelTripTicks = useGameStore((s) => s.traderFuelTripTicks);
    const hasExcavator = useGameStore((s) => s.hasExcavator);
    const hasWashplant = useGameStore((s) => s.hasWashplant);

    const tierData = VEHICLE_TIERS[vehicleTier as 0|1|2|3];

    const TRAVEL_EMOJIS = { 0: '🚶', 1: '🐴', 2: '🚂', 3: '🚛' } as const;
    const totalTravelTicks = getTravelDurationTicks(vehicleTier);
    const travelPct = totalTravelTicks > 0 ? Math.min(100, (travelProgress / totalTravelTicks) * 100) : 0;
    const secsRemaining = Math.ceil((totalTravelTicks - travelProgress) / 60);
    const vehicleEmoji = TRAVEL_EMOJIS[vehicleTier as 0|1|2|3];

    return (
        <div className="space-y-6">
            <h2 className="font-display text-base text-frontier-bone">🏘️ Town</h2>

            {/* Travel progress bar — shown while traveling to mine */}
            {isTraveling && travelDestination === 'mine' && (
                <div className="frontier-panel p-3 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-frontier-bone text-sm">
                            {vehicleEmoji} To Mine… ({tierData.name})
                        </span>
                        <button
                            onClick={() => gameStore.getState().cancelTravel()}
                            className="frontier-btn-danger text-xs px-3 py-1"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="relative h-14">
                        <div className="absolute inset-0 frontier-progress-track rounded-sm overflow-hidden flex">
                            <div
                                className="h-full frontier-progress-fill-amber transition-all duration-100 ml-auto"
                                style={{ width: `${travelPct}%` }}
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-frontier-bone drop-shadow-sm">{secsRemaining}s</span>
                        </div>
                        <SpriteAnimation
                            src={minerWalkSrc}
                            frameWidth={352} frameHeight={256}
                            totalWidth={1408} totalHeight={768}
                            frameCount={4}
                            rowIndex={2}
                            fps={8}
                            displayHeight={56}
                            playing={true}
                            className="absolute pointer-events-none transition-all duration-100"
                            style={{ left: `${100 - travelPct}%`, top: '50%', transform: 'translateX(-50%) translateY(-50%)' }}
                        />
                    </div>
                </div>
            )}

            {/* Panel header with back button */}
            {openPanel && (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setOpenPanel(null)}
                        className="frontier-btn-ghost text-xs px-2 py-1"
                    >
                        ← Town
                    </button>
                    <span className="font-semibold text-frontier-bone text-sm">{PANEL_LABELS[openPanel]}</span>
                    <span className="text-xs text-frontier-dust bg-frontier-iron/20 px-2 py-0.5 rounded-sm">Lv {npcLevels[PANEL_NPC[openPanel]]}</span>
                </div>
            )}

            {/* Main content */}
            <div>
                {!openPanel && (
                    <TownMap onOpenPanel={setOpenPanel} />
                )}

                {/* Trading Post panel */}
                {openPanel === 'shop' && (
                    <div className={`space-y-3${isTraveling ? ' pointer-events-none opacity-50' : ''}`}>
                        <div className="p-3 bg-frontier-nugget/10 rounded-sm border border-frontier-nugget/30 text-sm text-frontier-bone">
                            Current: <span className="font-semibold">{VEHICLE_TIERS[vehicleTier as 0|1|2|3].name}</span> — {VEHICLE_TIERS[vehicleTier as 0|1|2|3].travelSecs}s travel time
                        </div>
                        {(VEHICLE_TIERS.slice(1) as readonly { name: string; travelSecs: number; cost: number }[]).map((tier, i) => {
                            const tierIndex = i + 1;
                            const owned = vehicleTier >= tierIndex;
                            const isNext = tierIndex === vehicleTier + 1;
                            const requiredTraderLevel = tierIndex as 1 | 2 | 3;
                            const traderUnlocked = traderLevel >= requiredTraderLevel;
                            if (!owned && !traderUnlocked) {
                                return (
                                    <div key={tierIndex} className="flex items-center gap-2 p-2 rounded-sm bg-frontier-coal/20 border border-dashed border-frontier-iron/40 opacity-60">
                                        <span className="text-base">🔒</span>
                                        <span className="text-xs text-frontier-dust">{tier.name} — requires Trader Level {requiredTraderLevel}</span>
                                    </div>
                                );
                            }
                            return (
                                <UpgradeButton
                                    key={tierIndex}
                                    name={tier.name}
                                    description={`Reduces travel time to ${tier.travelSecs}s`}
                                    cost={tier.cost}
                                    locked={owned}
                                    canAfford={isNext && gold >= tier.cost && traderUnlocked}
                                    playerMoney={gold}
                                    onBuy={() => gameStore.getState().buyVehicle(tierIndex)}
                                    icon={owned ? '✅' : tierIndex === 1 ? '🐴' : tierIndex === 2 ? '🚂' : '🚛'}
                                />
                            );
                        })}
                        {/* Sell Bars — visible when player has bars in town */}
                        {goldBars > 0 && (
                            <div className="p-3 rounded-sm border border-frontier-nugget/40 bg-frontier-nugget/5 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-frontier-bone">🧱 Gold Bars</span>
                                    <span className="text-sm font-bold text-frontier-nugget">{goldBars.toFixed(2)} oz</span>
                                </div>
                                <button
                                    onClick={() => gameStore.getState().sellBars()}
                                    className="w-full frontier-btn-primary text-sm"
                                >
                                    Sell All Bars (+{goldBars.toFixed(2)} oz)
                                </button>
                            </div>
                        )}

                        {/* Trader Fuel Runs — visible once excavator or washplant is owned */}
                        {(hasExcavator || hasWashplant) && (() => {
                            const tripDuration = 2 * getTravelDurationTicks(vehicleTier);
                            const tripPct = traderFuelTripTicks > 0 ? Math.min(100, (traderFuelTripTicks / tripDuration) * 100) : 0;
                            const tankFull = fuelTank >= FUEL_TANK_CAP;
                            const onRun = traderFuelTripTicks > 0;
                            return (
                                <div className="p-3 rounded-sm border border-frontier-hide/40 bg-frontier-parchment/30 dark:bg-frontier-coal/30 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-frontier-bone">⛽ Fuel Supply</span>
                                        <span className="text-xs text-frontier-dust">{fuelTank.toFixed(1)} / {FUEL_TANK_CAP} gal</span>
                                    </div>
                                    <div className="h-2 rounded-sm bg-frontier-iron/30 overflow-hidden">
                                        <div className="h-full rounded-sm bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(100, (fuelTank / FUEL_TANK_CAP) * 100)}%` }} />
                                    </div>
                                    {onRun ? (
                                        <div className="space-y-1">
                                            <p className="text-xs text-frontier-dust">Trader fetching fuel…</p>
                                            <div className="h-1.5 rounded-sm bg-frontier-iron/30 overflow-hidden">
                                                <div className="h-full rounded-sm bg-frontier-nugget transition-all duration-300" style={{ width: `${tripPct}%` }} />
                                            </div>
                                        </div>
                                    ) : tankFull ? (
                                        <p className="text-xs text-frontier-iron text-center">Tank is full</p>
                                    ) : (
                                        <button
                                            onClick={() => gameStore.getState().sendTraderForFuel()}
                                            disabled={gold < TRADER_FUEL_COST}
                                            className="w-full frontier-btn-primary text-xs py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Send Trader for Fuel ({TRADER_FUEL_COST} oz)
                                        </button>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Tavern panel */}
                {openPanel === 'tavern' && (
                    <div className={`space-y-4${isTraveling ? ' pointer-events-none opacity-50' : ''}`}>
                        <HiringHall />
                    </div>
                )}

                {openPanel === 'assayer' && <Assayer />}
                {openPanel === 'blacksmith' && <Blacksmith />}
            </div>
        </div>
    );
}
