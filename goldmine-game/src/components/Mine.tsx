import { gameStore, useGameStore, BASE_EXTRACTION, EQUIPMENT, UPGRADES, getUpgradeCost, getEffectiveBucketCapacity, getEffectivePanCapacity, VEHICLE_TIERS, getTravelDurationTicks, getTotalPayroll, SMELTING_FEE_PERCENT, FURNACE_CAPACITY, SMELT_RATE_BASE } from "../store/gameStore";
import { ProgressBar } from "./ui";
import { formatNumber } from "../utils/format";
import { useState } from "react";

export function Mine() {
    const bucketFilled = useGameStore((s) => s.bucketFilled);
    const panFilled = useGameStore((s) => s.panFilled);
    const sluiceBoxFilled = useGameStore((s) => s.sluiceBoxFilled);
    const minersMossFilled = useGameStore((s) => s.minersMossFilled);
    const gold = useGameStore((s) => s.gold);
    const money = useGameStore((s) => s.money);
    const scoopPower = useGameStore((s) => s.scoopPower);
    const panPower = useGameStore((s) => s.panPower);
    const unlockedPanning = useGameStore((s) => s.unlockedPanning);
    const unlockedTown = useGameStore((s) => s.unlockedTown);
    const hasSluiceBox = useGameStore((s) => s.hasSluiceBox);
    const shovels = useGameStore((s) => s.shovels);
    const pans = useGameStore((s) => s.pans);
    const sluiceWorkers = useGameStore((s) => s.sluiceWorkers);
    const sluiceGear = useGameStore((s) => s.sluiceGear);

    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const furnaceWorkers = useGameStore((s) => s.furnaceWorkers);
    const bankerWorkers = useGameStore((s) => s.bankerWorkers);
    const dustBucketSize = useGameStore((s) => s.dustBucketSize);
    const dustPanCapacity = useGameStore((s) => s.dustPanCapacity);
    const bucketUpgrades = useGameStore((s) => s.bucketUpgrades);
    const panCapUpgrades = useGameStore((s) => s.panCapUpgrades);
    const vehicleTier = useGameStore((s) => s.vehicleTier);
    const isTraveling = useGameStore((s) => s.isTraveling);
    const travelProgress = useGameStore((s) => s.travelProgress);
    const travelDestination = useGameStore((s) => s.travelDestination);
    const furnaceGear = useGameStore((s) => s.furnaceGear);
    const devMode = useGameStore((s) => s.devMode);
    const tickCount = useGameStore((s) => s.tickCount);
    const driverTripTicks = useGameStore((s) => s.driverTripTicks);
    const hasDriver = useGameStore((s) => s.hasDriver);
    const goldPrice = useGameStore((s) => s.goldPrice);
    const lastGoldPriceUpdate = useGameStore((s) => s.lastGoldPriceUpdate);
    const isPaused = useGameStore((s) => s.isPaused);
    const hasMetalDetector = useGameStore((s) => s.hasMetalDetector);
    const richDirtInBucket = useGameStore((s) => s.richDirtInBucket);
    const detectorWorkers = useGameStore((s) => s.detectorWorkers);
    const detectProgress = useGameStore((s) => s.detectProgress);
    const detectTarget = useGameStore((s) => s.detectTarget);
    const patchActive = useGameStore((s) => s.patchActive);
    const patchRemaining = useGameStore((s) => s.patchRemaining);
    const patchCapacity = useGameStore((s) => s.patchCapacity);

    const furnaceFilled = useGameStore((s) => s.furnaceFilled);
    const furnaceRunning = useGameStore((s) => s.furnaceRunning);
    const furnaceBars = useGameStore((s) => s.furnaceBars);
    const goldBars = useGameStore((s) => s.goldBars);

    const effectiveBucketCap = getEffectiveBucketCapacity(dustBucketSize + bucketUpgrades);
    const effectivePanCap = getEffectivePanCapacity(dustPanCapacity + panCapUpgrades);
    // Travel progress bar calculations
    const TRAVEL_EMOJIS = { 0: '🚶', 1: '🐴', 2: '🚂', 3: '🚛' } as const;
    const totalTravelTicks = getTravelDurationTicks(vehicleTier);
    const travelPct = totalTravelTicks > 0 ? Math.min(100, (travelProgress / totalTravelTicks) * 100) : 0;
    const secsRemaining = Math.ceil((totalTravelTicks - travelProgress) / 60);
    const vehicleEmoji = TRAVEL_EMOJIS[vehicleTier as 0|1|2|3];

    // Payroll widget calculations (per minute)
    const payrollPerMin = getTotalPayroll({ shovels, pans, sluiceWorkers, furnaceWorkers, bankerWorkers, detectorWorkers }) * 60;
    const autoSellFee = !hasFurnace ? SMELTING_FEE_PERCENT : 0;
    const bankerIncomePerMin = bankerWorkers * UPGRADES.bankerWorker.goldPerSec * goldPrice * (1 - autoSellFee) * 60;

    const scoopDirt = () => gameStore.getState().scoopDirt();
    const emptyBucket = () => gameStore.getState().emptyBucket();
    const detectPatch = () => gameStore.getState().detectPatch();
    const cleanMoss = () => gameStore.getState().cleanMoss();
    const panForGold = () => gameStore.getState().panForGold();
    const loadFurnace = () => gameStore.getState().loadFurnace();
    const toggleFurnace = () => gameStore.getState().toggleFurnace();
    const collectBars = () => gameStore.getState().collectBars();
    const hireMiner = () => gameStore.getState().buyUpgrade('shovel');
    const hireProspector = () => gameStore.getState().buyUpgrade('pan');
    const travelToTown = () => gameStore.getState().startTravel('town');

    const minerCost = getUpgradeCost('shovel', shovels);
    const prospectorCost = getUpgradeCost('pan', pans);

    // Manual actions now benefit from gear upgrades
    let extractionRate = BASE_EXTRACTION;
    extractionRate += sluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * sluiceGear;

    const goldPerPan = panPower * extractionRate;

    const bucketIsFull = bucketFilled >= effectiveBucketCap;
    const panIsFull = panFilled >= effectivePanCap;
    const panHasRoomForBucket = panFilled + bucketFilled <= effectivePanCap;
    const sluiceIsDraining = sluiceBoxFilled > 0;
    const sluiceHasSpace = sluiceBoxFilled + bucketFilled <= effectivePanCap;
    const mossCapacity = effectivePanCap; // same formula as pan
    const mossIsFull = minersMossFilled >= mossCapacity;
    const mossCleanAmount = Math.min(minersMossFilled, effectivePanCap - panFilled);

    return (
        <div className="space-y-6">
            <h2 className="font-arcade text-sm text-amber-900">⛏️ The Mine</h2>

            {/* Travel to Town — transforms into progress bar while traveling */}
            {unlockedTown && (
                <div className="p-3 bg-white border border-green-200 rounded-xl">
                    {isTraveling && travelDestination === 'town' ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-green-900 text-sm">
                                    {vehicleEmoji} To Town… ({VEHICLE_TIERS[vehicleTier as 0|1|2|3].name})
                                </span>
                                <button
                                    onClick={() => gameStore.getState().cancelTravel()}
                                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="relative h-7">
                                <div className="absolute inset-0 bg-green-100 rounded-full border border-green-300 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-100"
                                        style={{ width: `${travelPct}%` }}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-green-900 drop-shadow-sm">{secsRemaining}s</span>
                                </div>
                                <div
                                    className="absolute top-1/2 text-lg leading-none pointer-events-none transition-all duration-100"
                                    style={{ left: `${travelPct}%`, transform: 'translateX(-50%) translateY(-50%) scaleX(-1)' }}
                                >
                                    {vehicleEmoji}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={travelToTown}
                            disabled={isTraveling}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🏘️ Travel to Town ({VEHICLE_TIERS[vehicleTier as 0|1|2|3].travelSecs}s)
                        </button>
                    )}
                </div>
            )}

            {/* Metal Detector Section */}
            {hasMetalDetector && (
                <div className="p-4 bg-white border-2 border-violet-300 rounded-xl space-y-3">
                    <h3 className="text-sm font-semibold text-violet-900">🔍 Metal Detector</h3>

                    {patchActive ? (
                        /* Active patch: show remaining rich dirt */
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-violet-800">⛏️ Rich Patch Found!</span>
                                <span className="text-sm font-semibold text-violet-700">{patchRemaining.toFixed(1)} / {patchCapacity} remaining</span>
                            </div>
                            <ProgressBar value={patchCapacity - patchRemaining} max={patchCapacity} color="violet" isActive={true} />
                            <p className="text-xs text-violet-600 text-center">Scoop to harvest rich dirt — miners prioritize this patch</p>
                        </div>
                    ) : (
                        /* Detection phase: progress bar + detect button */
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-violet-800">Searching…</span>
                                <span className="text-sm font-semibold text-violet-700">
                                    {detectTarget === 0 ? '? clicks' : `${detectProgress.toFixed(1)} / ${detectTarget}`}
                                </span>
                            </div>
                            <ProgressBar
                                value={detectTarget > 0 ? detectProgress : 0}
                                max={detectTarget > 0 ? detectTarget : 1}
                                color="violet"
                                isActive={detectorWorkers > 0 && !isTraveling}
                            />
                            <button
                                onClick={detectPatch}
                                disabled={isTraveling}
                                className="w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                🔍 Detect{detectTarget === 0 ? ' — Start Search' : ' (+1)'}
                            </button>
                        </div>
                    )}
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
                        <ProgressBar value={bucketFilled} max={effectiveBucketCap} color="amber" isActive={shovels > 0 && !bucketIsFull} isFull={bucketIsFull} />
                        <div className="h-5 mt-1 flex items-center justify-center">
                            {isTraveling
                                ? <span className="text-xs text-gray-500 font-semibold">🚗 Locked while traveling</span>
                                : bucketIsFull
                                    ? <span className="text-xs text-amber-700 font-semibold">Bucket is full! Empty it to continue scooping.</span>
                                    : patchActive && richDirtInBucket > 0
                                        ? <span className="text-xs text-violet-700 font-semibold">✨ {richDirtInBucket.toFixed(1)} rich dirt in bucket</span>
                                        : null
                            }
                        </div>
                    </div>

                    {/* Scoop Button */}
                    <button
                        onClick={scoopDirt}
                        disabled={bucketIsFull || isTraveling}
                        className="w-full px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        🪨 Scoop Dirt (+{scoopPower.toFixed(1)}){patchActive ? ' ✨ Rich' : ''}
                    </button>

                    {/* Empty Bucket Button */}
                    {unlockedPanning && (
                        <button
                            onClick={emptyBucket}
                            disabled={bucketFilled === 0 || isTraveling || (hasSluiceBox ? !sluiceHasSpace : !panHasRoomForBucket)}
                            className="w-full px-6 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {hasSluiceBox
                                ? `🪣 Empty Bucket → Sluice (+${bucketFilled.toFixed(1)})`
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

                {/* Sluice Box Section */}
                {unlockedPanning && hasSluiceBox && (
                    <div className="p-4 bg-white border-2 border-cyan-300 rounded-xl space-y-3">
                        {/* Sluice Drain Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-cyan-900">🚿 Sluice Box</span>
                                <span className="text-sm font-semibold text-cyan-700">
                                    {sluiceBoxFilled.toFixed(1)} / {effectivePanCap}
                                </span>
                            </div>
                            <ProgressBar value={sluiceBoxFilled} max={effectivePanCap} color="cyan" isActive={sluiceIsDraining} />
                            <div className="h-5 mt-1 flex items-center justify-center">
                                {sluiceIsDraining
                                    ? <span className="text-xs text-cyan-700 font-semibold">Draining… collecting paydirt in moss</span>
                                    : <span className="text-xs text-gray-400">Empty bucket into sluice to start</span>
                                }
                            </div>
                        </div>

                        {/* Miner's Moss Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-amber-900">🌿 Miner's Moss</span>
                                <span className="text-sm font-semibold text-amber-700">
                                    {minersMossFilled.toFixed(1)} / {mossCapacity}
                                </span>
                            </div>
                            <ProgressBar value={minersMossFilled} max={mossCapacity} color="amber" isActive={sluiceIsDraining} isFull={mossIsFull} />
                        </div>

                        {/* Clean Moss Button */}
                        <button
                            onClick={cleanMoss}
                            disabled={minersMossFilled === 0 || panIsFull || isTraveling}
                            className="w-full px-6 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {mossCleanAmount > 0
                                ? `🌿 Clean Moss → Pan (+${mossCleanAmount.toFixed(1)} paydirt)`
                                : `🌿 Clean Moss → Pan`
                            }
                        </button>
                    </div>
                )}

                {/* Pan Section */}
                {unlockedPanning && (
                    <div className="p-4 bg-white border-2 border-yellow-300 rounded-xl space-y-3">
                        {/* Pan Progress Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-yellow-900">
                                    🥘 Pan
                                </span>
                                <span className="text-sm font-semibold text-yellow-700">
                                    {panFilled.toFixed(1)} / {effectivePanCap}
                                </span>
                            </div>
                            <ProgressBar value={panFilled} max={effectivePanCap} color="yellow" isActive={pans > 0 && !panIsFull} isFull={panIsFull} />
                            <div className="h-5 mt-1 flex items-center justify-center">
                                {isTraveling
                                    ? <span className="text-xs text-gray-500 font-semibold">🚗 Locked while traveling</span>
                                    : panIsFull
                                        ? <span className="text-xs text-yellow-700 font-semibold">Pan is full! Start panning to make room.</span>
                                        : !hasSluiceBox && !panHasRoomForBucket && bucketFilled > 0
                                            ? <span className="text-xs text-yellow-700 font-semibold">Pan needs {(panFilled + bucketFilled - effectivePanCap).toFixed(1)} more space — pan some dirt first.</span>
                                            : null
                                }
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

                {/* Furnace Section */}
                {hasFurnace && (
                    <div className="p-4 bg-white border-2 border-orange-300 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-orange-900">🔥 Furnace</h3>
                            <span className="text-xs text-orange-600">
                                {SMELT_RATE_BASE * furnaceGear} oz/sec
                            </span>
                        </div>

                        {/* Furnace fill progress bar */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-orange-700 font-semibold">Loaded</span>
                                <span className="text-xs text-orange-700 font-semibold">{furnaceFilled.toFixed(1)} / {FURNACE_CAPACITY} oz</span>
                            </div>
                            <ProgressBar value={furnaceFilled} max={FURNACE_CAPACITY} color="amber" isActive={furnaceRunning} isFull={furnaceFilled >= FURNACE_CAPACITY} />
                        </div>

                        {/* Load and switch buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={loadFurnace}
                                disabled={isTraveling || gold <= 0 || furnaceFilled >= FURNACE_CAPACITY}
                                className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                🔥 Load ({Math.min(gold, FURNACE_CAPACITY - furnaceFilled).toFixed(1)} oz)
                            </button>
                            <button
                                onClick={toggleFurnace}
                                disabled={isTraveling || furnaceFilled <= 0}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    furnaceRunning
                                        ? 'bg-red-100 hover:bg-red-200 text-red-800 border-red-300'
                                        : 'bg-green-100 hover:bg-green-200 text-green-800 border-green-300'
                                }`}
                            >
                                {furnaceRunning ? '⏹ Off' : '▶ On'}
                            </button>
                        </div>

                        {/* Gold flakes hint */}
                        {gold > 0 && (
                            <p className="text-xs text-orange-600 text-center">
                                {gold.toFixed(2)} oz flakes ready to load
                            </p>
                        )}

                        {/* Bars ready to collect */}
                        {furnaceBars > 0 && (
                            <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <span className="text-sm font-semibold text-amber-800">🧱 {furnaceBars.toFixed(2)} oz bars ready</span>
                                <button
                                    onClick={collectBars}
                                    disabled={isTraveling}
                                    className="px-3 py-1 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Collect
                                </button>
                            </div>
                        )}

                        {/* Gold bars in inventory */}
                        {goldBars > 0 && (
                            <p className="text-xs text-amber-700 text-center font-semibold">
                                🧱 {goldBars.toFixed(2)} oz bars in inventory — travel to Town to sell
                            </p>
                        )}

                        {furnaceWorkers > 0 && (
                            <p className="text-xs text-orange-500 text-center">
                                Furnace Operators are auto-loading, smelting &amp; collecting
                            </p>
                        )}
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

            {/* Payroll widget — shows when any workers are hired */}
            {payrollPerMin > 0 && (
                <PayrollWidget
                    payrollPerMin={payrollPerMin}
                    bankerIncomePerMin={bankerIncomePerMin}
                />
            )}

            {/* Hint: earn gold to travel */}
            {!unlockedTown && gold < 0.5 && unlockedPanning && (
                <div className="text-sm text-amber-700 italic text-center p-3 bg-amber-100 rounded-xl">
                    Pan gold to 0.5 oz and you can travel to Town!
                </div>
            )}

            {/* Dev debug overlay (#30) */}
            {devMode && (
                <div className="p-4 bg-zinc-100 dark:bg-zinc-900 border-2 border-dashed border-zinc-400 dark:border-zinc-600 rounded-xl space-y-3 text-xs font-mono">
                    <h3 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide text-xs">🛠️ Debug</h3>
                    <div>
                        <div className="flex justify-between mb-1 text-zinc-600 dark:text-zinc-400">
                            <span>Bucket</span>
                            <span>{bucketFilled.toFixed(2)} / {effectiveBucketCap}</span>
                        </div>
                        <ProgressBar value={bucketFilled} max={effectiveBucketCap} />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1 text-zinc-600 dark:text-zinc-400">
                            <span>Pan</span>
                            <span>{panFilled.toFixed(2)} / {effectivePanCap}</span>
                        </div>
                        <ProgressBar value={panFilled} max={effectivePanCap} />
                    </div>
                    {hasDriver && (
                        <div>
                            <div className="flex justify-between mb-1 text-zinc-600 dark:text-zinc-400">
                                <span>Driver Trip</span>
                                <span>{driverTripTicks} / {getTravelDurationTicks(vehicleTier)}</span>
                            </div>
                            <ProgressBar value={driverTripTicks} max={getTravelDurationTicks(vehicleTier)} />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-zinc-600 dark:text-zinc-400">
                        <span>Tick</span><span className="text-zinc-900 dark:text-zinc-100">{tickCount}</span>
                        <span>Gold $/oz</span><span className="text-zinc-900 dark:text-zinc-100">{goldPrice.toFixed(3)}</span>
                        <span>Price age</span><span className="text-zinc-900 dark:text-zinc-100">{tickCount - lastGoldPriceUpdate} ticks</span>
                        <span>Paused</span><span className="text-zinc-900 dark:text-zinc-100">{isPaused ? 'yes' : 'no'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function PayrollWidget({ payrollPerMin, bankerIncomePerMin }: { payrollPerMin: number; bankerIncomePerMin: number }) {
    const [open, setOpen] = useState(false);
    const netPerMin = bankerIncomePerMin - payrollPerMin;
    const netColor = netPerMin >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400';

    return (
        <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between"
            >
                <span className="font-semibold text-gray-700 dark:text-gray-300">📊 Workers</span>
                <span className="flex items-center gap-2">
                    <span className={`font-semibold tabular-nums ${netColor}`}>
                        {netPerMin >= 0 ? '+' : ''}{formatNumber(netPerMin)}/min
                    </span>
                    <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
                </span>
            </button>
            {open && (
                <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                    {bankerIncomePerMin > 0 && (
                        <div className="flex justify-between text-green-700 dark:text-green-400">
                            <span>🏦 Banker sales</span>
                            <span className="tabular-nums font-semibold">+${formatNumber(bankerIncomePerMin)}/min</span>
                        </div>
                    )}
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                        <span>👷 Payroll</span>
                        <span className="tabular-nums font-semibold">−${formatNumber(payrollPerMin)}/min</span>
                    </div>
                    <div className={`flex justify-between font-bold border-t border-gray-100 dark:border-gray-700 pt-1 ${netColor}`}>
                        <span>Net</span>
                        <span className="tabular-nums">{netPerMin >= 0 ? '+' : ''}{formatNumber(netPerMin)}/min</span>
                    </div>
                </div>
            )}
        </div>
    );
}

