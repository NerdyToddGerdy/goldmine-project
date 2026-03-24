import { gameStore, getUpgradeCost, UPGRADES, EQUIPMENT, useGameStore, getTotalWageForType } from "../store/gameStore";
import { formatNumber } from "../utils/format";
import { useState } from "react";
import { Banking } from "./Banking";

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
                                    owned={scoopPower - 1}
                                    money={money}
                                    onBuy={() => buyUpgrade('betterShovel')}
                                    icon="⛏️"
                                />

                                <UpgradeButton
                                    name="Better Pan"
                                    description={`Manual pan power: ${panPower} → ${panPower + 1}`}
                                    cost={betterPanCost}
                                    owned={panPower - 1}
                                    money={money}
                                    onBuy={() => buyUpgrade('betterPan')}
                                    icon="🥘"
                                />

                                {hasSluiceBox && (
                                    <UpgradeButton
                                        name="Better Sluice Box"
                                        description={`Sluice extraction: ${(UPGRADES.sluiceWorker.extractionBonus * sluiceGear * 100).toFixed(0)}% → ${(UPGRADES.sluiceWorker.extractionBonus * (sluiceGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={betterSluiceCost}
                                        owned={sluiceGear - 1}
                                        money={money}
                                        onBuy={() => buyUpgrade('betterSluice')}
                                        icon="🚿"
                                    />
                                )}

                                {hasMagneticSeparator && (
                                    <UpgradeButton
                                        name="Better Separator"
                                        description={`Separator extraction: ${(UPGRADES.separatorWorker.extractionBonus * separatorGear * 100).toFixed(0)}% → ${(UPGRADES.separatorWorker.extractionBonus * (separatorGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={betterSeparatorCost}
                                        owned={separatorGear - 1}
                                        money={money}
                                        onBuy={() => buyUpgrade('betterSeparator')}
                                        icon="🧲"
                                    />
                                )}

                                {hasOven && (
                                    <UpgradeButton
                                        name="Better Oven"
                                        description={`Oven value bonus: ${(UPGRADES.ovenWorker.valueBonus * ovenGear * 100).toFixed(0)}% → ${(UPGRADES.ovenWorker.valueBonus * (ovenGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={betterOvenCost}
                                        owned={ovenGear - 1}
                                        money={money}
                                        onBuy={() => buyUpgrade('betterOven')}
                                        icon="🔥"
                                    />
                                )}

                                {hasFurnace && (
                                    <UpgradeButton
                                        name="Better Furnace"
                                        description={`Furnace value bonus: ${(UPGRADES.furnaceWorker.valueBonus * furnaceGear * 100).toFixed(0)}% → ${(UPGRADES.furnaceWorker.valueBonus * (furnaceGear + 1) * 100).toFixed(0)}% per worker`}
                                        cost={betterFurnaceCost}
                                        owned={furnaceGear - 1}
                                        money={money}
                                        onBuy={() => buyUpgrade('betterFurnace')}
                                        icon="⚗️"
                                    />
                                )}
                            </>
                            )}

                            {shopTab === 'equipment' && (
                            <>
                                <EquipmentButton
                                    name="Sluice Box"
                                    description="Converts dirt into paydirt for better gold yields. Unlocks Sluice Operators."
                                    cost={EQUIPMENT.sluiceBox.cost}
                                    owned={hasSluiceBox}
                                    money={money}
                                    onBuy={() => buyUpgrade('sluiceBox')}
                                    icon="🚿"
                                />

                                <EquipmentButton
                                    name="Magnetic Separator"
                                    description="Unlocks Separator Technicians for better gold extraction"
                                    cost={EQUIPMENT.magneticSeparator.cost}
                                    owned={hasMagneticSeparator}
                                    money={money}
                                    onBuy={() => buyUpgrade('magneticSeparator')}
                                    icon="🧲"
                                />

                                <EquipmentButton
                                    name="Oven"
                                    description="Unlocks Oven Operators who increase gold selling value"
                                    cost={EQUIPMENT.oven.cost}
                                    owned={hasOven}
                                    money={money}
                                    onBuy={() => buyUpgrade('oven')}
                                    icon="🔥"
                                />

                                <EquipmentButton
                                    name="Furnace"
                                    description="Unlocks Furnace Operators for better gold value (removes fee!)"
                                    cost={EQUIPMENT.furnace.cost}
                                    owned={hasFurnace}
                                    money={money}
                                    onBuy={() => buyUpgrade('furnace')}
                                    icon="⚗️"
                                />
                            </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'laborOffice' && (
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-green-800">👷 Hire Workers</h3>
                                <UpgradeButton
                                    name="Miner"
                                    description={`Digs ${UPGRADES.shovel.dirtPerSec} dirt/sec automatically`}
                                    cost={shovelCost}
                                    owned={shovels}
                                    money={money}
                                    onBuy={() => buyUpgrade('shovel')}
                                    onFire={() => fireWorker('shovel')}
                                    wage={shovelTotalWage}
                                    icon="👷"
                                />

                                <UpgradeButton
                                    name="Prospector"
                                    description={`Pans ${UPGRADES.pan.goldPerSec} gold/sec automatically`}
                                    cost={panCost}
                                    owned={pans}
                                    money={money}
                                    onBuy={() => buyUpgrade('pan')}
                                    onFire={() => fireWorker('pan')}
                                    wage={panTotalWage}
                                    icon="🧑‍🔬"
                                />

                                {hasSluiceBox && (
                                    <UpgradeButton
                                        name="Sluice Operator"
                                        description={`Converts 1 dirt/sec to paydirt automatically, +${(UPGRADES.sluiceWorker.extractionBonus * 100).toFixed(0)}% gold extraction`}
                                        cost={sluiceWorkerCost}
                                        owned={sluiceWorkers}
                                        money={money}
                                        onBuy={() => buyUpgrade('sluiceWorker')}
                                        onFire={() => fireWorker('sluiceWorker')}
                                        wage={sluiceWorkerTotalWage}
                                        icon="🚿"
                                    />
                                )}

                                {hasMagneticSeparator && (
                                    <UpgradeButton
                                        name="Separator Technician"
                                        description={`Boosts automated gold extraction by +${(UPGRADES.separatorWorker.extractionBonus * 100).toFixed(0)}% per worker`}
                                        cost={separatorWorkerCost}
                                        owned={separatorWorkers}
                                        money={money}
                                        onBuy={() => buyUpgrade('separatorWorker')}
                                        onFire={() => fireWorker('separatorWorker')}
                                        wage={separatorWorkerTotalWage}
                                        icon="🧲"
                                    />
                                )}

                                {hasOven && (
                                    <UpgradeButton
                                        name="Oven Operator"
                                        description={`Boosts automated gold selling value by +${(UPGRADES.ovenWorker.valueBonus * 100).toFixed(0)}% per worker`}
                                        cost={ovenWorkerCost}
                                        owned={ovenWorkers}
                                        money={money}
                                        onBuy={() => buyUpgrade('ovenWorker')}
                                        onFire={() => fireWorker('ovenWorker')}
                                        wage={ovenWorkerTotalWage}
                                        icon="🔥"
                                    />
                                )}

                                {hasFurnace && (
                                    <UpgradeButton
                                        name="Furnace Operator"
                                        description={`Boosts automated gold selling value by +${(UPGRADES.furnaceWorker.valueBonus * 100).toFixed(0)}% per worker (first removes fee!)`}
                                        cost={furnaceWorkerCost}
                                        owned={furnaceWorkers}
                                        money={money}
                                        onBuy={() => buyUpgrade('furnaceWorker')}
                                        onFire={() => fireWorker('furnaceWorker')}
                                        wage={furnaceWorkerTotalWage}
                                        icon="⚗️"
                                    />
                                )}

                                <UpgradeButton
                                    name="Banker"
                                    description={`Automatically sells ${UPGRADES.bankerWorker.goldPerSec} gold/sec for money (applies value bonuses)`}
                                    cost={bankerWorkerCost}
                                    owned={bankerWorkers}
                                    money={money}
                                    onBuy={() => buyUpgrade('bankerWorker')}
                                    onFire={() => fireWorker('bankerWorker')}
                                    wage={bankerWorkerTotalWage}
                                    icon="🏦"
                                />
                    </div>
                )}
            </div>
        </div>
    );
}

function UpgradeButton({
    name,
    description,
    cost,
    owned,
    money,
    onBuy,
    onFire,
    wage,
    icon
}: {
    name: string;
    description: string;
    cost: number;
    owned: number;
    money: number;
    onBuy: () => void;
    onFire?: () => void;
    wage?: number;
    icon: string;
}) {
    const canAfford = money >= cost;
    const canFire = owned > 0;

    // If this is a worker (has onFire), show both hire and fire buttons
    if (onFire) {
        return (
            <div className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="font-semibold text-green-900">
                            {icon} {name} <span className="text-sm text-gray-500">(owned: {owned})</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{description}</div>
                        {wage !== undefined && wage > 0 && (
                            <div className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                                💰 Total wages: ${formatNumber(wage)}/sec
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button
                            onClick={onBuy}
                            disabled={!canAfford}
                            className="px-3 py-2 rounded-lg border border-green-400 bg-green-50 text-green-700 hover:bg-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                        >
                            Hire ${cost}
                        </button>
                        <button
                            onClick={onFire}
                            disabled={!canFire}
                            className="px-3 py-2 rounded-lg border border-red-400 bg-red-50 text-red-700 hover:bg-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                        >
                            Fire
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // For gear upgrades (no onFire), show original single-button layout
    return (
        <button
            onClick={onBuy}
            disabled={!canAfford}
            className="w-full p-4 bg-white border-2 border-gray-200 hover:border-green-400 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="font-semibold text-green-900">
                        {icon} {name} <span className="text-sm text-gray-500">(owned: {owned})</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{description}</div>
                </div>
                <div className={`text-lg font-bold ml-4 ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                    ${cost}
                </div>
            </div>
        </button>
    );
}

function EquipmentButton({
    name,
    description,
    cost,
    owned,
    money,
    onBuy,
    icon
}: {
    name: string;
    description: string;
    cost: number;
    owned: boolean;
    money: number;
    onBuy: () => void;
    icon: string;
}) {
    const canAfford = money >= cost && !owned;

    return (
        <button
            onClick={onBuy}
            disabled={!canAfford || owned}
            className="w-full p-4 bg-white border-2 border-gray-200 hover:border-green-400 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="font-semibold text-green-900">
                        {icon} {name} {owned && <span className="text-sm text-green-600">✓ Owned</span>}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{description}</div>
                </div>
                <div className={`text-lg font-bold ml-4 ${owned ? 'text-gray-400' : canAfford ? 'text-green-600' : 'text-red-600'}`}>
                    ${cost}
                </div>
            </div>
        </button>
    );
}
