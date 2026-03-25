import { gameStore, useGameStore, SMELTING_FEE_PERCENT } from "../store/gameStore";
import { formatNumber } from "../utils/format";

export function Banking() {
    const gold = useGameStore((s) => s.gold);
    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const goldPrice = useGameStore((s) => s.goldPrice);
    const dustGoldValue = useGameStore((s) => s.dustGoldValue);

    const sellGold = () => gameStore.getState().sellGold();

    const baseValue = gold * goldPrice;
    const fee = !hasFurnace ? baseValue * SMELTING_FEE_PERCENT : 0;
    const finalValue = (baseValue - fee) * (1 + 0.1 * dustGoldValue);

    return (
        <div className="space-y-6">
            {/* Sell Gold */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-800">🏦 Sell Gold</h3>
                <div className="text-xs text-green-700 font-semibold">📈 Market price: ${goldPrice.toFixed(2)}/oz</div>
                <button
                    onClick={sellGold}
                    disabled={gold < 0.01}
                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div>💰 Sell All Gold → ${formatNumber(finalValue)}</div>
                    {gold > 0 && !hasFurnace && (
                        <div className="text-xs opacity-80 mt-1">
                            ({(SMELTING_FEE_PERCENT * 100).toFixed(0)}% smelting fee: -${formatNumber(fee)})
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
}
