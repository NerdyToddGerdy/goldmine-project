import { gameStore, useGameStore, BASE_EXTRACTION, EQUIPMENT, getEffectiveBucketCapacity, getEffectivePanCapacity, VEHICLE_TIERS, getTravelDurationTicks, FURNACE_CAPACITY, SMELT_RATE_BASE, getDriverCapacity, getAssignedPower, countAssigned, SLUICE_EXTRACTION_RATE, GOLD_BAR_CERTIFIED_BONUS, getSettlementStage, FLAKES_HAUL_FEE } from "../store/gameStore";
import { ProgressBar, Tooltip } from "./ui";
import { Roster } from "./HiringHall";
import { formatNumber } from "../utils/format";
import { useShallow } from "zustand/react/shallow";

export function Mine() {
    const {
        bucketFilled, panFilled, sluiceBoxFilled, minersMossFilled,
        gold, scoopPower, panPower, unlockedPanning, unlockedTown,
        hasSluiceBox, sluiceGear, hasFurnace, employees,
        bucketUpgrades, panCapUpgrades, vehicleTier, seasonNumber,
        isTraveling, travelProgress, travelDestination,
        furnaceGear, devMode, tickCount,
        driverTripTicks, hasDriver, isPaused,
        hasMetalDetector, richDirtInBucket,
        detectProgress, detectTarget, patchActive, patchRemaining, patchCapacity,
        furnaceFilled, furnaceRunning, furnaceBars, goldBars, goldBarsCertified,
        driverCarryingFlakes, driverCarryingBars, driverCapUpgrades,
    } = useGameStore(useShallow((s) => ({
        bucketFilled: s.bucketFilled, panFilled: s.panFilled,
        sluiceBoxFilled: s.sluiceBoxFilled, minersMossFilled: s.minersMossFilled,
        gold: s.gold, scoopPower: s.scoopPower, panPower: s.panPower,
        unlockedPanning: s.unlockedPanning, unlockedTown: s.unlockedTown,
        hasSluiceBox: s.hasSluiceBox, sluiceGear: s.sluiceGear,
        hasFurnace: s.hasFurnace, employees: s.employees,
        bucketUpgrades: s.bucketUpgrades, panCapUpgrades: s.panCapUpgrades,
        vehicleTier: s.vehicleTier, seasonNumber: s.seasonNumber,
        isTraveling: s.isTraveling, travelProgress: s.travelProgress,
        travelDestination: s.travelDestination,
        furnaceGear: s.furnaceGear, devMode: s.devMode, tickCount: s.tickCount,
        driverTripTicks: s.driverTripTicks, hasDriver: s.hasDriver, isPaused: s.isPaused,
        hasMetalDetector: s.hasMetalDetector, richDirtInBucket: s.richDirtInBucket,
        detectProgress: s.detectProgress, detectTarget: s.detectTarget,
        patchActive: s.patchActive, patchRemaining: s.patchRemaining, patchCapacity: s.patchCapacity,
        furnaceFilled: s.furnaceFilled, furnaceRunning: s.furnaceRunning,
        furnaceBars: s.furnaceBars, goldBars: s.goldBars, goldBarsCertified: s.goldBarsCertified,
        driverCarryingFlakes: s.driverCarryingFlakes, driverCarryingBars: s.driverCarryingBars,
        driverCapUpgrades: s.driverCapUpgrades,
    })));

    const settlementName = getSettlementStage(seasonNumber).name;
    const effectiveBucketCap = getEffectiveBucketCapacity(bucketUpgrades);
    const effectivePanCap = getEffectivePanCapacity(panCapUpgrades);
    // Travel progress bar calculations
    const TRAVEL_EMOJIS = { 0: '🚶', 1: '🐴', 2: '🚂', 3: '🚛' } as const;
    const totalTravelTicks = getTravelDurationTicks(vehicleTier);
    const travelPct = totalTravelTicks > 0 ? Math.min(100, (travelProgress / totalTravelTicks) * 100) : 0;
    const secsRemaining = Math.ceil((totalTravelTicks - travelProgress) / 60);
    const vehicleEmoji = TRAVEL_EMOJIS[vehicleTier as 0|1|2|3];

    const scoopDirt = () => gameStore.getState().scoopDirt();
    const emptyBucket = () => gameStore.getState().emptyBucket();
    const detectPatch = () => gameStore.getState().detectPatch();
    const cleanMoss = () => gameStore.getState().cleanMoss();
    const panForGold = () => gameStore.getState().panForGold();
    const loadFurnace = () => gameStore.getState().loadFurnace();
    const toggleFurnace = () => gameStore.getState().toggleFurnace();
    const collectBars = () => gameStore.getState().collectBars();
    const travelToTown = () => gameStore.getState().startTravel('town');

    // Manual actions now benefit from gear upgrades
    let extractionRate = BASE_EXTRACTION;
    extractionRate += getAssignedPower(employees, 'sluiceOperator') * SLUICE_EXTRACTION_RATE * sluiceGear;

    const goldPerPan = panPower * extractionRate;

    const bucketIsFull = bucketFilled >= effectiveBucketCap;
    const panIsFull = panFilled >= effectivePanCap;
    const panHasRoomForBucket = panFilled + bucketFilled <= effectivePanCap;
    const sluiceIsDraining = sluiceBoxFilled > 0;
    const sluiceHasSpace = sluiceBoxFilled + bucketFilled <= effectivePanCap;
    const mossCapacity = effectivePanCap; // same formula as pan
    const mossIsFull = minersMossFilled >= mossCapacity;

    // Pulse ring — single most-actionable button at any progression stage (#86)
    const miners = countAssigned(employees, 'miner');
    type PulseTarget = 'scoop' | 'empty' | 'pan' | 'travel' | null;
    let pulseTarget: PulseTarget = null;
    if (!isTraveling) {
        if (bucketFilled === 0 && miners === 0) pulseTarget = 'scoop';
        else if (bucketIsFull && unlockedPanning) pulseTarget = 'empty';
        else if (panFilled >= 1 && unlockedPanning) pulseTarget = 'pan';
        else if (gold > 0.5 && !unlockedTown) pulseTarget = 'travel';
    }
    const pulse = (t: PulseTarget) =>
        pulseTarget === t ? ' ring-2 ring-amber-400 ring-offset-2 motion-safe:animate-pulse' : '';


    return (
        <div className="space-y-6">
            <h2 className="font-arcade text-sm text-amber-900">⛏️ The Mine</h2>

            {/* Travel to Town — shown once player has panned gold; transforms into progress bar while traveling */}
            {(unlockedTown || gold > 0) && (
                <div className="p-3 bg-white border border-green-200 rounded-xl">
                    {isTraveling && travelDestination === 'town' ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-green-900 text-sm">
                                    {vehicleEmoji} To {settlementName}… ({VEHICLE_TIERS[vehicleTier as 0|1|2|3].name})
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
                        <div className="space-y-2">
                            <button
                                onClick={travelToTown}
                                disabled={isTraveling}
                                className={`w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed${pulse('travel')}`}
                            >
                                🏘️ Travel to {settlementName} ({VEHICLE_TIERS[vehicleTier as 0|1|2|3].travelSecs}s)
                            </button>
                        </div>
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
                                isActive={countAssigned(employees, 'detectorOperator') > 0 && !isTraveling}
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
                    <div className="pt-1 border-t border-violet-100">
                        <Roster roles={['detectorOperator']} />
                    </div>
                </div>
            )}

            {/* Driver Status Card */}
            {hasDriver && (() => {
                const tripDuration = getTravelDurationTicks(vehicleTier);
                const capacity = getDriverCapacity(driverCapUpgrades);
                const tripSecs = Math.round(tripDuration / 60);
                const isOutbound = driverTripTicks > 0 && driverTripTicks <= tripDuration;
                const isReturning = driverTripTicks > tripDuration;
                const phaseLabel = isOutbound
                    ? `🚗 To Bank (${Math.ceil((tripDuration - driverTripTicks) / 60)}s)`
                    : isReturning
                    ? `↩️ Returning (${Math.ceil((tripDuration * 2 - driverTripTicks) / 60)}s)`
                    : '💤 Waiting for gold…';
                const barValue = isOutbound ? driverTripTicks : isReturning ? driverTripTicks - tripDuration : 0;
                return (
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-yellow-900">🚗 Driver</h3>
                            <span className="text-xs text-yellow-700">{capacity} oz cap · {tripSecs}s trip</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-yellow-800">
                            <span>{phaseLabel}</span>
                            {isOutbound && (driverCarryingBars > 0 || driverCarryingFlakes > 0) && (
                                <span className="font-semibold">
                                    {driverCarryingBars > 0 && `${formatNumber(driverCarryingBars)} oz bars`}
                                    {driverCarryingBars > 0 && driverCarryingFlakes > 0 && ' + '}
                                    {driverCarryingFlakes > 0 && (
                                        <span>
                                            {formatNumber(driverCarryingFlakes)} oz flakes
                                            <span className="text-red-600 ml-1">(−{(FLAKES_HAUL_FEE * 100).toFixed(0)}%)</span>
                                        </span>
                                    )}
                                </span>
                            )}
                        </div>
                        {driverTripTicks > 0 && (
                            <ProgressBar
                                value={barValue}
                                max={tripDuration}
                                color="amber"
                                isActive={true}
                            />
                        )}
                    </div>
                );
            })()}

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
                        <ProgressBar value={bucketFilled} max={effectiveBucketCap} color="amber" isActive={countAssigned(employees, 'miner') > 0 && !bucketIsFull} isFull={bucketIsFull} />
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
                        className={`w-full px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed${pulse('scoop')}`}
                    >
                        🪨 Scoop Dirt (+{scoopPower.toFixed(1)}){patchActive ? ' ✨ Rich' : ''}
                    </button>

                    {/* Empty Bucket Button */}
                    {unlockedPanning && (
                        <button
                            onClick={emptyBucket}
                            disabled={bucketFilled === 0 || isTraveling || (hasSluiceBox ? !sluiceHasSpace : !panHasRoomForBucket)}
                            className={`w-full px-6 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed${pulse('empty')}`}
                        >
                            {hasSluiceBox
                                ? `🪣 Empty Bucket → Sluice (+${bucketFilled.toFixed(1)})`
                                : `🪣 Empty Bucket → Pan (+${bucketFilled.toFixed(1)})`
                            }
                        </button>
                    )}

                    <div className="pt-1 border-t border-amber-100">
                        <Roster roles={['miner', 'hauler']} />
                    </div>
                </div>

                {/* Sluice Box Section */}
                {unlockedPanning && hasSluiceBox && (
                    <div className="p-4 bg-white border-2 border-cyan-300 rounded-xl space-y-3">
                        {/* Sluice Drain Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Tooltip content={<>Sluice gear ×{sluiceGear} — adds {(getAssignedPower(employees, 'sluiceOperator') * SLUICE_EXTRACTION_RATE * sluiceGear).toFixed(4)} to extraction rate per sluice operator power</>}>
                                    <span className="text-sm font-semibold text-cyan-900 underline decoration-dotted cursor-help">🚿 Sluice Box</span>
                                </Tooltip>
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
                            🌿 Clean Moss → Pan (+3 paydirt)
                        </button>
                        <div className="pt-1 border-t border-cyan-100">
                            <Roster roles={['sluiceOperator']} />
                        </div>
                    </div>
                )}

                {/* Pan Section */}
                {unlockedPanning && (
                    <div className="p-4 bg-white border-2 border-yellow-300 rounded-xl space-y-3">
                        {/* Pan Progress Bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Tooltip content={<>Pan power ×{panPower.toFixed(2)} — scales gold per pan click. Base extract: {BASE_EXTRACTION.toFixed(3)}</>}>
                                    <span className="text-sm font-semibold text-yellow-900 underline decoration-dotted cursor-help">
                                        🥘 Pan
                                    </span>
                                </Tooltip>
                                <span className="text-sm font-semibold text-yellow-700">
                                    {panFilled.toFixed(1)} / {effectivePanCap}
                                </span>
                            </div>
                            <ProgressBar value={panFilled} max={effectivePanCap} color="yellow" isActive={countAssigned(employees, 'prospector') > 0 && !panIsFull} isFull={panIsFull} />
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
                            disabled={panFilled <= 0 || isTraveling}
                            className={`w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed${pulse('pan')}`}
                        >
                            ✨ Pan for Gold (-1,{' '}
                            <Tooltip content={<>Pan power ×{panPower.toFixed(2)} · base extract {BASE_EXTRACTION.toFixed(3)}{extractionRate > BASE_EXTRACTION ? ` + sluice ${(extractionRate - BASE_EXTRACTION).toFixed(3)}` : ''}</>}>
                                <span className="underline decoration-dotted decoration-white/60 cursor-help">+{goldPerPan.toFixed(2)} gold</span>
                            </Tooltip>
                            )
                        </button>

                        <div className="pt-1 border-t border-yellow-100">
                            <Roster roles={['prospector']} />
                        </div>
                    </div>
                )}

                {/* Furnace Section */}
                {hasFurnace && (
                    <div className="p-4 bg-white border-2 border-orange-300 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-orange-900">🔥 Furnace</h3>
                            <Tooltip content={<>Smelt rate: {SMELT_RATE_BASE} base × {furnaceGear} gear = {SMELT_RATE_BASE * furnaceGear} oz/sec</>}>
                                <span className="text-xs text-orange-600 underline decoration-dotted cursor-help">
                                    {SMELT_RATE_BASE * furnaceGear} oz/sec
                                </span>
                            </Tooltip>
                        </div>

                        {/* Flakes → Bars value note */}
                        <p className="text-xs text-orange-500">
                            ✨ Flakes → 🧱 Bars — bars avoid the {(FLAKES_HAUL_FEE * 100).toFixed(0)}% driver haul fee
                        </p>

                        {/* Furnace fill progress bar */}
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-orange-700 font-semibold">Smelting</span>
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
                                🔥 Load flakes ({Math.min(gold, FURNACE_CAPACITY - furnaceFilled).toFixed(1)} oz)
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

                        {/* Gold flakes available */}
                        {gold > 0 && (
                            <p className="text-xs text-orange-600 text-center">
                                {gold.toFixed(2)} oz flakes on hand
                            </p>
                        )}

                        {/* Bars ready to carry / certify / collect */}
                        {(furnaceBars > 0 || goldBars > 0 || goldBarsCertified > 0) && (
                            <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="text-sm font-semibold text-amber-800">
                                    <div>🧱 {(furnaceBars + goldBars).toFixed(2)} oz bars</div>
                                    {goldBarsCertified > 0 && (
                                        <div className="text-xs text-amber-600">⚖️ {goldBarsCertified.toFixed(2)} oz certified → {(goldBarsCertified * GOLD_BAR_CERTIFIED_BONUS).toFixed(2)} oz</div>
                                    )}
                                    {goldBars > 0 && hasDriver && (
                                        <div className="text-xs text-green-600">Driver will carry bars at full value</div>
                                    )}
                                </div>
                                <button
                                    onClick={collectBars}
                                    disabled={isTraveling}
                                    className="px-3 py-1 text-sm font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Collect
                                </button>
                            </div>
                        )}

                        {countAssigned(employees, 'furnaceOperator') > 0 && (
                            <p className="text-xs text-orange-500 text-center">
                                Furnace Operators are auto-loading, smelting &amp; collecting
                            </p>
                        )}
                        <div className="pt-1 border-t border-orange-100">
                            <Roster roles={['furnaceOperator']} />
                        </div>
                    </div>
                )}

                {/* Contextual tips */}
                {(() => {
                    const tips = [
                        { show: !unlockedPanning,
                          text: '⛏️ Fill the bucket to start panning!', amber: true },
                        { show: unlockedPanning && !hasSluiceBox && gold >= EQUIPMENT.sluiceBox.cost,
                          text: `💡 You can afford the Sluice Box! Buy it in Town → Blacksmith → Equipment.` },
                        { show: unlockedPanning && !hasSluiceBox,
                          text: `💡 Save up ${EQUIPMENT.sluiceBox.cost} oz for the Sluice Box in Town — concentrates dirt into richer paydirt (3 paydirt per click vs 1).` },
                        { show: hasSluiceBox && countAssigned(employees, 'miner') === 0 && countAssigned(employees, 'prospector') === 0,
                          text: '💡 Hire Miners and Prospectors in Town → Tavern → Hiring Hall to automate the mine.' },
                        { show: hasSluiceBox && countAssigned(employees, 'miner') === 0,
                          text: '💡 Hire a Miner in Town → Tavern → Hiring Hall to auto-fill the bucket.' },
                        { show: hasSluiceBox && countAssigned(employees, 'prospector') === 0,
                          text: '💡 Hire a Prospector in Town → Tavern → Hiring Hall to auto-pan gold.' },
                        { show: hasSluiceBox && countAssigned(employees, 'sluiceOperator') === 0 && countAssigned(employees, 'miner') > 0 && countAssigned(employees, 'prospector') > 0,
                          text: '💡 Hire a Sluice Operator in Town → Tavern → Hiring Hall to boost gold extraction and auto-clean the moss.' },
                        { show: !hasMetalDetector && hasSluiceBox && gold >= EQUIPMENT.metalDetector.cost,
                          text: `💡 You can afford a Metal Detector (${EQUIPMENT.metalDetector.cost} oz) — finds rich dirt patches for better yields.` },
                        { show: !hasFurnace && hasSluiceBox && gold > 2,
                          text: '💡 A Furnace smelts gold flakes into bars — certify them at the Assayer for a 20% bonus. Buy in Town → Blacksmith → Equipment.' },
                        { show: hasFurnace && !hasDriver && vehicleTier >= 2,
                          text: '💡 Hire a Driver in Town → Tavern to automatically haul your gold.' },
                        { show: !hasDriver && gold > 0.5 && unlockedTown && !isTraveling,
                          text: '💡 Head to Town to spend your gold on upgrades and workers.' },
                    ];
                    const tip = tips.find(t => t.show);
                    if (!tip) return null;
                    return (
                        <div className={`text-sm italic text-center p-3 rounded-xl ${
                            tip.amber
                                ? 'text-amber-700'
                                : 'text-blue-700 bg-blue-50 border border-blue-200'
                        }`}>
                            {tip.text}
                        </div>
                    );
                })()}
            </div>

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
                        <span>Gold (oz)</span><span className="text-zinc-900 dark:text-zinc-100">{gold.toFixed(3)}</span>
                        <span>Paused</span><span className="text-zinc-900 dark:text-zinc-100">{isPaused ? 'yes' : 'no'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}


