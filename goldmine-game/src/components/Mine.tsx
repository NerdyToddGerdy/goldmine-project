import { useState, useRef } from 'react';
import { gameStore, useGameStore, BASE_EXTRACTION, EQUIPMENT, getEffectiveBucketCapacity, getEffectivePanCapacity, VEHICLE_TIERS, getTravelDurationTicks, FURNACE_CAPACITY, SMELT_RATE_BASE, getDriverCapacity, getAssignedPower, countAssigned, SLUICE_EXTRACTION_RATE, GOLD_BAR_CERTIFIED_BONUS, getSettlementStage, FLAKES_HAUL_FEE } from "../store/gameStore";
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
        hasSluiceBox, sluiceGear, hasFurnace, employees, storyNPCs,
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
        gold: s.gold, goldAtMine: s.goldAtMine, scoopPower: s.scoopPower, panPower: s.panPower,
        unlockedPanning: s.unlockedPanning, unlockedTown: s.unlockedTown,
        hasSluiceBox: s.hasSluiceBox, sluiceGear: s.sluiceGear,
        hasFurnace: s.hasFurnace, employees: s.employees, storyNPCs: s.storyNPCs,
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

    const tavernBuilt = storyNPCs.tavernBuilt;
    const settlementName = getSettlementStage(seasonNumber).name;
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
                    <h3 className="text-sm font-semibold text-frontier-dust">🔍 Metal Detector</h3>

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
                    {tavernBuilt && (
                        <div className="pt-1 border-t border-frontier-iron/20">
                            <Roster roles={['detectorOperator']} />
                        </div>
                    )}
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
                    <div className="frontier-panel border-frontier-nugget/50 space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-frontier-bone">🚗 Driver</h3>
                            <span className="text-xs text-frontier-dust">{capacity} oz cap · {tripSecs}s trip</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-frontier-aged">
                            <span>{phaseLabel}</span>
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

                    {tavernBuilt && (
                        <div className="pt-1 border-t border-frontier-iron/20">
                            <Roster roles={['miner', 'hauler']} />
                        </div>
                    )}
                </div>

                {/* Sluice Box Section */}
                {unlockedPanning && hasSluiceBox && (
                    <div className="frontier-panel space-y-3">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Tooltip content={<>Sluice gear ×{sluiceGear} — adds {(getAssignedPower(employees, 'sluiceOperator') * SLUICE_EXTRACTION_RATE * sluiceGear).toFixed(4)} to extraction rate per sluice operator power</>}>
                                    <span className="text-sm font-semibold text-frontier-bone underline decoration-dotted cursor-help">🚿 Sluice Box</span>
                                </Tooltip>
                                <span className="text-sm font-semibold text-frontier-dust">
                                    {sluiceBoxFilled.toFixed(1)} / {effectivePanCap}
                                </span>
                            </div>
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
                        {tavernBuilt && (
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
                            <div className="flex items-center justify-between mb-2">
                                <Tooltip content={<>Pan power ×{panPower.toFixed(2)} — scales gold per pan click. Base extract: {BASE_EXTRACTION.toFixed(3)}</>}>
                                    <span className="text-sm font-semibold text-frontier-bone underline decoration-dotted cursor-help">
                                        🥘 Pan
                                    </span>
                                </Tooltip>
                                <span className="text-sm font-semibold text-frontier-dust">
                                    {panFilled.toFixed(1)} / {effectivePanCap}
                                </span>
                            </div>
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

                        {tavernBuilt && (
                            <div className="pt-1 border-t border-frontier-iron/20">
                                <Roster roles={['prospector']} />
                            </div>
                        )}
                    </div>
                )}

                {/* Furnace Section */}
                {hasFurnace && (
                    <div className="frontier-panel space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-frontier-bone">🔥 Furnace</h3>
                            <Tooltip content={<>Smelt rate: {SMELT_RATE_BASE} base × {furnaceGear} gear = {SMELT_RATE_BASE * furnaceGear} oz/sec</>}>
                                <span className="text-xs text-frontier-ember underline decoration-dotted cursor-help">
                                    {SMELT_RATE_BASE * furnaceGear} oz/sec
                                </span>
                            </Tooltip>
                        </div>

                        <p className="text-xs text-frontier-dust">
                            ✨ Flakes → 🧱 Bars — bars avoid the {(FLAKES_HAUL_FEE * 100).toFixed(0)}% driver haul fee
                        </p>

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

                        {(goldBars > 0 || goldBarsCertified > 0) && (
                            <div className="p-2 bg-frontier-nugget/10 border border-frontier-nugget/30 rounded-sm text-sm font-semibold text-frontier-bone">
                                <div>🧱 {goldBars.toFixed(2)} oz bars at mine</div>
                                {goldBarsCertified > 0 && (
                                    <div className="text-xs text-frontier-nugget">⚖️ {goldBarsCertified.toFixed(2)} oz certified → {(goldBarsCertified * GOLD_BAR_CERTIFIED_BONUS).toFixed(2)} oz on delivery</div>
                                )}
                                {hasDriver && (
                                    <div className="text-xs text-frontier-sage">Driver will haul bars at full value</div>
                                )}
                                {!hasDriver && (
                                    <div className="text-xs text-frontier-dust">Travel to Town to sell</div>
                                )}
                            </div>
                        )}

                        {countAssigned(employees, 'furnaceOperator') > 0 && (
                            <p className="text-xs text-frontier-dust text-center">
                                Furnace Operators are auto-loading, smelting &amp; collecting
                            </p>
                        )}
                        {tavernBuilt && (
                            <div className="pt-1 border-t border-frontier-iron/20">
                                <Roster roles={['furnaceOperator']} />
                            </div>
                        )}
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
                        { show: !hasDriver && (gold > 0.5 || goldAtMine > 0.5) && unlockedTown && !isTraveling,
                          text: goldAtMine > 0.5 ? '💡 Head to Town to sell your gold — it\'s sitting undelivered at the mine!' : '💡 Head to Town to spend your gold on upgrades and workers.' },
                    ];
                    const tip = tips.find(t => t.show);
                    if (!tip) return null;
                    return (
                        <div className={`text-sm italic text-center p-3 rounded-sm ${
                            tip.amber
                                ? 'text-frontier-ember'
                                : 'text-frontier-aged bg-frontier-dirt/40 border border-frontier-iron/60'
                        }`}>
                            {tip.text}
                        </div>
                    );
                })()}
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
                    {hasDriver && (
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


