import { formatNumber } from '../../utils/format';
import { VEHICLE_TIERS } from '../../store/gameStore';

export function PrestigeModal({
    dustReward,
    legacyDust,
    money,
    gold,
    shovels,
    pans,
    sluiceWorkers,
    ovenWorkers,
    furnaceWorkers,
    bankerWorkers,
    hasSluiceBox,
    hasOven,
    hasFurnace,
    vehicleTier,
    onConfirm,
    onCancel,
}: {
    dustReward: number;
    legacyDust: number;
    money: number;
    gold: number;
    shovels: number;
    pans: number;
    sluiceWorkers: number;
    ovenWorkers: number;
    furnaceWorkers: number;
    bankerWorkers: number;
    hasSluiceBox: boolean;
    hasOven: boolean;
    hasFurnace: boolean;
    vehicleTier: number;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const lossList: string[] = [];
    if (money > 0) lossList.push(`💰 $${formatNumber(money)} in savings`);
    if (gold > 0) lossList.push(`✨ ${formatNumber(gold)} oz gold`);
    if (shovels > 0) lossList.push(`👷 ${shovels} Miner${shovels !== 1 ? 's' : ''}`);
    if (pans > 0) lossList.push(`🧑‍🔬 ${pans} Prospector${pans !== 1 ? 's' : ''}`);
    if (sluiceWorkers > 0) lossList.push(`🚿 ${sluiceWorkers} Sluice Operator${sluiceWorkers !== 1 ? 's' : ''}`);
    if (ovenWorkers > 0) lossList.push(`🔥 ${ovenWorkers} Oven Operator${ovenWorkers !== 1 ? 's' : ''}`);
    if (furnaceWorkers > 0) lossList.push(`⚗️ ${furnaceWorkers} Furnace Operator${furnaceWorkers !== 1 ? 's' : ''}`);
    if (bankerWorkers > 0) lossList.push(`🏦 ${bankerWorkers} Banker${bankerWorkers !== 1 ? 's' : ''}`);
    if (hasSluiceBox) lossList.push('🚿 Sluice Box');
    if (hasOven) lossList.push('🔥 Smelting Oven');
    if (hasFurnace) lossList.push('⚗️ Furnace');
    if (vehicleTier > 0) lossList.push(`🚗 ${VEHICLE_TIERS[vehicleTier as 1 | 2 | 3].name}`);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="text-center space-y-2">
                    <div className="text-5xl">⭐</div>
                    <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                        New Creek Run
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Start fresh at a new creek site. Your progress resets, but you keep your
                        Legacy Gold Dust and any permanent upgrades.
                    </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-4 text-center border border-amber-200 dark:border-amber-700">
                    <div className="text-sm text-amber-700 dark:text-amber-300 font-semibold uppercase tracking-wide">
                        You'll earn
                    </div>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        ✨ {formatNumber(dustReward)} Legacy Dust
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* What you lose */}
                    {lossList.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 border border-red-200 dark:border-red-800">
                            <div className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400 mb-2">
                                ❌ Losing
                            </div>
                            <ul className="space-y-1">
                                {lossList.map((item, i) => (
                                    <li key={i} className="text-xs text-gray-700 dark:text-gray-300">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* What you keep */}
                    <div className={`bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800 ${lossList.length === 0 ? 'col-span-2' : ''}`}>
                        <div className="text-xs font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-2">
                            ✅ Keeping
                        </div>
                        <ul className="space-y-1">
                            <li className="text-xs text-gray-700 dark:text-gray-300">
                                ✨ Dust: {formatNumber(legacyDust)} → {formatNumber(legacyDust + dustReward)}
                            </li>
                            <li className="text-xs text-gray-700 dark:text-gray-300">
                                All Legacy upgrades
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                        Prestige!
                    </button>
                </div>
            </div>
        </div>
    );
}
