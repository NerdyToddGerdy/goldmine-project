import { formatNumber } from '../../utils/format';

export function PrestigeModal({
    dustReward,
    onConfirm,
    onCancel,
}: {
    dustReward: number;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 space-y-6">
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

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    This will reset: resources, workers, equipment, money, and upgrades.
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
