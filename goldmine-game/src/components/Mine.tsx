import { useState, useRef } from 'react';
import { gameStore, useGameStore, BASE_EXTRACTION, getEffectiveBucketCapacity, getEffectivePanCapacity, VEHICLE_TIERS, getTravelDurationTicks, FURNACE_CAPACITY, SMELT_RATE_BASE, DRIVER_BASE_CAPACITY, DRIVER_CAP_RATE, getAssignedPower, countAssigned, SLUICE_EXTRACTION_RATE, GOLD_BAR_CERTIFIED_BONUS, getSettlementStage, getSeasonGoal, FLAKES_HAUL_FEE, SLUICE_CONVERSION_RATIO, PAYDIRT_YIELD_MULTIPLIER, FUEL_TANK_CAP, EXCAVATOR_MINE_MULT, WASHPLANT_SLUICE_MULT } from "../store/gameStore";
import { ProgressBar, Tooltip, SpriteAnimation } from "./ui";
import minerWalkSrc from '../assets/miner-walk.png';
import minerDigSrc from '../assets/miner-dig.png';
import { Roster } from "./HiringHall";
import { formatNumber } from "../utils/format";
import { useShallow } from "zustand/react/shallow";

export function Mine() {
    const {
        bucketFilled, panFilled, sluiceBoxFilled, minersMossFilled,
        gold, goldAtMine, scoopPower, panPower, unlockedPanning, unlockedTown,
        hasSluiceBox, sluiceGear, hasFurnace, employees,
        bucketUpgrades, panCapUpgrades, vehicleTier, seasonNumber, runGoldMined,
        isTraveling, travelProgress, travelDestination,
        furnaceGear, devMode, tickCount,
        driverTripTicks, isPaused,
        hasMetalDetector, richDirtInBucket,
        detectProgress, detectTarget, patchActive, patchRemaining, patchCapacity,
        furnaceFilled, furnaceRunning, furnaceBars, goldBarsAtMine, goldBarsCertified,
        driverCarryingFlakes, driverCarryingBars,
        hasExcavator, hasWashplant, fuelTank,
    } = useGameStore(useShallow((s) => ({
        bucketFilled: s.bucketFilled, panFilled: s.panFilled,
        sluiceBoxFilled: s.sluiceBoxFilled, minersMossFilled: s.minersMossFilled,
        gold: s.gold, goldAtMine: s.goldAtMine, scoopPower: s.scoopPower, panPower: s.panPower,
        unlockedPanning: s.unlockedPanning, unlockedTown: s.unlockedTown,
        hasSluiceBox: s.hasSluiceBox, sluiceGear: s.sluiceGear,
        hasFurnace: s.hasFurnace, employees: s.employees,
        bucketUpgrades: s.bucketUpgrades, panCapUpgrades: s.panCapUpgrades,
        vehicleTier: s.vehicleTier, seasonNumber: s.seasonNumber, runGoldMined: s.runGoldMined,
        isTraveling: s.isTraveling, travelProgress: s.travelProgress,
        travelDestination: s.travelDestination,
        furnaceGear: s.furnaceGear, devMode: s.devMode, tickCount: s.tickCount,
        driverTripTicks: s.driverTripTicks, isPaused: s.isPaused,
        hasMetalDetector: s.hasMetalDetector, richDirtInBucket: s.richDirtInBucket,
        detectProgress: s.detectProgress, detectTarget: s.detectTarget,
        patchActive: s.patchActive, patchRemaining: s.patchRemaining, patchCapacity: s.patchCapacity,
        furnaceFilled: s.furnaceFilled, furnaceRunning: s.furnaceRunning,
        furnaceBars: s.furnaceBars, goldBarsAtMine: s.goldBarsAtMine, goldBarsCertified: s.goldBarsCertified,
        driverCarryingFlakes: s.driverCarryingFlakes, driverCarryingBars: s.driverCarryingBars,
        hasExcavator: s.hasExcavator, hasWashplant: s.hasWashplant, fuelTank: s.fuelTank,
    })));

    const settlementName = getSettlementStage(seasonNumber).name;
    const seasonGoal = getSeasonGoal(seasonNumber);
    const seasonPct = Math.min(100, (runGoldMined / seasonGoal) * 100);
    const nearEnd = seasonPct >= 70;
    const effectiveBucketCap = getEffectiveBucketCapacity(bucketUpgrades);
    const effectivePanCap = getEffectivePanCapacity(panCapUpgrades);
    const TRAVEL_EMOJIS = { 0: '🚶', 1: '🐴', 2: '🚂', 3: '🚛' } as const;
    const totalTravelTicks = getTravelDurationTicks(vehicleTier);
    const travelPct = totalTravelTicks > 0 ? Math.min(100, (travelProgress / totalTravelTicks) * 100) : 0;
    const secsRemaining = Math.ceil((totalTravelTicks - travelProgress) / 60);
    const vehicleEmoji = TRAVEL_EMOJIS[vehicleTier as 0|1|2|3];

    const [scoopAnimating, setScoopAnimating] = useState(false);
    const scoopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scoopDirt = () => {
        gameStore.getState().scoopDirt();
        if (scoopTimerRef.current) clearTimeout(scoopTimerRef.current);
        setScoopAnimating(true);
        scoopTimerRef.current = setTimeout(() => setScoopAnimating(false), 700);
    };
    const emptyBucket = () => gameStore.getState().emptyBucket();
    const detectPatch = () => gameStore.getState().detectPatch();
    const cleanMoss = () => gameStore.getState().cleanMoss();
    const panForGold = () => gameStore.getState().panForGold();
    const loadFurnace = () => gameStore.getState().loadFurnace();
    const toggleFurnace = () => gameStore.getState().toggleFurnace();
    const collectBars = () => gameStore.getState().collectBars();
    const travelToTown = () => gameStore.getState().startTravel('town');

    let extractionRate = BASE_EXTRACTION;
    extractionRate += getAssignedPower(employees, 'sluiceOperator') * SLUICE_EXTRACTION_RATE * sluiceGear;

    const goldPerPan = panPower * extractionRate;
    const driverPower = getAssignedPower(employees, 'driver');

    const bucketIsFull = bucketFilled >= effectiveBucketCap;
    const panIsFull = panFilled >= effectivePanCap;
    const panHasRoomForBucket = panFilled + bucketFilled <= effectivePanCap;
    const sluiceIsDraining = sluiceBoxFilled > 0;
    const sluiceHasSpace = sluiceBoxFilled + bucketFilled <= effectivePanCap;
    const mossCapacity = effectivePanCap;
    const mossIsFull = minersMossFilled >= mossCapacity;

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
        pulseTarget === t ? ' ring-2 ring-frontier-nugget ring-offset-1 ring-offset-frontier-coal/50 motion-safe:animate-pulse' : '';


    return (
        <div className="space-y-6">
            <h2 className="font-display text-base text-frontier-bone">⛏️ The Mine</h2>

            {/* Season progress */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-frontier-sage">
                    <span className="font-semibold">Season earnings</span>
                    <span className="font-body">{runGoldMined.toFixed(0)} oz / {seasonGoal.toLocaleString()} oz</span>
                </div>
                <div className="relative h-3 rounded-sm overflow-hidden border" style={{ background: 'linear-gradient(to bottom, #0e1a08, #1a2e0f)', borderColor: 'var(--fw-pine)' }}>
                    <div
                        className={`h-full transition-all duration-300 ${nearEnd ? 'bg-gradient-to-r from-blue-700 to-indigo-800' : 'frontier-progress-fill-sage'}`}
                        style={{ width: `${seasonPct}%` }}
                    />
                    {nearEnd && (
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs leading-none">❄️</span>
                    )}
                </div>
            </div>

            {/* Travel to Town */}
            {(unlockedTown || gold > 0) && (
                <div className="frontier-panel p-3">
                    {isTraveling && travelDestination === 'town' ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-semibold text-frontier-bone text-sm">
                                    {vehicleEmoji} To {settlementName}… ({VEHICLE_TIERS[vehicleTier as 0|1|2|3].name})
                                </span>
                                <button
                                    onClick={() => gameStore.getState().cancelTravel()}
                                    className="frontier-btn-danger text-xs px-3 py-1"
                                >
                                    Cancel
                                </button>
                            </div>
                            <div className="relative h-14">
                                <div className="absolute inset-0 frontier-progress-track rounded-sm overflow-hidden">
                                    <div
                                        className="h-full frontier-progress-fill-sage transition-all duration-100"
                                        style={{ width: `${travelPct}%` }}
                                    />
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-frontier-bone drop-shadow-sm">{secsRemaining}s</span>
                                </div>
                                <SpriteAnimation
                                    src={minerWalkSrc}
                                    frameWidth={352} frameHeight={256}
                                    totalWidth={1408} totalHeight={768}
                                    frameCount={4}
                                    rowIndex={travelDestination === 'town' ? 1 : 2}
                                    fps={8}
                                    displayHeight={56}
                                    playing={true}
                                    className="absolute pointer-events-none transition-all duration-100"
                                    style={{ left: `${travelPct}%`, top: '50%', transform: 'translateX(-50%) translateY(-50%)' }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <button
                                onClick={travelToTown}
                                disabled={isTraveling}
                                className={`w-full frontier-btn-primary disabled:opacity-50 disabled:cursor-not-allowed${pulse('travel')}`}
                                style={{ background: 'linear-gradient(to bottom, var(--fw-sage), var(--fw-pine))', borderColor: 'var(--fw-pine)' }}
                            >
                                🏘️ Travel to {settlementName} ({VEHICLE_TIERS[vehicleTier as 0|1|2|3].travelSecs}s)
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Metal Detector Section */}
            {hasMetalDetector && (
                <div className="frontier-panel space-y-3">
                    <div>
                        <h3 className="text-sm font-semibold text-frontier-dust">🔍 Metal Detector</h3>
                        <p className="text-xs text-frontier-iron mt-0.5">Locates rich dirt patches — rich dirt yields more gold per unit than regular dirt</p>
                    </div>

                    {patchActive ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-frontier-bone">⛏️ Rich Patch Found!</span>
                                <span className="text-sm font-semibold text-frontier-dust">{patchRemaining.toFixed(1)} / {patchCapacity} remaining</span>
                            </div>
                            <ProgressBar value={patchCapacity - patchRemaining} max={patchCapacity} color="violet" isActive={true} />
                            <p className="text-xs text-frontier-dust text-center">Scoop to harvest rich dirt — miners prioritize this patch</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-frontier-bone">Searching…</span>
                                <span className="text-sm font-semibold text-frontier-dust">
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
                                className="w-full frontier-btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                style={{ background: 'linear-gradient(to bottom, var(--fw-dust), var(--fw-iron))', borderColor: 'var(--fw-iron)' }}
                            >
                                🔍 Detect{detectTarget === 0 ? ' — Start Search' : ' (+1)'}
                            </button>
                        </div>
                    )}
                    {employees.length > 0 && (
                        <div className="pt-1 border-t border-frontier-iron/20">
                            <Roster roles={['detectorOperator']} />
                        </div>
                    )}
                </div>
            )}

            {/* Transport Section */}
            {hasSluiceBox && (() => {
                const driverPower = getAssignedPower(employees, 'driver');
                const tripDuration = getTravelDurationTicks(vehicleTier);
                const capacity = DRIVER_BASE_CAPACITY + driverPower * DRIVER_CAP_RATE;
                const isOutbound = driverTripTicks > 0 && driverTripTicks <= tripDuration;
                const isReturning = driverTripTicks > tripDuration;
                const barValue = isOutbound ? driverTripTicks : isReturning ? driverTripTicks - tripDuration : 0;
                return (
                    <div className="frontier-panel space-y-3">
                        <div>
                            <h3 className="text-sm font-semibold text-frontier-dust">🤠 Transport</h3>
                            <p className="text-xs text-frontier-iron mt-0.5">
                                Automatically hauls gold to town — capacity grows with driver level
                            </p>
                        </div>
                        {driverPower > 0 && driverTripTicks > 0 && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-frontier-aged">
                                    <span>
                                        {isOutbound
                                            ? `🚗 To Town (${Math.ceil((tripDuration - driverTripTicks) / 60)}s)`
                                            : `↩️ Returning (${Math.ceil((tripDuration * 2 - driverTripTicks) / 60)}s)`}
                                    </span>
                                    {isOutbound && (driverCarryingBars > 0 || driverCarryingFlakes > 0) && (
                                        <span className="font-semibold">
                                            {driverCarryingBars > 0 && `${formatNumber(driverCarryingBars)} oz bars`}
                                            {driverCarryingBars > 0 && driverCarryingFlakes > 0 && ' + '}
                                            {driverCarryingFlakes > 0 && (
                                                <span>
                                                    {formatNumber(driverCarryingFlakes)} oz flakes
                                                    <span className="text-frontier-rust ml-1">(−{(FLAKES_HAUL_FEE * 100).toFixed(0)}%)</span>
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </div>
                                <ProgressBar value={barValue} max={tripDuration} color="amber" isActive={true} />
                            </div>
                        )}
                        {driverPower > 0 && (
                            <p className="text-xs text-frontier-dust">
                                Capacity: {capacity.toFixed(1)} oz · Trip: {Math.round(tripDuration / 60)}s
                            </p>
                        )}
                        {employees.length > 0 && (
                            <div className="pt-1 border-t border-frontier-iron/20">
                                <Roster roles={['driver']} />
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Manual Actions */}
            <div className="space-y-3">
                <h3 className="font-display text-sm text-frontier-bone tracking-wide">Actions</h3>

                {/* Bucket Section */}
                <div className="frontier-panel space-y-3">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-frontier-bone">🪣 Bucket</span>
                            <span className="text-sm font-semibold text-frontier-ember">
                                {bucketFilled.toFixed(1)} / {effectiveBucketCap}
                            </span>
                        </div>
                        <ProgressBar value={bucketFilled} max={effectiveBucketCap} color="amber" isActive={countAssigned(employees, 'miner') > 0 && !bucketIsFull} isFull={bucketIsFull} />
                        <div className="h-5 mt-1 flex items-center justify-center">
                            {isTraveling
                                ? <span className="text-xs text-frontier-dust font-semibold">🚗 Locked while traveling</span>
                                : bucketIsFull
                                    ? <span className="text-xs text-frontier-ember font-semibold">Bucket is full! Empty it to continue scooping.</span>
                                    : patchActive && richDirtInBucket > 0
                                        ? <span className="text-xs text-frontier-nugget font-semibold">✨ {richDirtInBucket.toFixed(1)} rich dirt in bucket</span>
                                        : null
                            }
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <SpriteAnimation
                            src={minerDigSrc}
                            frameWidth={342} frameHeight={768}
                            totalWidth={1368} totalHeight={768}
                            frameCount={4}
                            rowIndex={0}
                            fps={6}
                            displayHeight={80}
                            playing={scoopAnimating}
                            style={{ mixBlendMode: 'multiply' }}
                        />
                    </div>

                    <button
                        onClick={scoopDirt}
                        disabled={bucketIsFull || isTraveling}
                        className={`w-full frontier-btn-primary disabled:opacity-50 disabled:cursor-not-allowed${pulse('scoop')}`}
                    >
                        🪨 Scoop Dirt (+{scoopPower.toFixed(1)}){patchActive ? ' ✨ Rich' : ''}
                    </button>

                    {unlockedPanning && (
                        <button
                            onClick={emptyBucket}
                            disabled={bucketFilled === 0 || isTraveling || (hasSluiceBox ? !sluiceHasSpace : !panHasRoomForBucket)}
                            className={`w-full frontier-btn-primary disabled:opacity-50 disabled:cursor-not-allowed${pulse('empty')}`}
                            style={{ background: 'linear-gradient(to bottom, var(--fw-hide), var(--fw-dirt))', borderColor: 'var(--fw-dirt)' }}
                        >
                            {hasSluiceBox
                                ? `🪣 Empty Bucket → Sluice (+${bucketFilled.toFixed(1)})`
                                : `🪣 Empty Bucket → Pan (+${bucketFilled.toFixed(1)})`
                            }
                        </button>
                    )}

                    {employees.length > 0 && (
                        <div className="pt-1 border-t border-frontier-iron/20">
                            <Roster roles={['miner', 'hauler']} />
                        </div>
                    )}
                </div>

                {/* Heavy Machinery Section */}
                {(hasExcavator || hasWashplant) && (() => {
                    const fueled = fuelTank > 0;
                    const fuelPct = Math.min(100, (fuelTank / FUEL_TANK_CAP) * 100);
                    const fuelColor = fuelPct > 40 ? 'bg-amber-500' : fuelPct > 15 ? 'bg-frontier-ember' : 'bg-red-600';
                    return (
                        <div className="frontier-panel space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-frontier-bone">⚙️ Heavy Machinery</h3>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-sm ${fueled ? 'bg-frontier-sage/20 text-frontier-sage' : 'bg-frontier-rust/20 text-frontier-rust'}`}>
                                    {fueled ? 'RUNNING' : 'OUT OF FUEL'}
                                </span>
                            </div>

                            {/* Fuel gauge */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-frontier-dust">
                                    <span>⛽ Fuel Tank</span>
                                    <span className="font-semibold text-frontier-bone">{fuelTank.toFixed(1)} / {FUEL_TANK_CAP} gal</span>
                                </div>
                                <div className="h-2.5 rounded-sm bg-frontier-iron/30 overflow-hidden">
                                    <div className={`h-full rounded-sm transition-all duration-500 ${fuelColor}`} style={{ width: `${fuelPct}%` }} />
                                </div>
                                {!fueled && (
                                    <p className="text-xs text-frontier-rust text-center">Refuel at the Trading Post in Town</p>
                                )}
                            </div>

                            {/* Machine status rows */}
                            <div className="space-y-1.5 text-xs">
                                {hasExcavator && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-frontier-dust">🚜 Excavator</span>
                                        <span className={fueled ? 'text-frontier-sage font-semibold' : 'text-frontier-iron'}>
                                            {fueled ? `×${EXCAVATOR_MINE_MULT} mining rate` : 'idle — no fuel'}
                                        </span>
                                    </div>
                                )}
                                {hasWashplant && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-frontier-dust">🏭 Wash Plant</span>
                                        <span className={fueled ? 'text-frontier-sage font-semibold' : 'text-frontier-iron'}>
                                            {fueled ? `×${WASHPLANT_SLUICE_MULT} sluice speed` : 'idle — no fuel'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Sluice Box Section */}
                {unlockedPanning && hasSluiceBox && (
                    <div className="frontier-panel space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Tooltip content={<>Sluice gear ×{sluiceGear} — adds {(getAssignedPower(employees, 'sluiceOperator') * SLUICE_EXTRACTION_RATE * sluiceGear).toFixed(4)} to extraction rate per sluice operator power</>}>
                                    <span className="text-sm font-semibold text-frontier-bone underline decoration-dotted cursor-help">🚿 Sluice Box</span>
                                </Tooltip>
                                <span className="text-sm font-semibold text-frontier-dust">
                                    {sluiceBoxFilled.toFixed(1)} / {effectivePanCap}
                                </span>
                            </div>
                            <p className="text-xs text-frontier-iron mb-2">Concentrates dirt into paydirt — yields {(SLUICE_CONVERSION_RATIO * PAYDIRT_YIELD_MULTIPLIER).toFixed(2)}× more gold per bucket than raw panning</p>
                            <ProgressBar value={sluiceBoxFilled} max={effectivePanCap} color="cyan" isActive={sluiceIsDraining} />
                            <div className="h-5 mt-1 flex items-center justify-center">
                                {sluiceIsDraining
                                    ? <span className="text-xs text-frontier-dust font-semibold">Draining… collecting paydirt in moss</span>
                                    : <span className="text-xs text-frontier-iron">Empty bucket into sluice to start</span>
                                }
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-frontier-bone">🌿 Miner's Moss</span>
                                <span className="text-sm font-semibold text-frontier-dust">
                                    {minersMossFilled.toFixed(1)} / {mossCapacity}
                                </span>
                            </div>
                            <ProgressBar value={minersMossFilled} max={mossCapacity} color="amber" isActive={sluiceIsDraining} isFull={mossIsFull} />
                        </div>

                        <button
                            onClick={cleanMoss}
                            disabled={minersMossFilled === 0 || panIsFull || isTraveling}
                            className="w-full frontier-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🌿 Clean Moss → Pan (+3 paydirt)
                        </button>
                        {employees.length > 0 && (
                            <div className="pt-1 border-t border-frontier-iron/20">
                                <Roster roles={['sluiceOperator']} />
                            </div>
                        )}
                    </div>
                )}

                {/* Pan Section */}
                {unlockedPanning && (
                    <div className="frontier-panel space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <Tooltip content={<>Pan power ×{panPower.toFixed(2)} — scales gold per pan click. Base extract: {BASE_EXTRACTION.toFixed(3)}</>}>
                                    <span className="text-sm font-semibold text-frontier-bone underline decoration-dotted cursor-help">
                                        🥘 Pan
                                    </span>
                                </Tooltip>
                                <span className="text-sm font-semibold text-frontier-dust">
                                    {panFilled.toFixed(1)} / {effectivePanCap}
                                </span>
                            </div>
                            <p className="text-xs text-frontier-iron mb-2">Extracts gold flakes from dirt — {goldPerPan.toFixed(3)} oz per click at current pan power</p>
                            <ProgressBar value={panFilled} max={effectivePanCap} color="yellow" isActive={countAssigned(employees, 'prospector') > 0 && !panIsFull} isFull={panIsFull} />
                            <div className="h-5 mt-1 flex items-center justify-center">
                                {isTraveling
                                    ? <span className="text-xs text-frontier-dust font-semibold">🚗 Locked while traveling</span>
                                    : panIsFull
                                        ? <span className="text-xs text-frontier-ember font-semibold">Pan is full! Start panning to make room.</span>
                                        : !hasSluiceBox && !panHasRoomForBucket && bucketFilled > 0
                                            ? <span className="text-xs text-frontier-ember font-semibold">Pan needs {(panFilled + bucketFilled - effectivePanCap).toFixed(1)} more space — pan some dirt first.</span>
                                            : null
                                }
                            </div>
                        </div>

                        <button
                            onClick={panForGold}
                            disabled={panFilled <= 0 || isTraveling}
                            className={`w-full frontier-btn-primary disabled:opacity-50 disabled:cursor-not-allowed${pulse('pan')}`}
                            style={{ background: 'linear-gradient(to bottom, var(--fw-nugget), var(--fw-hide))', borderColor: 'var(--fw-hide)' }}
                        >
                            ✨ Pan for Gold (-1,{' '}
                            <Tooltip content={<>Pan power ×{panPower.toFixed(2)} · base extract {BASE_EXTRACTION.toFixed(3)}{extractionRate > BASE_EXTRACTION ? ` + sluice ${(extractionRate - BASE_EXTRACTION).toFixed(3)}` : ''}</>}>
                                <span className="underline decoration-dotted decoration-frontier-bone/60 cursor-help">+{goldPerPan.toFixed(2)} gold</span>
                            </Tooltip>
                            )
                        </button>

                        {employees.length > 0 && (
                            <div className="pt-1 border-t border-frontier-iron/20">
                                <Roster roles={['prospector']} />
                            </div>
                        )}
                    </div>
                )}

                {/* Furnace Section */}
                {hasFurnace && (
                    <div className="frontier-panel space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="text-sm font-semibold text-frontier-bone">🔥 Furnace</h3>
                                <Tooltip content={<>Smelt rate: {SMELT_RATE_BASE} base × {furnaceGear} gear = {SMELT_RATE_BASE * furnaceGear} oz/sec</>}>
                                    <span className="text-xs text-frontier-ember underline decoration-dotted cursor-help">
                                        {SMELT_RATE_BASE * furnaceGear} oz/sec
                                    </span>
                                </Tooltip>
                            </div>
                            <p className="text-xs text-frontier-iron">Smelts flakes into bars — bars skip the {(FLAKES_HAUL_FEE * 100).toFixed(0)}% driver haul fee, keeping full value on delivery</p>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-frontier-ember font-semibold">Smelting</span>
                                <span className="text-xs text-frontier-ember font-semibold">{furnaceFilled.toFixed(1)} / {FURNACE_CAPACITY} oz</span>
                            </div>
                            <ProgressBar value={furnaceFilled} max={FURNACE_CAPACITY} color="amber" isActive={furnaceRunning} isFull={furnaceFilled >= FURNACE_CAPACITY} />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={loadFurnace}
                                disabled={isTraveling || gold <= 0 || furnaceFilled >= FURNACE_CAPACITY}
                                className="flex-1 frontier-btn-secondary text-sm"
                            >
                                🔥 Load flakes ({Math.min(gold, FURNACE_CAPACITY - furnaceFilled).toFixed(1)} oz)
                            </button>
                            <button
                                onClick={toggleFurnace}
                                disabled={isTraveling || furnaceFilled <= 0}
                                className={`px-4 py-2 text-sm font-semibold rounded-sm border transition-all disabled:opacity-40 disabled:cursor-not-allowed font-body ${
                                    furnaceRunning
                                        ? 'frontier-btn-danger'
                                        : 'frontier-btn-secondary'
                                }`}
                                style={!furnaceRunning ? { color: 'var(--fw-sage)' } : {}}
                            >
                                {furnaceRunning ? '⏹ Off' : '▶ On'}
                            </button>
                        </div>

                        {goldAtMine > 0 && (
                            <p className="text-xs text-frontier-dust text-center">
                                ⛰️ {goldAtMine.toFixed(2)} oz flakes at mine (undelivered)
                            </p>
                        )}

                        {furnaceBars > 0 && (
                            <div className="flex items-center justify-between p-2 bg-frontier-nugget/10 border border-frontier-nugget/30 rounded-sm">
                                <div className="text-sm font-semibold text-frontier-bone">
                                    <div>🧱 {furnaceBars.toFixed(2)} oz bars ready</div>
                                </div>
                                <button
                                    onClick={collectBars}
                                    disabled={isTraveling}
                                    className="frontier-btn-primary text-sm px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Pull from Furnace
                                </button>
                            </div>
                        )}

                        {(goldBarsAtMine > 0 || goldBarsCertified > 0) && (
                            <div className="p-2 bg-frontier-nugget/10 border border-frontier-nugget/30 rounded-sm text-sm font-semibold text-frontier-bone">
                                <div>🧱 {goldBarsAtMine.toFixed(2)} oz bars at mine</div>
                                {goldBarsCertified > 0 && (
                                    <div className="text-xs text-frontier-nugget">⚖️ {goldBarsCertified.toFixed(2)} oz certified → {(goldBarsCertified * GOLD_BAR_CERTIFIED_BONUS).toFixed(2)} oz on delivery</div>
                                )}
                                {driverPower > 0 && (
                                    <div className="text-xs text-frontier-sage">Driver will haul bars to town</div>
                                )}
                                {driverPower <= 0 && (
                                    <div className="text-xs text-frontier-dust">Travel to Town to sell</div>
                                )}
                            </div>
                        )}

                        {countAssigned(employees, 'furnaceOperator') > 0 && (
                            <p className="text-xs text-frontier-dust text-center">
                                Furnace Operators are auto-loading, smelting &amp; collecting
                            </p>
                        )}
                        {employees.length > 0 && (
                            <div className="pt-1 border-t border-frontier-iron/20">
                                <Roster roles={['furnaceOperator']} />
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Dev debug overlay */}
            {devMode && (
                <div className="p-4 bg-frontier-coal/80 border-2 border-dashed border-frontier-iron rounded-sm space-y-3 text-xs font-body">
                    <h3 className="font-bold text-frontier-dust uppercase tracking-wide text-xs">🛠️ Debug</h3>
                    <div>
                        <div className="flex justify-between mb-1 text-frontier-iron">
                            <span>Bucket</span>
                            <span>{bucketFilled.toFixed(2)} / {effectiveBucketCap}</span>
                        </div>
                        <ProgressBar value={bucketFilled} max={effectiveBucketCap} />
                    </div>
                    <div>
                        <div className="flex justify-between mb-1 text-frontier-iron">
                            <span>Pan</span>
                            <span>{panFilled.toFixed(2)} / {effectivePanCap}</span>
                        </div>
                        <ProgressBar value={panFilled} max={effectivePanCap} />
                    </div>
                    {driverPower > 0 && (
                        <div>
                            <div className="flex justify-between mb-1 text-frontier-iron">
                                <span>Driver Trip</span>
                                <span>{driverTripTicks} / {getTravelDurationTicks(vehicleTier)}</span>
                            </div>
                            <ProgressBar value={driverTripTicks} max={getTravelDurationTicks(vehicleTier)} />
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-frontier-iron">
                        <span>Tick</span><span className="text-frontier-bone">{tickCount}</span>
                        <span>Gold (oz)</span><span className="text-frontier-bone">{gold.toFixed(3)}</span>
                        <span>Paused</span><span className="text-frontier-bone">{isPaused ? 'yes' : 'no'}</span>
                    </div>
                </div>
            )}
        </div>
    );
}


