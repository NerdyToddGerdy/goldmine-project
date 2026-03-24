import { gameStore, getUpgradeCost, UPGRADES, EQUIPMENT, useGameStore, getTotalWageForType } from "../store/gameStore";
import { useState } from "react";
import { Banking } from "./Banking";
import { UpgradeButton, WorkerRow } from "./ui";

type TownTab = 'banking' | 'shop' | 'laborOffice';
type ShopTab = 'gear' | 'equipment';

export function Town() {
    const [activeTab, setActiveTab] = useState<TownTab>('banking');
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
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const separatorGear = useGameStore((s) => s.separatorGear);
    const ovenGear = useGameStore((s) => s.ovenGear);
    const furnaceGear = useGameStore((s) => s.furnaceGear);

    const buyUpgrade = (upgrade: string) => gameStore.getState().buyUpgrade(upgrade);
    const fireWorker = (workerType: string) => gameStore.getState().fireWorker(workerType);

    const shovelCost = getUpgradeCost('shovel', shovels);
    const panCost = getUpgradeCost('pan', pans);
    const betterShovelCost = getUpgradeCost('betterShovel', scoopPower - 1);
    const betterPanCost = getUpgradeCost('betterPan', panPower - 1);
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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-green-900">🏘️ Town</h2>

            {/* Main Tabs */}
            <div className="flex gap-2 border-b-2 border-green-200">
                <button
                    onClick={() => setActiveTab('banking')}
                    className={`px-4 py-2 font-semibold rounded-t-lg transition-all ${
                        activeTab === 'banking'
                            ? 'bg-green-100 text-green-900 border-2 border-b-0 border-green-200'
                            : 'bg-white/50 text-green-700 hover:bg-white/80'
                    }`}
                >
                    🏦 Banking
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
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'banking' && (
                    <Banking />
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
                        </div>

                        {/* Shop Tab Content */}
                        <div className="space-y-2">
                            {shopTab === 'gear' && (
                            <>
                                <UpgradeButton
                                    name="Better Shovel"
                                    description={`Manual scoop power: ${scoopPower} → ${scoopPower + 1}`}
                                    cost={betterShovelCost}
                                    currentLevel={scoopPower - 1}
                                    canAfford={money >= betterShovelCost}
                                    onBuy={() => buyUpgrade('betterShovel')}
                                    icon="⛏️"
                                />

                                <UpgradeButton
                                    name="Better Pan"
                                    description={`Manual pan power: ${panPower} → ${panPower + 1}`}
                                    cost={betterPanCost}
                                    currentLevel={panPower - 1}
                                    canAfford={money >= betterPanCost}
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
                        </div>
                    </div>
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
                    </div>
                )}
            </div>
        </div>
    );
}

