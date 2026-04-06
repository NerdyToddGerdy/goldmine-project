import { gameStore, useGameStore, EQUIPMENT, UPGRADES, getUpgradeCost, SHOVEL_TIER_COSTS, PAN_TIER_COSTS, MAX_TOOL_TIER, BUCKET_UPGRADE_COSTS, PAN_CAP_UPGRADE_COSTS, PAN_SPEED_UPGRADE_COSTS, MAX_GEAR_UPGRADE_LEVEL, BUCKET_CAPACITY, PAN_CAPACITY, DEFAULT_ROLE_SLOTS, ROLE_SLOT_COSTS, getEffectiveMaxToolTier, getEffectiveMaxGearLevel } from '../store/gameStore';
import type { Role } from '../store/schema';
import { UpgradeButton } from './ui';
import { useState } from 'react';

type SmithTab = 'gear' | 'equipment' | 'slots';


const ROLE_LABELS: Partial<Record<Role, string>> = {
    miner: 'Miner',
    prospector: 'Prospector',
    sluiceOperator: 'Sluice Operator',
    furnaceOperator: 'Furnace Operator',
    detectorOperator: 'Detector Operator',
    certifier: 'Certifier',
};

const ROLE_ORDER: Role[] = ['miner', 'prospector', 'sluiceOperator', 'furnaceOperator', 'detectorOperator', 'certifier'];

export function Blacksmith() {
    const [tab, setTab] = useState<SmithTab>('gear');

    const gold = useGameStore(s => s.gold);
    const scoopPower = useGameStore(s => s.scoopPower);
    const panPower = useGameStore(s => s.panPower);
    const hasSluiceBox = useGameStore(s => s.hasSluiceBox);
    const hasFurnace = useGameStore(s => s.hasFurnace);
    const hasMetalDetector = useGameStore(s => s.hasMetalDetector);
    const hasMotherlode = useGameStore(s => s.hasMotherlode);
    const sluiceGear = useGameStore(s => s.sluiceGear);
    const furnaceGear = useGameStore(s => s.furnaceGear);
    const bucketUpgrades = useGameStore(s => s.bucketUpgrades);
    const panCapUpgrades = useGameStore(s => s.panCapUpgrades);
    const panSpeedUpgrades = useGameStore(s => s.panSpeedUpgrades);
    const roleSlots = useGameStore(s => s.roleSlots);
    const blacksmithLevel = useGameStore(s => s.npcLevels.blacksmith);

    const smithLvl = blacksmithLevel ?? 0;
    const effectiveMaxToolTier = getEffectiveMaxToolTier(smithLvl);
    const effectiveMaxGearLevel = getEffectiveMaxGearLevel(smithLvl);

    const buyUpgrade = (u: string) => gameStore.getState().buyUpgrade(u);
    const buyRoleSlot = (role: Role) => gameStore.getState().buyRoleSlot(role);

    const shovelTier = scoopPower - 1;
    const panTier = panPower - 1;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">🔨 Blacksmith</h3>

            <div className="flex gap-1 border-b-2 border-gray-200">
                {([['gear', '⛏️ Gear'], ['equipment', '🔧 Equipment'], ['slots', '👥 Slots']] as [SmithTab, string][]).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex-1 px-2 py-2 text-xs font-semibold rounded-t-lg transition-all border-2 ${
                            tab === id
                                ? 'bg-gray-100 text-gray-900 border-gray-200 border-b-0'
                                : 'bg-white/50 text-gray-600 hover:bg-white/80 border-transparent'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Gear tab */}
            {tab === 'gear' && (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">⛏️ Tools</h4>
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
                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">📦 Capacity & Speed</h4>
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
                            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">⚙️ Machinery Upgrades</h4>
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
                </div>
            )}

            {/* Role slots tab */}
            {tab === 'slots' && (
                <div className="space-y-2">
                    {blacksmithLevel < 4 && (
                        <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
                            <p className="text-xs text-gray-400">🔒 Role slot upgrades unlock at Blacksmith Level 4</p>
                        </div>
                    )}
                    <p className="text-xs text-gray-500 pb-1">Purchase additional assignment slots per role.</p>
                    {ROLE_ORDER.map(role => {
                        const current = roleSlots[role];
                        const base = DEFAULT_ROLE_SLOTS[role];
                        const extra = current - base;
                        const costs = ROLE_SLOT_COSTS[role];
                        const maxed = extra >= costs.length;
                        const cost = maxed ? 0 : costs[extra];
                        return (
                            <UpgradeButton
                                key={role}
                                name={`${ROLE_LABELS[role]} Slots`}
                                description={maxed ? `${current} slots (maxed)` : `${current} → ${current + 1} slots`}
                                cost={cost}
                                currentLevel={extra}
                                maxLevel={costs.length}
                                locked={maxed}
                                canAfford={!maxed && gold >= cost && blacksmithLevel >= 4}
                                playerMoney={gold}
                                onBuy={() => buyRoleSlot(role)}
                                icon="👤"
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
