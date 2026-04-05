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
            <h2 className="font-arcade text-sm text-green-900">🏘️ Town</h2>

            {/* Travel progress bar — only shown while traveling to mine */}
            {isTraveling && travelDestination === 'mine' && (
                <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-900 text-sm">
                            {vehicleEmoji} To Mine… ({tierData.name})
                        </span>
                        <button
                            onClick={() => gameStore.getState().cancelTravel()}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                    <div className="relative h-7">
                        <div className="absolute inset-0 bg-amber-100 rounded-full border border-amber-300 overflow-hidden flex">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-100 ml-auto"
                                style={{ width: `${travelPct}%` }}
                            />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-amber-900 drop-shadow-sm">{secsRemaining}s</span>
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
                        className="text-xs px-2 py-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 border border-green-300 font-semibold transition-all"
                    >
                        ← Town
                    </button>
                    <span className="font-semibold text-green-800 text-sm">{PANEL_LABELS[openPanel]}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Lv {npcLevels[PANEL_NPC[openPanel]]}</span>
                </div>
            )}

            {/* Main content */}
            <div>
                {/* Town Map — default view */}
                {!openPanel && (
                    <TownMap onOpenPanel={setOpenPanel} />
                )}

                {/* Trading Post panel — Transport only (Gear & Equipment moved to Blacksmith) */}
                {openPanel === 'shop' && (
                    <div className={`space-y-3${isTraveling ? ' pointer-events-none opacity-50' : ''}`}>
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800">
                            Current: <span className="font-semibold">{VEHICLE_TIERS[vehicleTier as 0|1|2|3].name}</span> — {VEHICLE_TIERS[vehicleTier as 0|1|2|3].travelSecs}s travel time
                        </div>
                        {(VEHICLE_TIERS.slice(1) as readonly { name: string; travelSecs: number; cost: number }[]).map((tier, i) => {
                            const tierIndex = i + 1;
                            const owned = vehicleTier >= tierIndex;
                            const isNext = tierIndex === vehicleTier + 1;
                            // Trader level required: tier 1 = lvl 1, tier 2 = lvl 2, tier 3 = lvl 3
                            const requiredTraderLevel = tierIndex as 1 | 2 | 3;
                            const traderUnlocked = traderLevel >= requiredTraderLevel;
                            if (!owned && !traderUnlocked) {
                                return (
                                    <div key={tierIndex} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-dashed border-gray-200 opacity-60">
                                        <span className="text-base">🔒</span>
                                        <span className="text-xs text-gray-400">{tier.name} — requires Trader Level {requiredTraderLevel}</span>
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

                {/* Tavern panel — Hiring Hall + Driver */}
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
