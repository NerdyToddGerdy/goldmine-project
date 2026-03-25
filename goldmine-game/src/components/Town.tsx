import { gameStore, getUpgradeCost, UPGRADES, EQUIPMENT, useGameStore, getTotalWageForType, SHOVEL_TIER_COSTS, PAN_TIER_COSTS, MAX_TOOL_TIER, VEHICLE_TIERS, DRIVER_COST, SMELTING_FEE_PERCENT } from "../store/gameStore";
import { useState } from "react";
import { Banking } from "./Banking";
import { PrestigeShop } from "./PrestigeShop";
import { UpgradeButton, WorkerRow } from "./ui";
import { formatNumber } from "../utils/format";

type TownTab = 'banking' | 'shop' | 'laborOffice' | 'legacy';
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
    const hasMagneticSeparator = useGameStore((s) => s.hasMagneticSeparator);
    const hasOven = useGameStore((s) => s.hasOven);
    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const sluiceWorkers = useGameStore((s) => s.sluiceWorkers);
    const separatorWorkers = useGameStore((s) => s.separatorWorkers);
    const ovenWorkers = useGameStore((s) => s.ovenWorkers);
    const furnaceWorkers = useGameStore((s) => s.furnaceWorkers);
    const bankerWorkers = useGameStore((s) => s.bankerWorkers);
    const unlockedBanking = useGameStore((s) => s.unlockedBanking);
    const prestigeCount = useGameStore((s) => s.prestigeCount);
    const gold = useGameStore((s) => s.gold);
    const vehicleTier = useGameStore((s) => s.vehicleTier);
    const hasDriver = useGameStore((s) => s.hasDriver);
    const isTraveling = useGameStore((s) => s.isTraveling);
    const travelDestination = useGameStore((s) => s.travelDestination);
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const separatorGear = useGameStore((s) => s.separatorGear);
    const ovenGear = useGameStore((s) => s.ovenGear);
    const furnaceGear = useGameStore((s) => s.furnaceGear);

    const buyUpgrade = (upgrade: string) => gameStore.getState().buyUpgrade(upgrade);
    const fireWorker = (workerType: string) => gameStore.getState().fireWorker(workerType);

    const shovelCost = getUpgradeCost('shovel', shovels);
    const panCost = getUpgradeCost('pan', pans);
    const shovelTier = scoopPower - 1; // 0 = base, 5 = max
    const panTier = panPower - 1;
    const betterShovelCost = shovelTier < MAX_TOOL_TIER ? SHOVEL_TIER_COSTS[shovelTier] : 0;
    const betterPanCost = panTier < MAX_TOOL_TIER ? PAN_TIER_COSTS[panTier] : 0;
    const betterSluiceCost = getUpgradeCost('betterSluice', sluiceGear - 1);
    const betterSeparatorCost = getUpgradeCost('betterSeparator', separatorGear - 1);
    const betterOvenCost = getUpgradeCost('betterOven', ovenGear - 1);
    const betterFurnaceCost = getUpgradeCost('betterFurnace', furnaceGear - 1);
    const sluiceWorkerCost = getUpgradeCost('sluiceWorker', sluiceWorkers);
    const separatorWorkerCost = getUpgradeCost('separatorWorker', separatorWorkers);
    const ovenWorkerCost = getUpgradeCost('ovenWorker', ovenWorkers);
    const furnaceWorkerCost = getUpgradeCost('furnaceWorker', furnaceWorkers);
    const bankerWorkerCost = getUpgradeCost('bankerWorker', bankerWorkers);

    // Calculate wages for each worker type
    const shovelTotalWage = getTotalWageForType('shovel', shovels);
    const panTotalWage = getTotalWageForType('pan', pans);
    const sluiceWorkerTotalWage = getTotalWageForType('sluiceWorker', sluiceWorkers);
    const separatorWorkerTotalWage = getTotalWageForType('separatorWorker', separatorWorkers);
    const ovenWorkerTotalWage = getTotalWageForType('ovenWorker', ovenWorkers);
    const furnaceWorkerTotalWage = getTotalWageForType('furnaceWorker', furnaceWorkers);
    const bankerWorkerTotalWage = getTotalWageForType('bankerWorker', bankerWorkers);

    const tierData = VEHICLE_TIERS[vehicleTier as 0|1|2|3];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-900">🏘️ Town</h2>

            {/* Gold Exchange */}
            {gold > 0 && (
                <div className="p-4 bg-white border-2 border-green-300 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-900">💰 Gold Exchange</span>
                        <span className="text-sm font-semibold text-green-700">{formatNumber(gold)} oz</span>
                    </div>
                    <button
                        onClick={() => gameStore.getState().sellGold()}
                        className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold"
                    >
                        {hasFurnace
                            ? `💵 Sell Gold (${((1 - SMELTING_FEE_PERCENT) * 100).toFixed(0)}% after fee)`
                            : '💵 Sell Gold (no fee)'}
                    </button>
                </div>
            )}

            {/* Travel back to Mine */}
            <div className="p-3 bg-white border border-amber-200 rounded-xl">
                <button
                    onClick={() => gameStore.getState().startTravel('mine')}
                    disabled={isTraveling}
                    className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isTraveling && travelDestination === 'mine'
                        ? '🚗 Traveling to Mine...'
                        : `⛏️ Travel to Mine (${tierData.travelSecs}s)`}
                </button>
            </div>

            {/* Main Tabs */}
            <div className="flex gap-2 border-b-2 border-green-200">
                <button
                    onClick={() => unlockedBanking && setActiveTab('banking')}
                    disabled={!unlockedBanking}
                    title={unlockedBanking ? undefined : 'Investments unlock after first prestige'}
                    className={`px-4 py-2 font-semibold rounded-t-lg transition-all ${
                        activeTab === 'banking'
                            ? 'bg-green-100 text-green-900 border-2 border-b-0 border-green-200'
                            : unlockedBanking
                                ? 'bg-white/50 text-green-700 hover:bg-white/80'
                                : 'bg-white/30 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    🏦 Banking {!unlockedBanking && '🔒'}
                </button>
                <button
                    onClick={() => setActiveTab('shop')}
                    className={`px-4 py-2 font-semibold rounded-t-lg transition-all ${
                        activeTab === 'shop'
                            ? 'bg-green-100 text-green-900 border-2 border-b-0 border-green-200'
                            : 'bg-white/50 text-green-700 hover:bg-white/80'
                    }`}
                >
                    🛒 Shop
                </button>
                <button
                    onClick={() => setActiveTab('laborOffice')}
                    className={`px-4 py-2 font-semibold rounded-t-lg transition-all ${
                        activeTab === 'laborOffice'
                            ? 'bg-green-100 text-green-900 border-2 border-b-0 border-green-200'
                            : 'bg-white/50 text-green-700 hover:bg-white/80'
                    }`}
                >
                    👷 Labor Office
                </button>
                {prestigeCount > 0 && (
                    <button
                        onClick={() => setActiveTab('legacy')}
                        className={`px-4 py-2 font-semibold rounded-t-lg transition-all ${
                            activeTab === 'legacy'
                                ? 'bg-amber-100 text-amber-900 border-2 border-b-0 border-amber-200'
                                : 'bg-white/50 text-amber-700 hover:bg-white/80'
                        }`}
                    >
                        ✨ Legacy
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'banking' && (
                    unlockedBanking
                        ? <Banking />
                        : (
                            <div className="p-6 text-center text-gray-500 italic">
                                🔒 Investments unlock after your first prestige.
                            </div>
                        )
                )}

                {activeTab === 'shop' && (
                    <div className="space-y-4">
                        {/* Shop Sub-tabs */}
                        <div className="flex gap-2 border-b-2 border-gray-200">
                            <button
                                onClick={() => setShopTab('gear')}
                                className={`px-4 py-2 font-semibold rounded-t-lg transition-all text-sm ${
                                    shopTab === 'gear'
                                        ? 'bg-gray-100 text-gray-900 border-2 border-b-0 border-gray-200'
                                        : 'bg-white/50 text-gray-700 hover:bg-white/80'
                                }`}
                            >
                                ⛏️ Gear
                            </button>
                            <button
                                onClick={() => setShopTab('equipment')}
                                className={`px-4 py-2 font-semibold rounded-t-lg transition-all text-sm ${
                                    shopTab === 'equipment'
                                        ? 'bg-gray-100 text-gray-900 border-2 border-b-0 border-gray-200'
                                        : 'bg-white/50 text-gray-700 hover:bg-white/80'
                                }`}
                            >
                                🔧 Equipment
                            </button>
                            <button
                                onClick={() => setShopTab('transport')}
                                className={`px-4 py-2 font-semibold rounded-t-lg transition-all text-sm ${
                                    shopTab === 'transport'
                                        ? 'bg-gray-100 text-gray-900 border-2 border-b-0 border-gray-200'
                                        : 'bg-white/50 text-gray-700 hover:bg-white/80'
                                }`}
                            >
                                🚗 Transport
                            </button>
                        </div>

                        {/* Shop Tab Content */}
                        <div className="space-y-2">
                            {shopTab === 'gear' && (
                            <>
                                <UpgradeButton
                                    name="Shovel Upgrade"
                                    description={shovelTier < MAX_TOOL_TIER
                                        ? `Scoop power: ${scoopPower} → ${scoopPower + 1} dirt/click`
                                        : 'Maximum shovel tier reached'}
                                    cost={betterShovelCost}
                                    currentLevel={shovelTier}
                                    maxLevel={MAX_TOOL_TIER}
                                    canAfford={money >= betterShovelCost && shovelTier < MAX_TOOL_TIER}
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
                                    onBuy={() => buyUpgrade('betterPan')}
                                    icon="🥘"
                                />

                                {hasSluiceBox && (
                                    <UpgradeButton
                                        name="Better Sluice Box"
                                        description={`Sluice extraction: ${(UPGRADES.sluiceWorker.extractionBonus * sluiceGear * 100).toFixed(0)}% → ${(UPGRADES.sluiceWorker.extractionBonus * (sluiceGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={betterSluiceCost}
                                        currentLevel={sluiceGear - 1}
                                        canAfford={money >= betterSluiceCost}
                                        onBuy={() => buyUpgrade('betterSluice')}
                                        icon="🚿"
                                    />
                                )}

                                {hasMagneticSeparator && (
                                    <UpgradeButton
                                        name="Better Separator"
                                        description={`Separator extraction: ${(UPGRADES.separatorWorker.extractionBonus * separatorGear * 100).toFixed(0)}% → ${(UPGRADES.separatorWorker.extractionBonus * (separatorGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={betterSeparatorCost}
                                        currentLevel={separatorGear - 1}
                                        canAfford={money >= betterSeparatorCost}
                                        onBuy={() => buyUpgrade('betterSeparator')}
                                        icon="🧲"
                                    />
                                )}

                                {hasOven && (
                                    <UpgradeButton
                                        name="Better Oven"
                                        description={`Oven value bonus: ${(UPGRADES.ovenWorker.valueBonus * ovenGear * 100).toFixed(0)}% → ${(UPGRADES.ovenWorker.valueBonus * (ovenGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={betterOvenCost}
                                        currentLevel={ovenGear - 1}
                                        canAfford={money >= betterOvenCost}
                                        onBuy={() => buyUpgrade('betterOven')}
                                        icon="🔥"
                                    />
                                )}

                                {hasFurnace && (
                                    <UpgradeButton
                                        name="Better Furnace"
                                        description={`Furnace value bonus: ${(UPGRADES.furnaceWorker.valueBonus * furnaceGear * 100).toFixed(0)}% → ${(UPGRADES.furnaceWorker.valueBonus * (furnaceGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={betterFurnaceCost}
                                        currentLevel={furnaceGear - 1}
                                        canAfford={money >= betterFurnaceCost}
                                        onBuy={() => buyUpgrade('betterFurnace')}
                                        icon="⚗️"
                                    />
                                )}
                            </>
                            )}

                            {shopTab === 'equipment' && (
                            <>
                                <UpgradeButton
                                    name="Sluice Box"
                                    description="Converts dirt into paydirt for better gold yields. Unlocks Sluice Operators."
                                    cost={EQUIPMENT.sluiceBox.cost}
                                    locked={hasSluiceBox}
                                    canAfford={money >= EQUIPMENT.sluiceBox.cost && !hasSluiceBox}
                                    onBuy={() => buyUpgrade('sluiceBox')}
                                    icon={hasSluiceBox ? '✅' : '🚿'}
                                />

                                <UpgradeButton
                                    name="Magnetic Separator"
                                    description="Unlocks Separator Technicians for better gold extraction"
                                    cost={EQUIPMENT.magneticSeparator.cost}
                                    locked={hasMagneticSeparator}
                                    canAfford={money >= EQUIPMENT.magneticSeparator.cost && !hasMagneticSeparator}
                                    onBuy={() => buyUpgrade('magneticSeparator')}
                                    icon={hasMagneticSeparator ? '✅' : '🧲'}
                                />

                                <UpgradeButton
                                    name="Oven"
                                    description="Unlocks Oven Operators who increase gold selling value"
                                    cost={EQUIPMENT.oven.cost}
                                    locked={hasOven}
                                    canAfford={money >= EQUIPMENT.oven.cost && !hasOven}
                                    onBuy={() => buyUpgrade('oven')}
                                    icon={hasOven ? '✅' : '🔥'}
                                />

                                <UpgradeButton
                                    name="Furnace"
                                    description="Unlocks Furnace Operators for better gold value (removes fee!)"
                                    cost={EQUIPMENT.furnace.cost}
                                    locked={hasFurnace}
                                    canAfford={money >= EQUIPMENT.furnace.cost && !hasFurnace}
                                    onBuy={() => buyUpgrade('furnace')}
                                    icon={hasFurnace ? '✅' : '⚗️'}
                                />
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

                {activeTab === 'legacy' && prestigeCount > 0 && (
                    <PrestigeShop />
                )}

                {activeTab === 'laborOffice' && (
                    <div className="space-y-3">
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
                        />

                        {hasSluiceBox && (
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
                            />
                        )}

                        {hasMagneticSeparator && (
                            <WorkerRow
                                name="Separator Technician"
                                description={`+${(UPGRADES.separatorWorker.extractionBonus * 100).toFixed(0)}% gold extraction per worker`}
                                count={separatorWorkers}
                                hireCost={separatorWorkerCost}
                                wage={separatorWorkerTotalWage}
                                canHire={money >= separatorWorkerCost}
                                canFire={separatorWorkers > 0}
                                onHire={() => buyUpgrade('separatorWorker')}
                                onFire={() => fireWorker('separatorWorker')}
                                icon="🧲"
                            />
                        )}

                        {hasOven && (
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
                            />
                        )}

                        {hasFurnace && (
                            <WorkerRow
                                name="Furnace Operator"
                                description={`+${(UPGRADES.furnaceWorker.valueBonus * 100).toFixed(0)}% gold value, reduces smelting fee`}
                                count={furnaceWorkers}
                                hireCost={furnaceWorkerCost}
                                wage={furnaceWorkerTotalWage}
                                canHire={money >= furnaceWorkerCost}
                                canFire={furnaceWorkers > 0}
                                onHire={() => buyUpgrade('furnaceWorker')}
                                onFire={() => fireWorker('furnaceWorker')}
                                icon="⚗️"
                            />
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
                            onBuy={() => gameStore.getState().buyDriver()}
                            icon={hasDriver ? '✅' : '🤠'}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

