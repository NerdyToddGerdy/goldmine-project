import { gameStore, getUpgradeCost, UPGRADES, EQUIPMENT, useGameStore, getTotalWageForType, getWorkerWage, SHOVEL_TIER_COSTS, PAN_TIER_COSTS, MAX_TOOL_TIER, VEHICLE_TIERS, DRIVER_COST, BUCKET_UPGRADE_COSTS, PAN_CAP_UPGRADE_COSTS, PAN_SPEED_UPGRADE_COSTS, MAX_GEAR_UPGRADE_LEVEL, BUCKET_CAPACITY, PAN_CAPACITY, SMELTING_FEE_PERCENT, getTravelDurationTicks, DETECTOR_SPOTS_PER_SEC } from "../store/gameStore";
import { formatNumber } from "../utils/format";
import { useState } from "react";
import { Banking } from "./Banking";
import { UpgradeButton, WorkerRow } from "./ui";

type TownTab = 'banking' | 'shop' | 'laborOffice';
type ShopTab = 'gear' | 'equipment' | 'transport';

export function Town() {
    const [activeTab, setActiveTab] = useState<TownTab>('shop');
    const [shopTab, setShopTab] = useState<ShopTab>('gear');

    const money = useGameStore((s) => s.money);
    const shovels = useGameStore((s) => s.shovels);
    const pans = useGameStore((s) => s.pans);
    const scoopPower = useGameStore((s) => s.scoopPower);
    const panPower = useGameStore((s) => s.panPower);
    const hasSluiceBox = useGameStore((s) => s.hasSluiceBox);
    const hasOven = useGameStore((s) => s.hasOven);
    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const sluiceWorkers = useGameStore((s) => s.sluiceWorkers);
    const ovenWorkers = useGameStore((s) => s.ovenWorkers);
    const furnaceWorkers = useGameStore((s) => s.furnaceWorkers);
    const bankerWorkers = useGameStore((s) => s.bankerWorkers);
    const vehicleTier = useGameStore((s) => s.vehicleTier);
    const hasDriver = useGameStore((s) => s.hasDriver);
    const isTraveling = useGameStore((s) => s.isTraveling);
    const travelProgress = useGameStore((s) => s.travelProgress);
    const travelDestination = useGameStore((s) => s.travelDestination);
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const ovenGear = useGameStore((s) => s.ovenGear);
    const furnaceGear = useGameStore((s) => s.furnaceGear);
    const bucketUpgrades = useGameStore((s) => s.bucketUpgrades);
    const panCapUpgrades = useGameStore((s) => s.panCapUpgrades);
    const panSpeedUpgrades = useGameStore((s) => s.panSpeedUpgrades);
    const hasAutoEmpty = useGameStore((s) => s.hasAutoEmpty);
    const unlockedPanning = useGameStore((s) => s.unlockedPanning);
    const hasMetalDetector = useGameStore((s) => s.hasMetalDetector);
    const hasMotherlode = useGameStore((s) => s.hasMotherlode);
    const detectorWorkers = useGameStore((s) => s.detectorWorkers);
    const goldPrice = useGameStore((s) => s.goldPrice);
    const buyUpgrade = (upgrade: string) => gameStore.getState().buyUpgrade(upgrade);
    const fireWorker = (workerType: string) => gameStore.getState().fireWorker(workerType);

    const shovelCost = getUpgradeCost('shovel', shovels);
    const panCost = getUpgradeCost('pan', pans);
    const shovelTier = scoopPower - 1; // 0 = base, 5 = max
    const panTier = panPower - 1;
    const betterShovelCost = shovelTier < MAX_TOOL_TIER ? SHOVEL_TIER_COSTS[shovelTier] : 0;
    const betterPanCost = panTier < MAX_TOOL_TIER ? PAN_TIER_COSTS[panTier] : 0;
    const bucketUpgradeCost = bucketUpgrades < MAX_GEAR_UPGRADE_LEVEL ? BUCKET_UPGRADE_COSTS[bucketUpgrades] : 0;
    const panCapUpgradeCost = panCapUpgrades < MAX_GEAR_UPGRADE_LEVEL ? PAN_CAP_UPGRADE_COSTS[panCapUpgrades] : 0;
    const panSpeedUpgradeCost = panSpeedUpgrades < MAX_GEAR_UPGRADE_LEVEL ? PAN_SPEED_UPGRADE_COSTS[panSpeedUpgrades] : 0;
    const betterSluiceCost = getUpgradeCost('betterSluice', sluiceGear - 1);
    const betterOvenCost = getUpgradeCost('betterOven', ovenGear - 1);
    const betterFurnaceCost = getUpgradeCost('betterFurnace', furnaceGear - 1);
    const sluiceWorkerCost = getUpgradeCost('sluiceWorker', sluiceWorkers);
    const ovenWorkerCost = getUpgradeCost('ovenWorker', ovenWorkers);
    const furnaceWorkerCost = getUpgradeCost('furnaceWorker', furnaceWorkers);
    const bankerWorkerCost = getUpgradeCost('bankerWorker', bankerWorkers);
    const detectorWorkerCost = getUpgradeCost('detectorWorker', detectorWorkers);

    // Calculate wages for each worker type
    const shovelTotalWage = getTotalWageForType('shovel', shovels);
    const panTotalWage = getTotalWageForType('pan', pans);
    const sluiceWorkerTotalWage = getTotalWageForType('sluiceWorker', sluiceWorkers);
    const ovenWorkerTotalWage = getTotalWageForType('ovenWorker', ovenWorkers);
    const furnaceWorkerTotalWage = getTotalWageForType('furnaceWorker', furnaceWorkers);
    const bankerWorkerTotalWage = getTotalWageForType('bankerWorker', bankerWorkers);
    const detectorWorkerTotalWage = getTotalWageForType('detectorWorker', detectorWorkers);

    const tierData = VEHICLE_TIERS[vehicleTier as 0|1|2|3];

    // Travel progress bar calculations
    const TRAVEL_EMOJIS = { 0: '🚶', 1: '🐴', 2: '🚂', 3: '🚛' } as const;
    const totalTravelTicks = getTravelDurationTicks(vehicleTier);
    const travelPct = totalTravelTicks > 0 ? Math.min(100, (travelProgress / totalTravelTicks) * 100) : 0;
    const secsRemaining = Math.ceil((totalTravelTicks - travelProgress) / 60);
    const vehicleEmoji = TRAVEL_EMOJIS[vehicleTier as 0|1|2|3];

    // Next-hire wage cost per worker type
    const shovelNextWage = getWorkerWage('shovel', shovels + 1);
    const panNextWage = getWorkerWage('pan', pans + 1);
    const sluiceWorkerNextWage = getWorkerWage('sluiceWorker', sluiceWorkers + 1);
    const ovenWorkerNextWage = getWorkerWage('ovenWorker', ovenWorkers + 1);
    const furnaceWorkerNextWage = getWorkerWage('furnaceWorker', furnaceWorkers + 1);
    const bankerWorkerNextWage = getWorkerWage('bankerWorker', bankerWorkers + 1);
    const detectorWorkerNextWage = getWorkerWage('detectorWorker', detectorWorkers + 1);

    // Estimate current auto-sell income to detect payroll overruns
    const totalPayroll = shovelTotalWage + panTotalWage + sluiceWorkerTotalWage + ovenWorkerTotalWage + furnaceWorkerTotalWage + bankerWorkerTotalWage + detectorWorkerTotalWage;
    const autoSellValueMult = 1.0 + ovenWorkers * UPGRADES.ovenWorker.valueBonus * ovenGear;
    const autoSellFee = !hasFurnace ? SMELTING_FEE_PERCENT : 0;
    const autoSellIncome = bankerWorkers * UPGRADES.bankerWorker.goldPerSec * goldPrice * autoSellValueMult * (1 - autoSellFee);

    return (
        <div className="space-y-6">
            <h2 className="font-arcade text-sm text-green-900">🏘️ Town</h2>

            {/* Travel back to Mine — transforms into progress bar while traveling */}
            <div className="p-3 bg-white border border-amber-200 rounded-xl">
                {isTraveling && travelDestination === 'mine' ? (
                    <div className="space-y-2">
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
                ) : (
                    <button
                        onClick={() => gameStore.getState().startTravel('mine')}
                        disabled={isTraveling}
                        className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ⛏️ Travel to Mine ({tierData.travelSecs}s)
                    </button>
                )}
            </div>

            {/* Main Tabs */}
            <div className="flex gap-2 border-b-2 border-green-200">
                <button
                    onClick={() => setActiveTab('banking')}
                    className={`flex-1 px-4 py-2 font-semibold rounded-t-lg transition-all border-2 ${
                        activeTab === 'banking'
                            ? 'bg-green-100 text-green-900 border-green-200 border-b-0'
                            : 'bg-white/50 text-green-700 hover:bg-white/80 border-transparent'
                    }`}
                >
                    🏦 Banking
                </button>
                <button
                    onClick={() => setActiveTab('shop')}
                    className={`flex-1 px-4 py-2 font-semibold rounded-t-lg transition-all border-2 ${
                        activeTab === 'shop'
                            ? 'bg-green-100 text-green-900 border-green-200 border-b-0'
                            : 'bg-white/50 text-green-700 hover:bg-white/80 border-transparent'
                    }`}
                >
                    🛒 Shop
                </button>
                <button
                    onClick={() => setActiveTab('laborOffice')}
                    className={`flex-1 px-4 py-2 font-semibold rounded-t-lg transition-all border-2 ${
                        activeTab === 'laborOffice'
                            ? 'bg-green-100 text-green-900 border-green-200 border-b-0'
                            : 'bg-white/50 text-green-700 hover:bg-white/80 border-transparent'
                    }`}
                >
                    👷 Labor Office
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'banking' && <Banking />}

                {activeTab === 'shop' && (
                    <div className={`space-y-4${isTraveling ? ' pointer-events-none opacity-50' : ''}`}>
                        {/* Shop Sub-tabs */}
                        <div className="flex gap-2 border-b-2 border-gray-200">
                            <button
                                onClick={() => setShopTab('gear')}
                                className={`flex-1 px-4 py-2 font-semibold rounded-t-lg transition-all text-sm border-2 ${
                                    shopTab === 'gear'
                                        ? 'bg-gray-100 text-gray-900 border-gray-200 border-b-0'
                                        : 'bg-white/50 text-gray-700 hover:bg-white/80 border-transparent'
                                }`}
                            >
                                ⛏️ Gear
                            </button>
                            <button
                                onClick={() => setShopTab('equipment')}
                                className={`flex-1 px-4 py-2 font-semibold rounded-t-lg transition-all text-sm border-2 ${
                                    shopTab === 'equipment'
                                        ? 'bg-gray-100 text-gray-900 border-gray-200 border-b-0'
                                        : 'bg-white/50 text-gray-700 hover:bg-white/80 border-transparent'
                                }`}
                            >
                                🔧 Equipment
                            </button>
                            <button
                                onClick={() => setShopTab('transport')}
                                className={`flex-1 px-4 py-2 font-semibold rounded-t-lg transition-all text-sm border-2 ${
                                    shopTab === 'transport'
                                        ? 'bg-gray-100 text-gray-900 border-gray-200 border-b-0'
                                        : 'bg-white/50 text-gray-700 hover:bg-white/80 border-transparent'
                                }`}
                            >
                                🚗 Transport
                            </button>
                        </div>

                        {/* Shop Tab Content */}
                        <div className="space-y-2">
                            {shopTab === 'gear' && (
                            <div className="space-y-4">
                                {/* Tools */}
                                <div className="pt-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">⛏️ Tools</h4>
                                    <div className="space-y-2">
                                        <UpgradeButton
                                            name="Shovel Upgrade"
                                            description={shovelTier < MAX_TOOL_TIER
                                                ? `Scoop power: ${scoopPower} → ${scoopPower + 1} dirt/click`
                                                : 'Maximum shovel tier reached'}
                                            cost={betterShovelCost}
                                            currentLevel={shovelTier}
                                            maxLevel={MAX_TOOL_TIER}
                                            canAfford={money >= betterShovelCost && shovelTier < MAX_TOOL_TIER}
                                            playerMoney={money}
                                            onBuy={() => buyUpgrade('betterShovel')}
                                            icon="⛏️"
                                        />
                                        <UpgradeButton
                                            name="Pan Upgrade"
                                            description={panTier < MAX_TOOL_TIER
                                                ? `Pan power: ${panPower} → ${panPower + 1} gold/pan`
                                                : 'Maximum pan tier reached'}
                                            cost={betterPanCost}
                                            currentLevel={panTier}
                                            maxLevel={MAX_TOOL_TIER}
                                            canAfford={money >= betterPanCost && panTier < MAX_TOOL_TIER}
                                            playerMoney={money}
                                            onBuy={() => buyUpgrade('betterPan')}
                                            icon="🥘"
                                        />
                                    </div>
                                </div>

                                {/* Capacity & Speed */}
                                <div className="pt-2">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">📦 Capacity & Speed</h4>
                                    <div className="space-y-2">
                                        <UpgradeButton
                                            name="Larger Bucket"
                                            description={bucketUpgrades < MAX_GEAR_UPGRADE_LEVEL
                                                ? `Bucket capacity: ${BUCKET_CAPACITY + 5 * bucketUpgrades} → ${BUCKET_CAPACITY + 5 * (bucketUpgrades + 1)}`
                                                : `Bucket capacity: ${BUCKET_CAPACITY + 5 * bucketUpgrades} (maxed)`}
                                            cost={bucketUpgradeCost}
                                            currentLevel={bucketUpgrades}
                                            maxLevel={MAX_GEAR_UPGRADE_LEVEL}
                                            canAfford={bucketUpgrades < MAX_GEAR_UPGRADE_LEVEL && money >= bucketUpgradeCost}
                                            playerMoney={money}
                                            onBuy={() => buyUpgrade('bucketUpgrade')}
                                            icon="🪣"
                                        />
                                        <UpgradeButton
                                            name="Larger Pan"
                                            description={panCapUpgrades < MAX_GEAR_UPGRADE_LEVEL
                                                ? `Pan capacity: ${PAN_CAPACITY + 10 * panCapUpgrades} → ${PAN_CAPACITY + 10 * (panCapUpgrades + 1)}`
                                                : `Pan capacity: ${PAN_CAPACITY + 10 * panCapUpgrades} (maxed)`}
                                            cost={panCapUpgradeCost}
                                            currentLevel={panCapUpgrades}
                                            maxLevel={MAX_GEAR_UPGRADE_LEVEL}
                                            canAfford={panCapUpgrades < MAX_GEAR_UPGRADE_LEVEL && money >= panCapUpgradeCost}
                                            playerMoney={money}
                                            onBuy={() => buyUpgrade('panCapUpgrade')}
                                            icon="🍳"
                                        />
                                        <UpgradeButton
                                            name="Faster Panning"
                                            description={panSpeedUpgrades < MAX_GEAR_UPGRADE_LEVEL
                                                ? `Pan consumes: ${1 + 0.5 * panSpeedUpgrades}/click → ${1 + 0.5 * (panSpeedUpgrades + 1)}/click`
                                                : `Pan consumes: ${1 + 0.5 * panSpeedUpgrades}/click (maxed)`}
                                            cost={panSpeedUpgradeCost}
                                            currentLevel={panSpeedUpgrades}
                                            maxLevel={MAX_GEAR_UPGRADE_LEVEL}
                                            canAfford={panSpeedUpgrades < MAX_GEAR_UPGRADE_LEVEL && money >= panSpeedUpgradeCost}
                                            playerMoney={money}
                                            onBuy={() => buyUpgrade('panSpeedUpgrade')}
                                            icon="⚡"
                                        />
                                        {unlockedPanning && (
                                            <UpgradeButton
                                                name="Auto-Empty Bucket"
                                                description={hasAutoEmpty
                                                    ? 'Bucket empties to pan automatically when full'
                                                    : 'Automatically empties bucket to pan when full — no more clicking!'}
                                                cost={EQUIPMENT.autoEmpty.cost}
                                                locked={hasAutoEmpty}
                                                canAfford={!hasAutoEmpty && money >= EQUIPMENT.autoEmpty.cost}
                                                playerMoney={money}
                                                onBuy={() => buyUpgrade('autoEmpty')}
                                                icon={hasAutoEmpty ? '✅' : '🪣'}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Machinery Upgrades — only shown when player owns at least one piece of equipment */}
                                {(hasSluiceBox || hasOven || hasFurnace) && (
                                    <div className="pt-2">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">⚙️ Machinery Upgrades</h4>
                                        <div className="space-y-2">
                                            {hasSluiceBox && (
                                                <UpgradeButton
                                                    name="Better Sluice Box"
                                                    description={`Sluice extraction: ${(UPGRADES.sluiceWorker.extractionBonus * sluiceGear * 100).toFixed(0)}% → ${(UPGRADES.sluiceWorker.extractionBonus * (sluiceGear + 1) * 100).toFixed(0)}% per worker`}
                                                    cost={betterSluiceCost}
                                                    currentLevel={sluiceGear - 1}
                                                    canAfford={money >= betterSluiceCost}
                                                    playerMoney={money}
                                                    onBuy={() => buyUpgrade('betterSluice')}
                                                    icon="🚿"
                                                />
                                            )}
                                            {hasOven && (
                                                <UpgradeButton
                                                    name="Better Oven"
                                                    description={`Oven value bonus: ${(UPGRADES.ovenWorker.valueBonus * ovenGear * 100).toFixed(0)}% → ${(UPGRADES.ovenWorker.valueBonus * (ovenGear + 1) * 100).toFixed(0)}% per worker`}
                                                    cost={betterOvenCost}
                                                    currentLevel={ovenGear - 1}
                                                    canAfford={money >= betterOvenCost}
                                                    playerMoney={money}
                                                    onBuy={() => buyUpgrade('betterOven')}
                                                    icon="🔥"
                                                />
                                            )}
                                            {hasFurnace && (
                                                <UpgradeButton
                                                    name="Better Furnace"
                                                    description={`Smelt rate: ${furnaceGear}× oz/sec → ${furnaceGear + 1}× oz/sec`}
                                                    cost={betterFurnaceCost}
                                                    currentLevel={furnaceGear - 1}
                                                    canAfford={money >= betterFurnaceCost}
                                                    playerMoney={money}
                                                    onBuy={() => buyUpgrade('betterFurnace')}
                                                    icon="⚗️"
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            )}

                            {shopTab === 'equipment' && (
                            <>
                                <UpgradeButton
                                    name="Sluice Box"
                                    description="Converts bucket dirt into paydirt for better yields. 🔗 Unlocks Sluice Operators in Labor Office."
                                    cost={EQUIPMENT.sluiceBox.cost}
                                    locked={hasSluiceBox}
                                    canAfford={money >= EQUIPMENT.sluiceBox.cost && !hasSluiceBox}
                                    playerMoney={money}
                                    onBuy={() => buyUpgrade('sluiceBox')}
                                    icon={hasSluiceBox ? '✅' : '🚿'}
                                />

                                <UpgradeButton
                                    name="Oven"
                                    description="Increases gold sell value. 🔗 Unlocks Oven Operators in Labor Office."
                                    cost={EQUIPMENT.oven.cost}
                                    locked={hasOven}
                                    canAfford={money >= EQUIPMENT.oven.cost && !hasOven}
                                    playerMoney={money}
                                    onBuy={() => buyUpgrade('oven')}
                                    icon={hasOven ? '✅' : '🔥'}
                                />

                                <UpgradeButton
                                    name="Furnace"
                                    description="Removes smelting fee entirely. 🔗 Unlocks Furnace Operators in Labor Office."
                                    cost={EQUIPMENT.furnace.cost}
                                    locked={hasFurnace}
                                    canAfford={money >= EQUIPMENT.furnace.cost && !hasFurnace}
                                    playerMoney={money}
                                    onBuy={() => buyUpgrade('furnace')}
                                    icon={hasFurnace ? '✅' : '⚗️'}
                                />

                                <UpgradeButton
                                    name="Metal Detector"
                                    description={`Unlocks 🔍 Detect action in the Mine — high-gold patches make next scoop produce rich dirt (85% vs 65% conversion). 🔗 Unlocks Detector Operators.`}
                                    cost={EQUIPMENT.metalDetector.cost}
                                    locked={hasMetalDetector}
                                    canAfford={money >= EQUIPMENT.metalDetector.cost && !hasMetalDetector}
                                    playerMoney={money}
                                    onBuy={() => buyUpgrade('metalDetector')}
                                    icon={hasMetalDetector ? '✅' : '🔍'}
                                />

                                {hasMetalDetector && (
                                    <UpgradeButton
                                        name="Motherlode Sensor"
                                        description="20% chance each detected patch has 3× rich dirt capacity (motherlode!)"
                                        cost={EQUIPMENT.motherlode.cost}
                                        locked={hasMotherlode}
                                        canAfford={money >= EQUIPMENT.motherlode.cost && !hasMotherlode}
                                        playerMoney={money}
                                        onBuy={() => buyUpgrade('motherlode')}
                                        icon={hasMotherlode ? '✅' : '🌋'}
                                    />
                                )}
                            </>
                            )}

                            {shopTab === 'transport' && (
                            <div className="space-y-3">
                                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-800">
                                    Current: <span className="font-semibold">{tierData.name}</span> — {tierData.travelSecs}s travel time
                                </div>
                                {(VEHICLE_TIERS.slice(1) as readonly {name: string; travelSecs: number; cost: number}[]).map((tier, i) => {
                                    const tierIndex = i + 1;
                                    const owned = vehicleTier >= tierIndex;
                                    const isNext = tierIndex === vehicleTier + 1;
                                    return (
                                        <UpgradeButton
                                            key={tierIndex}
                                            name={tier.name}
                                            description={`Reduces travel time to ${tier.travelSecs}s`}
                                            cost={tier.cost}
                                            locked={owned}
                                            canAfford={isNext && money >= tier.cost}
                                            playerMoney={money}
                                            onBuy={() => gameStore.getState().buyVehicle(tierIndex)}
                                            icon={owned ? '✅' : tierIndex === 1 ? '🐴' : tierIndex === 2 ? '🚂' : '🚛'}
                                        />
                                    );
                                })}
                            </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'laborOffice' && (
                    <div className={`space-y-3${isTraveling ? ' pointer-events-none opacity-50' : ''}`}>
                        <h3 className="text-lg font-semibold text-green-800">👷 Hire Workers</h3>

                        <WorkerRow
                            name="Miner"
                            description={`Digs ${UPGRADES.shovel.dirtPerSec} dirt/sec automatically`}
                            count={shovels}
                            hireCost={shovelCost}
                            wage={shovelTotalWage}
                            canHire={money >= shovelCost}
                            canFire={shovels > 0}
                            onHire={() => buyUpgrade('shovel')}
                            onFire={() => fireWorker('shovel')}
                            icon="👷"
                            playerMoney={money}
                            nextHireWage={shovelNextWage}
                            nextHireWouldExceedIncome={(totalPayroll + shovelNextWage) > autoSellIncome}
                        />

                        <WorkerRow
                            name="Prospector"
                            description={`Pans ${UPGRADES.pan.goldPerSec} gold/sec automatically`}
                            count={pans}
                            hireCost={panCost}
                            wage={panTotalWage}
                            canHire={money >= panCost}
                            canFire={pans > 0}
                            onHire={() => buyUpgrade('pan')}
                            onFire={() => fireWorker('pan')}
                            icon="🧑‍🔬"
                            playerMoney={money}
                            nextHireWage={panNextWage}
                            nextHireWouldExceedIncome={(totalPayroll + panNextWage) > autoSellIncome}
                        />

                        {hasSluiceBox ? (
                            <WorkerRow
                                name="Sluice Operator"
                                description={`+${(UPGRADES.sluiceWorker.extractionBonus * 100).toFixed(0)}% gold extraction per worker`}
                                count={sluiceWorkers}
                                hireCost={sluiceWorkerCost}
                                wage={sluiceWorkerTotalWage}
                                canHire={money >= sluiceWorkerCost}
                                canFire={sluiceWorkers > 0}
                                onHire={() => buyUpgrade('sluiceWorker')}
                                onFire={() => fireWorker('sluiceWorker')}
                                icon="🚿"
                                playerMoney={money}
                                nextHireWage={sluiceWorkerNextWage}
                                nextHireWouldExceedIncome={(totalPayroll + sluiceWorkerNextWage) > autoSellIncome}
                            />
                        ) : (
                            <LockedWorkerRow name="Sluice Operator" icon="🚿" requiresName="Sluice Box" requiresCost={EQUIPMENT.sluiceBox.cost} />
                        )}

                        {hasOven ? (
                            <WorkerRow
                                name="Oven Operator"
                                description={`+${(UPGRADES.ovenWorker.valueBonus * 100).toFixed(0)}% gold sell value per worker`}
                                count={ovenWorkers}
                                hireCost={ovenWorkerCost}
                                wage={ovenWorkerTotalWage}
                                canHire={money >= ovenWorkerCost}
                                canFire={ovenWorkers > 0}
                                onHire={() => buyUpgrade('ovenWorker')}
                                onFire={() => fireWorker('ovenWorker')}
                                icon="🔥"
                                playerMoney={money}
                                nextHireWage={ovenWorkerNextWage}
                                nextHireWouldExceedIncome={(totalPayroll + ovenWorkerNextWage) > autoSellIncome}
                            />
                        ) : (
                            <LockedWorkerRow name="Oven Operator" icon="🔥" requiresName="Smelting Oven" requiresCost={EQUIPMENT.oven.cost} />
                        )}

                        {hasFurnace ? (
                            <WorkerRow
                                name="Furnace Operator"
                                description="Auto-loads, smelts, and collects gold bars"
                                count={furnaceWorkers}
                                hireCost={furnaceWorkerCost}
                                wage={furnaceWorkerTotalWage}
                                canHire={money >= furnaceWorkerCost}
                                canFire={furnaceWorkers > 0}
                                onHire={() => buyUpgrade('furnaceWorker')}
                                onFire={() => fireWorker('furnaceWorker')}
                                icon="⚗️"
                                playerMoney={money}
                                nextHireWage={furnaceWorkerNextWage}
                                nextHireWouldExceedIncome={(totalPayroll + furnaceWorkerNextWage) > autoSellIncome}
                            />
                        ) : (
                            <LockedWorkerRow name="Furnace Operator" icon="⚗️" requiresName="Furnace" requiresCost={EQUIPMENT.furnace.cost} />
                        )}

                        {hasMetalDetector ? (
                            <WorkerRow
                                name="Detector Operator"
                                description={`Auto-detects ${DETECTOR_SPOTS_PER_SEC} high-gold spot/sec per worker`}
                                count={detectorWorkers}
                                hireCost={detectorWorkerCost}
                                wage={detectorWorkerTotalWage}
                                canHire={money >= detectorWorkerCost}
                                canFire={detectorWorkers > 0}
                                onHire={() => buyUpgrade('detectorWorker')}
                                onFire={() => fireWorker('detectorWorker')}
                                icon="🔍"
                                playerMoney={money}
                                nextHireWage={detectorWorkerNextWage}
                                nextHireWouldExceedIncome={(totalPayroll + detectorWorkerNextWage) > autoSellIncome}
                            />
                        ) : (
                            <LockedWorkerRow name="Detector Operator" icon="🔍" requiresName="Metal Detector" requiresCost={EQUIPMENT.metalDetector.cost} />
                        )}

                        <WorkerRow
                            name="Banker"
                            description={`Auto-sells ${UPGRADES.bankerWorker.goldPerSec} gold/sec (applies value bonuses)`}
                            count={bankerWorkers}
                            hireCost={bankerWorkerCost}
                            wage={bankerWorkerTotalWage}
                            canHire={money >= bankerWorkerCost}
                            canFire={bankerWorkers > 0}
                            onHire={() => buyUpgrade('bankerWorker')}
                            onFire={() => fireWorker('bankerWorker')}
                            icon="🏦"
                            playerMoney={money}
                            nextHireWage={bankerWorkerNextWage}
                            nextHireWouldExceedIncome={(totalPayroll + bankerWorkerNextWage) > autoSellIncome}
                        />

                        <UpgradeButton
                            name="Hire Driver"
                            description={hasDriver
                                ? 'Driver is working — auto-sells gold on round trips'
                                : vehicleTier < 2
                                    ? 'Requires Steam Wagon first'
                                    : 'Auto-sells your gold at Town without you traveling'}
                            cost={DRIVER_COST}
                            locked={hasDriver}
                            canAfford={!hasDriver && vehicleTier >= 2 && money >= DRIVER_COST}
                            playerMoney={money}
                            onBuy={() => gameStore.getState().buyDriver()}
                            icon={hasDriver ? '✅' : '🤠'}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function LockedWorkerRow({ name, icon, requiresName, requiresCost }: {
    name: string;
    icon: string;
    requiresName: string;
    requiresCost: number;
}) {
    return (
        <div className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl opacity-50">
            <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>{icon}</span>
                <span>{name}</span>
                <span className="text-xs text-gray-400 font-semibold">🔒 LOCKED</span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Requires: {requiresName} (${formatNumber(requiresCost)}) — buy in Shop → Equipment
            </div>
        </div>
    );
}
