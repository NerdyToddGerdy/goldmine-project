import { gameStore, getUpgradeCost, useGameStore, VEHICLE_TIERS, DRIVER_COST, getTravelDurationTicks, getDriverCapacity, MAX_DRIVER_CAP_UPGRADES, DRIVER_BASE_CAPACITY } from "../store/gameStore";
import { useState } from "react";
import { HiringHall } from "./HiringHall";
import { TownMap, type TownPanel } from "./TownMap";
import { Assayer } from "./Assayer";
import { Blacksmith } from "./Blacksmith";
import { UpgradeButton } from "./ui";

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
    const vehicleTier = useGameStore((s) => s.vehicleTier);
    const hasDriver = useGameStore((s) => s.hasDriver);
    const traderLevel = useGameStore((s) => s.npcLevels.trader);
    const npcLevels = useGameStore((s) => s.npcLevels);
    const isTraveling = useGameStore((s) => s.isTraveling);
    const travelProgress = useGameStore((s) => s.travelProgress);
    const travelDestination = useGameStore((s) => s.travelDestination);
    const driverCapUpgrades = useGameStore((s) => s.driverCapUpgrades);

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
                    <div className="relative h-7">
                        <div className="absolute inset-0 frontier-progress-track rounded-sm overflow-hidden flex">
                            <div
                                className="h-full frontier-progress-fill-amber transition-all duration-100 ml-auto"
                                style={{ width: `${travelPct}%` }}
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-frontier-bone drop-shadow-sm">{secsRemaining}s</span>
                        </div>
                        <div
                            className="absolute top-1/2 text-lg leading-none pointer-events-none transition-all duration-100"
                            style={{ left: `${100 - travelPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                        >
                            {vehicleEmoji}
                        </div>
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
                        {hasDriver && (
                            <UpgradeButton
                                name={`Larger Carrier (${driverCapUpgrades}/${MAX_DRIVER_CAP_UPGRADES})`}
                                description={`Driver carries +5 oz per upgrade. Current: ${getDriverCapacity(driverCapUpgrades)} oz (base ${DRIVER_BASE_CAPACITY} oz).`}
                                cost={getUpgradeCost('largerCarrier', driverCapUpgrades)}
                                locked={driverCapUpgrades >= MAX_DRIVER_CAP_UPGRADES}
                                canAfford={driverCapUpgrades < MAX_DRIVER_CAP_UPGRADES && gold >= getUpgradeCost('largerCarrier', driverCapUpgrades)}
                                playerMoney={gold}
                                onBuy={() => gameStore.getState().buyUpgrade('largerCarrier')}
                                icon={driverCapUpgrades >= MAX_DRIVER_CAP_UPGRADES ? '✅' : '📦'}
                            />
                        )}
                    </div>
                )}

                {/* Tavern panel */}
                {openPanel === 'tavern' && (
                    <div className={`space-y-4${isTraveling ? ' pointer-events-none opacity-50' : ''}`}>
                        <HiringHall />
                        <UpgradeButton
                            name="Hire Driver"
                            description={hasDriver
                                ? 'Driver is working — auto-sells gold on round trips'
                                : traderLevel < 4
                                    ? `Requires Trader Level 4 (currently ${traderLevel})`
                                    : 'Auto-sells your gold at Town without you traveling'}
                            cost={DRIVER_COST}
                            locked={hasDriver}
                            canAfford={!hasDriver && gold >= DRIVER_COST && traderLevel >= 4}
                            playerMoney={gold}
                            onBuy={() => gameStore.getState().buyDriver()}
                            icon={hasDriver ? '✅' : '🤠'}
                        />
                    </div>
                )}

                {openPanel === 'assayer' && <Assayer />}
                {openPanel === 'blacksmith' && <Blacksmith />}
            </div>
        </div>
    );
}
