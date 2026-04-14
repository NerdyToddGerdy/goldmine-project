import { gameStore, useGameStore, EQUIPMENT, UPGRADES, getUpgradeCost, SHOVEL_TIER_COSTS, PAN_TIER_COSTS, MAX_TOOL_TIER, BUCKET_UPGRADE_COSTS, PAN_CAP_UPGRADE_COSTS, PAN_SPEED_UPGRADE_COSTS, MAX_GEAR_UPGRADE_LEVEL, BUCKET_CAPACITY, PAN_CAPACITY, getEffectiveMaxToolTier, getEffectiveMaxGearLevel, EXCAVATOR_COST_BARS, WASHPLANT_COST_BARS, EXCAVATOR_MINE_MULT, WASHPLANT_SLUICE_MULT } from '../store/gameStore';
import { UpgradeButton } from './ui';
import { useState } from 'react';

type SmithTab = 'gear' | 'equipment';

function HeavyEquipButton({ name, icon, description, costBars, goldBars, onBuy }: {
    name: string; icon: string; description: string; costBars: number; goldBars: number; onBuy: () => void;
}) {
    const canAfford = goldBars >= costBars;
    const shortage = canAfford ? 0 : costBars - goldBars;
    return (
        <button
            onClick={onBuy}
            disabled={!canAfford}
            className="w-full p-4 frontier-card border-2 hover:border-frontier-ember dark:hover:border-frontier-ember rounded-sm text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-frontier-coal dark:text-frontier-bone flex items-center gap-2">
                        <span>{icon}</span><span>{name}</span>
                    </div>
                    <div className="text-sm text-frontier-dust mt-0.5">{description}</div>
                    {shortage > 0 && (
                        <div className="text-xs text-frontier-rust dark:text-red-400 mt-1">Need {shortage} bars more</div>
                    )}
                </div>
                <div className={`text-base font-bold flex-shrink-0 ${canAfford ? 'text-frontier-sage' : 'text-frontier-rust'}`}>
                    {costBars} bars
                </div>
            </div>
        </button>
    );
}

