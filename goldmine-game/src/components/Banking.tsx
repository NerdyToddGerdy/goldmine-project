import { gameStore, useGameStore, SMELTING_FEE_PERCENT, GOLD_PRICE_MIN, GOLD_PRICE_MAX } from "../store/gameStore";
import { formatNumber } from "../utils/format";
import { useRef, useEffect } from "react";

export function Banking() {
    const gold = useGameStore((s) => s.gold);
    const goldInPocket = useGameStore((s) => s.goldInPocket);
    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const goldPrice = useGameStore((s) => s.goldPrice);
    const dustGoldValue = useGameStore((s) => s.dustGoldValue);
    const bankerWorkers = useGameStore((s) => s.bankerWorkers);
    const goldPriceHistory = useGameStore((s) => s.goldPriceHistory);

    const sellGold = () => gameStore.getState().sellGold();

    const sellable = Math.min(gold, goldInPocket);
    const baseValue = sellable * goldPrice;
    const fee = !hasFurnace ? baseValue * SMELTING_FEE_PERCENT : 0;
    const finalValue = (baseValue - fee) * (1 + 0.1 * dustGoldValue);

    const extraGold = gold - sellable;

    // Price trend arrow
    const prevPriceRef = useRef(goldPrice);
    const priceTrend = goldPrice > prevPriceRef.current ? 'up' : goldPrice < prevPriceRef.current ? 'down' : 'flat';
    useEffect(() => { prevPriceRef.current = goldPrice; }, [goldPrice]);

    return (
        <div className="space-y-6">
            {/* Sell Gold */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-800">🏦 Sell Gold</h3>

                {/* Market price with trend arrow + sparkline */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                        <span>📈 Market price: ${goldPrice.toFixed(2)}/oz</span>
                        {priceTrend === 'up' && <span className="text-green-500">▲</span>}
                        {priceTrend === 'down' && <span className="text-red-500">▼</span>}
                    </div>
                    <GoldSparkline history={goldPriceHistory} />
                </div>

                {/* Breakdown card */}
                {sellable >= 0.01 && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm space-y-1">
                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                            <span>{formatNumber(sellable)} oz × ${goldPrice.toFixed(2)}</span>
                            <span>${formatNumber(baseValue)}</span>
                        </div>
                        {fee > 0 && (
                            <div className="flex justify-between text-red-600 dark:text-red-400">
                                <span>Smelting fee ({(SMELTING_FEE_PERCENT * 100).toFixed(0)}%)</span>
                                <span>− ${formatNumber(fee)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-green-700 dark:text-green-400 border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                            <span>You receive</span>
                            <span>${formatNumber(finalValue)}</span>
                        </div>
                    </div>
                )}

                {/* Furnace upsell hint */}
                {fee > 0 && !hasFurnace && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 text-center">
                        💡 Buy a Furnace in Shop → Equipment to waive the smelting fee
                    </div>
                )}

                {bankerWorkers > 0 ? (
                    <div className="w-full px-6 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-center">
                        <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                            🏦 Banker is handling sales automatically
                        </span>
                    </div>
                ) : (
                    <button
                        onClick={sellGold}
                        disabled={sellable < 0.01}
                        className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        💰 Sell {formatNumber(sellable)} oz
                    </button>
                )}

                {extraGold >= 0.01 && (
                    <div className="text-xs text-amber-700 dark:text-amber-400 text-center">
                        ✨ {formatNumber(extraGold)} oz panned en route — stays at the Mine
                    </div>
                )}
            </div>
        </div>
    );
}

function GoldSparkline({ history }: { history: number[] }) {
    if (history.length < 2) return null;

    const W = 200;
    const H = 36;
    const pad = 3;
    const innerW = W - pad * 2;
    const innerH = H - pad * 2;
    const range = GOLD_PRICE_MAX - GOLD_PRICE_MIN;

    const pts = history.map((price, i) => {
        const x = pad + (i / (history.length - 1)) * innerW;
        const y = H - pad - ((price - GOLD_PRICE_MIN) / range) * innerH;
        return [x, y] as [number, number];
    });

    const polyline = pts.map(([x, y]) => `${x},${y}`).join(' ');
    const last = pts[pts.length - 1];
    const first = pts[0];
    const isUp = history[history.length - 1] >= history[0];
    const lineColor = isUp ? '#16a34a' : '#dc2626';
    const gradId = `sg-${isUp ? 'u' : 'd'}`;

    // Closed area path: along the line, then down to baseline and back
    const area = [
        `M${first[0]},${H - pad}`,
        ...pts.map(([x, y]) => `L${x},${y}`),
        `L${last[0]},${H - pad}`,
        'Z',
    ].join(' ');

    // Midline for $1.00 reference
    const midY = H - pad - ((1.0 - GOLD_PRICE_MIN) / range) * innerH;

    return (
        <div className="relative">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="w-full"
                style={{ height: 36 }}
            >
                <defs>
                    <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                {/* $1.00 reference line */}
                <line x1={pad} y1={midY} x2={W - pad} y2={midY}
                    stroke="#d1d5db" strokeWidth="0.5" strokeDasharray="2,2" />
                {/* Area fill */}
                <path d={area} fill={`url(#${gradId})`} />
                {/* Price line */}
                <polyline points={polyline} fill="none" stroke={lineColor}
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Current price dot */}
                <circle cx={last[0]} cy={last[1]} r="2.5" fill={lineColor} />
            </svg>
            {/* Y-axis labels */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-1 py-0.5">
                <span className="text-[9px] text-gray-400 leading-none self-end">${GOLD_PRICE_MAX.toFixed(2)}</span>
                <span className="text-[9px] text-gray-400 leading-none self-end">${GOLD_PRICE_MIN.toFixed(2)}</span>
            </div>
        </div>
    );
}
