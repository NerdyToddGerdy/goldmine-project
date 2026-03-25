import { gameStore, useGameStore, BASE_EXTRACTION, EQUIPMENT, UPGRADES, PRESTIGE_MONEY_THRESHOLD, getUpgradeCost, getEffectiveBucketCapacity, getEffectivePanCapacity, VEHICLE_TIERS } from "../store/gameStore";
import { ProgressBar, PrestigeModal } from "./ui";
import { formatNumber } from "../utils/format";
import { useState } from "react";

export function Mine() {
    const bucketFilled = useGameStore((s) => s.bucketFilled);
    const panFilled = useGameStore((s) => s.panFilled);
    const gold = useGameStore((s) => s.gold);
    const money = useGameStore((s) => s.money);
    const scoopPower = useGameStore((s) => s.scoopPower);
    const sluicePower = useGameStore((s) => s.sluicePower);
    const panPower = useGameStore((s) => s.panPower);
    const unlockedPanning = useGameStore((s) => s.unlockedPanning);
    const unlockedTown = useGameStore((s) => s.unlockedTown);
    const hasSluiceBox = useGameStore((s) => s.hasSluiceBox);
    const shovels = useGameStore((s) => s.shovels);
    const pans = useGameStore((s) => s.pans);
    const sluiceWorkers = useGameStore((s) => s.sluiceWorkers);
    const separatorWorkers = useGameStore((s) => s.separatorWorkers);
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const separatorGear = useGameStore((s) => s.separatorGear);

    const hasMagneticSeparator = useGameStore((s) => s.hasMagneticSeparator);
    const hasOven = useGameStore((s) => s.hasOven);
    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const ovenWorkers = useGameStore((s) => s.ovenWorkers);
    const furnaceWorkers = useGameStore((s) => s.furnaceWorkers);
    const bankerWorkers = useGameStore((s) => s.bankerWorkers);
    const legacyDust = useGameStore((s) => s.legacyDust);
    const dustBucketSize = useGameStore((s) => s.dustBucketSize);
    const dustPanCapacity = useGameStore((s) => s.dustPanCapacity);
    const bucketUpgrades = useGameStore((s) => s.bucketUpgrades);
    const panCapUpgrades = useGameStore((s) => s.panCapUpgrades);
    const runMoneyEarned = useGameStore((s) => s.runMoneyEarned);
    const vehicleTier = useGameStore((s) => s.vehicleTier);
    const isTraveling = useGameStore((s) => s.isTraveling);
    const travelDestination = useGameStore((s) => s.travelDestination);

    const effectiveBucketCap = getEffectiveBucketCapacity(dustBucketSize + bucketUpgrades);
    const effectivePanCap = getEffectivePanCapacity(dustPanCapacity + panCapUpgrades);
    const [showPrestigeModal, setShowPrestigeModal] = useState(false);

    const dustReward = Math.floor(Math.sqrt(runMoneyEarned));
    const canPrestige = runMoneyEarned >= PRESTIGE_MONEY_THRESHOLD;

    const scoopDirt = () => gameStore.getState().scoopDirt();
    const emptyBucket = () => gameStore.getState().emptyBucket();
    const panForGold = () => gameStore.getState().panForGold();
    const hireMiner = () => gameStore.getState().buyUpgrade('shovel');
    const hireProspector = () => gameStore.getState().buyUpgrade('pan');
    const travelToTown = () => gameStore.getState().startTravel('town');

    const minerCost = getUpgradeCost('shovel', shovels);
    const prospectorCost = getUpgradeCost('pan', pans);

    // Manual actions now benefit from gear upgrades
    let extractionRate = BASE_EXTRACTION;
    extractionRate += sluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * sluiceGear;
    extractionRate += separatorWorkers * UPGRADES.separatorWorker.extractionBonus * separatorGear;

    const goldPerPan = panPower * extractionRate;
    const effectiveSluicePower = hasSluiceBox ? sluicePower * sluiceGear : 1;
    const bucketToPanel = bucketFilled * effectiveSluicePower;

    const bucketIsFull = bucketFilled >= effectiveBucketCap;
    const panIsFull = panFilled >= effectivePanCap;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-amber-900">⛏️ The Mine</h2>

            {/* Travel to Town — at top, mirrors Town page layout */}
            {unlockedTown && (
                <div className="p-3 bg-white border border-green-200 rounded-xl">
                    <button
                        onClick={travelToTown}
                        disabled={isTraveling}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isTraveling && travelDestination === 'town'
                            ? '🚗 Traveling to Town...'
                            : `🏘️ Travel to Town (${VEHICLE_TIERS[vehicleTier as 0|1|2|3].travelSecs}s)`}
                    </button>
                </div>
            )}

            {/* Manual Actions */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-amber-800">Actions</h3>

                {/* Bucket Section - Combined UI */}
                <div className="p-4 bg-white border-2 border-amber-300 rounded-xl space-y-3">
                    {/* Bucket Progress Bar */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-amber-900">🪣 Bucket</span>
                            <span className="text-sm font-semibold text-amber-700">
                                {bucketFilled.toFixed(1)} / {effectiveBucketCap}
                            </span>
                        </div>
                        <ProgressBar value={bucketFilled} max={effectiveBucketCap} color="amber" />
                        <div className="h-5 mt-1 flex items-center justify-center">
                            {bucketIsFull && (
                                <span className="text-xs text-amber-700 font-semibold">
                                    Bucket is full! Empty it to continue scooping.
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Scoop Button */}
                    <button
                        onClick={scoopDirt}
                        disabled={bucketIsFull || isTraveling}
                        className="w-full px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        🪨 Scoop Dirt (+{scoopPower.toFixed(1)})
                    </button>

                    {/* Empty Bucket Button */}
                    {unlockedPanning && (
                        <button
                            onClick={emptyBucket}
                            disabled={bucketFilled === 0 || panIsFull || isTraveling}
                            className="w-full px-6 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {hasSluiceBox
                                ? `🚿 Empty Bucket → Pan (+${bucketToPanel.toFixed(1)})`
                                : `🪣 Empty Bucket → Pan (+${bucketFilled.toFixed(1)})`
                            }
                        </button>
                    )}

                    {/* Helper: Hire Miner */}
                    <div className="flex items-center justify-between pt-1 border-t border-amber-100">
                        <span className="text-sm text-amber-700">
                            👷 Miners: <span className="font-semibold">{shovels}</span>
                        </span>
                        <button
                            onClick={hireMiner}
                            disabled={money < minerCost || isTraveling}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                            Hire ${minerCost}
                        </button>
                    </div>
                </div>

                {/* Pan/Sluice Section */}
                {unlockedPanning && (
                    <div className="p-4 bg-white border-2 border-yellow-300 rounded-xl space-y-3">
                        {/* Pan Progress Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-yellow-900">
                                    {hasSluiceBox ? '🚿 Sluice Box' : '🥘 Pan'}
                                </span>
                                <span className="text-sm font-semibold text-yellow-700">
                                    {panFilled.toFixed(1)} / {effectivePanCap}
                                </span>
                            </div>
                            <ProgressBar value={panFilled} max={effectivePanCap} color="yellow" />
                            <div className="h-5 mt-1 flex items-center justify-center">
                                {panIsFull && (
                                    <span className="text-xs text-yellow-700 font-semibold">
                                        Pan is full! Start panning to make room.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Pan for Gold Button */}
                        <button
                            onClick={panForGold}
                            disabled={panFilled < 1 || isTraveling}
                            className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ✨ Pan for Gold (-1, +{goldPerPan.toFixed(2)} gold)
                        </button>

                        {/* Helper: Hire Prospector */}
                        <div className="flex items-center justify-between pt-1 border-t border-yellow-100">
                            <span className="text-sm text-yellow-700">
                                🧑‍🔬 Prospectors: <span className="font-semibold">{pans}</span>
                            </span>
                            <button
                                onClick={hireProspector}
                                disabled={money < prospectorCost || isTraveling}
                                className="px-3 py-1 text-xs font-semibold rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border border-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Hire ${prospectorCost}
                            </button>
                        </div>
                    </div>
                )}

                {/* Travel to Town — shown when player has gold but hasn't discovered Town yet */}
                {!unlockedTown && gold >= 0.5 && (
                    <div className="p-4 bg-green-50 border-2 border-green-300 rounded-xl space-y-3">
                        <p className="text-sm font-semibold text-green-900">You have gold! Travel to Town to sell it.</p>
                        <button
                            onClick={travelToTown}
                            disabled={isTraveling}
                            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🚶 Travel to Town ({VEHICLE_TIERS[0].travelSecs}s)
                        </button>
                    </div>
                )}

                {/* Sluice Box unlock message */}
                {!hasSluiceBox && money < EQUIPMENT.sluiceBox.cost && unlockedPanning && (
                    <div className="text-sm text-blue-700 italic text-center p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        💡 Save up ${EQUIPMENT.sluiceBox.cost} in Town to unlock the Sluice Box - it converts bucket dirt to paydirt for better yields!
                    </div>
                )}

                {!unlockedPanning && bucketFilled < 2 && (
                    <div className="text-sm text-amber-700 italic text-center">
                        Scoop bucket to 2 to unlock panning!
                    </div>
                )}
            </div>

            {/* Automation Status */}
            {(shovels > 0 || pans > 0) && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">Automation</h3>
                    <div className="text-sm space-y-1 text-amber-700">
                        {shovels > 0 && <div>🪨 {shovels} Miners (auto-digging)</div>}
                        {pans > 0 && <div>✨ {pans} Prospectors (auto-panning)</div>}
                    </div>
                </div>
            )}

            {/* Hint: earn gold to travel */}
            {!unlockedTown && gold < 0.5 && unlockedPanning && (
                <div className="text-sm text-amber-700 italic text-center p-3 bg-amber-100 rounded-xl">
                    Pan gold to 0.5 oz and you can travel to Town!
                </div>
            )}

            {/* Prestige card */}
            {canPrestige && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-3">
                    <h3 className="text-lg font-semibold text-amber-900">⭐ New Creek Run</h3>
                    <p className="text-sm text-amber-700">
                        Earned <span className="font-semibold">${formatNumber(runMoneyEarned)}</span> this run
                    </p>
                    <p className="text-sm font-semibold text-amber-800">
                        Reward: ✨ {dustReward} Legacy Dust
                    </p>
                    <button
                        onClick={() => setShowPrestigeModal(true)}
                        className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold"
                    >
                        Prestige!
                    </button>
                </div>
            )}

            {showPrestigeModal && (
                <PrestigeModal
                    dustReward={dustReward}
                    legacyDust={legacyDust}
                    money={money}
                    gold={gold}
                    shovels={shovels}
                    pans={pans}
                    sluiceWorkers={sluiceWorkers}
                    separatorWorkers={separatorWorkers}
                    ovenWorkers={ovenWorkers}
                    furnaceWorkers={furnaceWorkers}
                    bankerWorkers={bankerWorkers}
                    hasSluiceBox={hasSluiceBox}
                    hasMagneticSeparator={hasMagneticSeparator}
                    hasOven={hasOven}
                    hasFurnace={hasFurnace}
                    vehicleTier={vehicleTier}
                    onConfirm={() => { gameStore.getState().prestige(); setShowPrestigeModal(false); }}
                    onCancel={() => setShowPrestigeModal(false)}
                />
            )}
        </div>
    );
}
