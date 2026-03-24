import { gameStore, useGameStore, BASE_EXTRACTION, EQUIPMENT, BUCKET_CAPACITY, PAN_CAPACITY, UPGRADES } from "../store/gameStore";

export function Mine() {
    const bucketFilled = useGameStore((s) => s.bucketFilled);
    const panFilled = useGameStore((s) => s.panFilled);
    const dirt = useGameStore((s) => s.dirt);
    const paydirt = useGameStore((s) => s.paydirt);
    const gold = useGameStore((s) => s.gold);
    const money = useGameStore((s) => s.money);
    const scoopPower = useGameStore((s) => s.scoopPower);
    const sluicePower = useGameStore((s) => s.sluicePower);
    const panPower = useGameStore((s) => s.panPower);
    const unlockedPanning = useGameStore((s) => s.unlockedPanning);
    const unlockedTown = useGameStore((s) => s.unlockedTown);
    const unlockedShop = useGameStore((s) => s.unlockedShop);
    const hasSluiceBox = useGameStore((s) => s.hasSluiceBox);
    const shovels = useGameStore((s) => s.shovels);
    const pans = useGameStore((s) => s.pans);
    const sluiceWorkers = useGameStore((s) => s.sluiceWorkers);
    const separatorWorkers = useGameStore((s) => s.separatorWorkers);
    const sluiceGear = useGameStore((s) => s.sluiceGear);
    const separatorGear = useGameStore((s) => s.separatorGear);

    const scoopDirt = () => gameStore.getState().scoopDirt();
    const emptyBucket = () => gameStore.getState().emptyBucket();
    const sluiceDirt = () => gameStore.getState().sluiceDirt();
    const panForGold = () => gameStore.getState().panForGold();

    // Manual actions now benefit from gear upgrades
    let extractionRate = BASE_EXTRACTION;
    extractionRate += sluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * sluiceGear;
    extractionRate += separatorWorkers * UPGRADES.separatorWorker.extractionBonus * separatorGear;

    const goldPerPan = panPower * extractionRate;
    const effectiveSluicePower = hasSluiceBox ? sluicePower * sluiceGear : 1;
    const bucketToPanel = bucketFilled * effectiveSluicePower;

    const bucketPercent = (bucketFilled / BUCKET_CAPACITY) * 100;
    const bucketIsFull = bucketFilled >= BUCKET_CAPACITY;
    const panPercent = (panFilled / PAN_CAPACITY) * 100;
    const panIsFull = panFilled >= PAN_CAPACITY;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-amber-900">⛏️ The Mine</h2>

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
                                {bucketFilled.toFixed(1)} / {BUCKET_CAPACITY}
                            </span>
                        </div>
                        <div className="w-full bg-amber-100 rounded-full h-6 overflow-hidden border border-amber-300">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                style={{ width: `${bucketPercent}%` }}
                            >
                                {bucketPercent > 15 && `${bucketPercent.toFixed(0)}%`}
                            </div>
                        </div>
                        {bucketIsFull && (
                            <div className="text-xs text-amber-700 mt-2 text-center font-semibold">
                                Bucket is full! Empty it to continue scooping.
                            </div>
                        )}
                    </div>

                    {/* Scoop Button */}
                    <button
                        onClick={scoopDirt}
                        disabled={bucketIsFull}
                        className="w-full px-6 py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        🪨 Scoop Dirt (+{scoopPower.toFixed(1)})
                    </button>

                    {/* Empty Bucket Button */}
                    {unlockedPanning && (
                        <button
                            onClick={emptyBucket}
                            disabled={bucketFilled === 0 || panIsFull}
                            className="w-full px-6 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {hasSluiceBox
                                ? `🚿 Empty Bucket → Pan (+${bucketToPanel.toFixed(1)})`
                                : `🪣 Empty Bucket → Pan (+${bucketFilled.toFixed(1)})`
                            }
                        </button>
                    )}
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
                                    {panFilled.toFixed(1)} / {PAN_CAPACITY}
                                </span>
                            </div>
                            <div className="w-full bg-yellow-100 rounded-full h-6 overflow-hidden border border-yellow-300">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                                    style={{ width: `${panPercent}%` }}
                                >
                                    {panPercent > 15 && `${panPercent.toFixed(0)}%`}
                                </div>
                            </div>
                            {panIsFull && (
                                <div className="text-xs text-yellow-700 mt-2 text-center font-semibold">
                                    Pan is full! Start panning to make room.
                                </div>
                            )}
                        </div>

                        {/* Pan for Gold Button */}
                        <button
                            onClick={panForGold}
                            disabled={panFilled < 1}
                            className="w-full px-6 py-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ✨ Pan for Gold (-1, +{goldPerPan.toFixed(2)} gold)
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

            {/* Unlock message */}
            {!unlockedTown && gold < 0.5 && unlockedPanning && (
                <div className="text-sm text-amber-700 italic text-center p-3 bg-amber-100 rounded-xl">
                    Get 0.5 gold to unlock Town tab!
                </div>
            )}
        </div>
    );
}