export function Blacksmith() {
    const [tab, setTab] = useState<SmithTab>('gear');

    const gold = useGameStore(s => s.gold);
    const scoopPower = useGameStore(s => s.scoopPower);
    const panPower = useGameStore(s => s.panPower);
    const hasSluiceBox = useGameStore(s => s.hasSluiceBox);
    const hasFurnace = useGameStore(s => s.hasFurnace);
    const hasMetalDetector = useGameStore(s => s.hasMetalDetector);
    const hasMotherlode = useGameStore(s => s.hasMotherlode);
    const goldBars = useGameStore(s => s.goldBars);
    const hasExcavator = useGameStore(s => s.hasExcavator);
    const hasWashplant = useGameStore(s => s.hasWashplant);
    const sluiceGear = useGameStore(s => s.sluiceGear);
    const furnaceGear = useGameStore(s => s.furnaceGear);
    const bucketUpgrades = useGameStore(s => s.bucketUpgrades);
    const panCapUpgrades = useGameStore(s => s.panCapUpgrades);
    const panSpeedUpgrades = useGameStore(s => s.panSpeedUpgrades);
    const blacksmithLevel = useGameStore(s => s.npcLevels.blacksmith);

    const smithLvl = blacksmithLevel ?? 0;
    const effectiveMaxToolTier = getEffectiveMaxToolTier(smithLvl);
    const effectiveMaxGearLevel = getEffectiveMaxGearLevel(smithLvl);

    const buyUpgrade = (u: string) => gameStore.getState().buyUpgrade(u);

    const shovelTier = scoopPower - 1;
    const panTier = panPower - 1;

    return (
        <div className="space-y-4">
            <h3 className="font-display text-base text-frontier-bone tracking-wide">🔨 Blacksmith</h3>

            <div className="frontier-tab-bar">
                {([['gear', '⛏️ Gear'], ['equipment', '🔧 Equipment']] as [SmithTab, string][]).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={tab === id ? 'frontier-tab-active' : 'frontier-tab-inactive'}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Gear tab */}
            {tab === 'gear' && (
                <div className="space-y-4">
                    <div>
                        <h4 className="frontier-label mb-2 px-1">⛏️ Tools</h4>
                        <div className="space-y-2">
                            <UpgradeButton
                                name="Shovel Upgrade"
                                description={
                                    shovelTier >= effectiveMaxToolTier && effectiveMaxToolTier < MAX_TOOL_TIER
                                        ? `⬆️ Level up Blacksmith to unlock Tier ${effectiveMaxToolTier + 1}`
                                        : shovelTier < MAX_TOOL_TIER
                                            ? `Scoop power: ${scoopPower} → ${scoopPower + 1} dirt/click`
                                            : 'Maximum shovel tier reached'
                                }
                                cost={shovelTier < effectiveMaxToolTier ? SHOVEL_TIER_COSTS[shovelTier] : 0}
                                currentLevel={shovelTier}
                                maxLevel={effectiveMaxToolTier}
                                canAfford={shovelTier < effectiveMaxToolTier && gold >= SHOVEL_TIER_COSTS[shovelTier]}
                                playerMoney={gold}
                                onBuy={() => buyUpgrade('betterShovel')}
                                icon="⛏️"
                            />
                            <UpgradeButton
                                name="Pan Upgrade"
                                description={
                                    panTier >= effectiveMaxToolTier && effectiveMaxToolTier < MAX_TOOL_TIER
                                        ? `⬆️ Level up Blacksmith to unlock Tier ${effectiveMaxToolTier + 1}`
                                        : panTier < MAX_TOOL_TIER
                                            ? `Pan power: ${panPower} → ${panPower + 1} gold/pan`
                                            : 'Maximum pan tier reached'
                                }
                                cost={panTier < effectiveMaxToolTier ? PAN_TIER_COSTS[panTier] : 0}
                                currentLevel={panTier}
                                maxLevel={effectiveMaxToolTier}
                                canAfford={panTier < effectiveMaxToolTier && gold >= PAN_TIER_COSTS[panTier]}
                                playerMoney={gold}
                                onBuy={() => buyUpgrade('betterPan')}
                                icon="🥘"
                            />
                        </div>
                    </div>

                    <div>
                        <h4 className="frontier-label mb-2 px-1">📦 Capacity & Speed</h4>
                        <div className="space-y-2">
                            <UpgradeButton
                                name="Larger Bucket"
                                description={
                                    bucketUpgrades >= effectiveMaxGearLevel && effectiveMaxGearLevel < MAX_GEAR_UPGRADE_LEVEL
                                        ? `⬆️ Level up Blacksmith to unlock Level ${effectiveMaxGearLevel + 1}`
                                        : bucketUpgrades < MAX_GEAR_UPGRADE_LEVEL
                                            ? `Bucket: ${BUCKET_CAPACITY + 5 * bucketUpgrades} → ${BUCKET_CAPACITY + 5 * (bucketUpgrades + 1)}`
                                            : `Bucket: ${BUCKET_CAPACITY + 5 * bucketUpgrades} (maxed)`
                                }
                                cost={bucketUpgrades < effectiveMaxGearLevel ? BUCKET_UPGRADE_COSTS[bucketUpgrades] : 0}
                                currentLevel={bucketUpgrades}
                                maxLevel={effectiveMaxGearLevel}
                                canAfford={bucketUpgrades < effectiveMaxGearLevel && gold >= BUCKET_UPGRADE_COSTS[bucketUpgrades]}
                                playerMoney={gold}
                                onBuy={() => buyUpgrade('bucketUpgrade')}
                                icon="🪣"
                            />
                            <UpgradeButton
                                name="Larger Pan"
                                description={
                                    panCapUpgrades >= effectiveMaxGearLevel && effectiveMaxGearLevel < MAX_GEAR_UPGRADE_LEVEL
                                        ? `⬆️ Level up Blacksmith to unlock Level ${effectiveMaxGearLevel + 1}`
                                        : panCapUpgrades < MAX_GEAR_UPGRADE_LEVEL
                                            ? `Pan capacity: ${PAN_CAPACITY + 10 * panCapUpgrades} → ${PAN_CAPACITY + 10 * (panCapUpgrades + 1)}`
                                            : `Pan capacity: ${PAN_CAPACITY + 10 * panCapUpgrades} (maxed)`
                                }
                                cost={panCapUpgrades < effectiveMaxGearLevel ? PAN_CAP_UPGRADE_COSTS[panCapUpgrades] : 0}
                                currentLevel={panCapUpgrades}
                                maxLevel={effectiveMaxGearLevel}
                                canAfford={panCapUpgrades < effectiveMaxGearLevel && gold >= PAN_CAP_UPGRADE_COSTS[panCapUpgrades]}
                                playerMoney={gold}
                                onBuy={() => buyUpgrade('panCapUpgrade')}
                                icon="🍳"
                            />
                            <UpgradeButton
                                name="Faster Panning"
                                description={
                                    panSpeedUpgrades >= effectiveMaxGearLevel && effectiveMaxGearLevel < MAX_GEAR_UPGRADE_LEVEL
                                        ? `⬆️ Level up Blacksmith to unlock Level ${effectiveMaxGearLevel + 1}`
                                        : panSpeedUpgrades < MAX_GEAR_UPGRADE_LEVEL
                                            ? `Pan consumes: ${1 + 0.5 * panSpeedUpgrades}/click → ${1 + 0.5 * (panSpeedUpgrades + 1)}/click`
                                            : `Pan consumes: ${1 + 0.5 * panSpeedUpgrades}/click (maxed)`
                                }
                                cost={panSpeedUpgrades < effectiveMaxGearLevel ? PAN_SPEED_UPGRADE_COSTS[panSpeedUpgrades] : 0}
                                currentLevel={panSpeedUpgrades}
                                maxLevel={effectiveMaxGearLevel}
                                canAfford={panSpeedUpgrades < effectiveMaxGearLevel && gold >= PAN_SPEED_UPGRADE_COSTS[panSpeedUpgrades]}
                                playerMoney={gold}
                                onBuy={() => buyUpgrade('panSpeedUpgrade')}
                                icon="⚡"
                            />
                        </div>
                    </div>

                    {(hasSluiceBox || hasFurnace) && (
                        <div>
                            <h4 className="frontier-label mb-2 px-1">⚙️ Machinery Upgrades</h4>
                            <div className="space-y-2">
                                {hasSluiceBox && blacksmithLevel >= 2 && (
                                    <UpgradeButton
                                        name="Better Sluice Box"
                                        description={`Sluice extraction: ${(UPGRADES.sluiceWorker.extractionBonus * sluiceGear * 100).toFixed(0)}% → ${(UPGRADES.sluiceWorker.extractionBonus * (sluiceGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={getUpgradeCost('betterSluice', sluiceGear - 1)}
                                        currentLevel={sluiceGear - 1}
                                        canAfford={gold >= getUpgradeCost('betterSluice', sluiceGear - 1)}
                                        playerMoney={gold}
                                        onBuy={() => buyUpgrade('betterSluice')}
                                        icon="🚿"
                                    />
                                )}
                                {hasFurnace && blacksmithLevel >= 3 && (
                                    <UpgradeButton
                                        name="Better Furnace"
                                        description={`Smelt rate: ${furnaceGear}× oz/sec → ${furnaceGear + 1}× oz/sec`}
                                        cost={getUpgradeCost('betterFurnace', furnaceGear - 1)}
                                        currentLevel={furnaceGear - 1}
                                        canAfford={gold >= getUpgradeCost('betterFurnace', furnaceGear - 1)}
                                        playerMoney={gold}
                                        onBuy={() => buyUpgrade('betterFurnace')}
                                        icon="⚗️"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Equipment tab */}
            {tab === 'equipment' && (
                <div className="space-y-2">
                    {blacksmithLevel >= 2 && !hasSluiceBox && (
                        <UpgradeButton
                            name="Sluice Box"
                            description="Converts bucket dirt into paydirt. Unlocks Sluice Operators."
                            cost={EQUIPMENT.sluiceBox.cost}
                            canAfford={gold >= EQUIPMENT.sluiceBox.cost}
                            playerMoney={gold}
                            onBuy={() => buyUpgrade('sluiceBox')}
                            icon="🚿"
                        />
                    )}
                    {blacksmithLevel >= 3 && !hasFurnace && (
                        <UpgradeButton
                            name="Furnace"
                            description="Removes smelting fee entirely. Unlocks Furnace Operators and gold bar certification."
                            cost={EQUIPMENT.furnace.cost}
                            canAfford={gold >= EQUIPMENT.furnace.cost}
                            playerMoney={gold}
                            onBuy={() => buyUpgrade('furnace')}
                            icon="⚗️"
                        />
                    )}
                    {blacksmithLevel >= 3 && !hasMetalDetector && (
                        <UpgradeButton
                            name="Metal Detector"
                            description="Unlocks 🔍 Detect action — high-gold patches for richer scoops. Unlocks Detector Operators."
                            cost={EQUIPMENT.metalDetector.cost}
                            canAfford={gold >= EQUIPMENT.metalDetector.cost}
                            playerMoney={gold}
                            onBuy={() => buyUpgrade('metalDetector')}
                            icon="🔍"
                        />
                    )}
                    {hasMetalDetector && blacksmithLevel >= 4 && !hasMotherlode && (
                        <UpgradeButton
                            name="Motherlode Sensor"
                            description="20% chance each detected patch is a motherlode (3× capacity)"
                            cost={EQUIPMENT.motherlode.cost}
                            canAfford={gold >= EQUIPMENT.motherlode.cost}
                            playerMoney={gold}
                            onBuy={() => buyUpgrade('motherlode')}
                            icon="🌋"
                        />
                    )}
                    {hasFurnace && !hasExcavator && (
                        <HeavyEquipButton
                            name="Excavator"
                            icon="🚜"
                            description={`Triples dirt rate (×${EXCAVATOR_MINE_MULT}) while fueled. Requires trader fuel runs from town.`}
                            costBars={EXCAVATOR_COST_BARS}
                            goldBars={goldBars}
                            onBuy={() => gameStore.getState().buyHeavyEquipment('excavator')}
                        />
                    )}
                    {hasExcavator && !hasWashplant && (
                        <HeavyEquipButton
                            name="Wash Plant"
                            icon="🏭"
                            description={`Boosts sluice throughput ×${WASHPLANT_SLUICE_MULT} while fueled. Requires excavator.`}
                            costBars={WASHPLANT_COST_BARS}
                            goldBars={goldBars}
                            onBuy={() => gameStore.getState().buyHeavyEquipment('washplant')}
                        />
                    )}
                </div>
            )}

        </div>
    );
}
