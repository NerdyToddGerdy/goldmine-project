import { gameStore, useGameStore, SMELTING_FEE_PERCENT, GOLD_PRICE_MIN, GOLD_PRICE_MAX, PRESTIGE_MONEY_THRESHOLD } from "../store/gameStore";
import { formatNumber } from "../utils/format";
import { useRef, useEffect, useState } from "react";
import { PrestigeModal } from "./ui";
import { PrestigeShop } from "./PrestigeShop";

export function Banking() {
    const gold = useGameStore((s) => s.gold);
    const goldInPocket = useGameStore((s) => s.goldInPocket);
    const hasFurnace = useGameStore((s) => s.hasFurnace);
    const goldPrice = useGameStore((s) => s.goldPrice);
    const dustGoldValue = useGameStore((s) => s.dustGoldValue);
    const bankerWorkers = useGameStore((s) => s.bankerWorkers);
    const goldPriceHistory = useGameStore((s) => s.goldPriceHistory);
    const money = useGameStore((s) => s.money);
    const shovels = useGameStore((s) => s.shovels);
    const pans = useGameStore((s) => s.pans);
    const sluiceWorkers = useGameStore((s) => s.sluiceWorkers);
    const ovenWorkers = useGameStore((s) => s.ovenWorkers);
    const furnaceWorkers = useGameStore((s) => s.furnaceWorkers);
    const hasSluiceBox = useGameStore((s) => s.hasSluiceBox);
    const hasOven = useGameStore((s) => s.hasOven);
    const vehicleTier = useGameStore((s) => s.vehicleTier);
    const legacyDust = useGameStore((s) => s.legacyDust);
    const runMoneyEarned = useGameStore((s) => s.runMoneyEarned);
    const prestigeCount = useGameStore((s) => s.prestigeCount);

    const [activeTab, setActiveTab] = useState<'sell' | 'legacy'>('sell');
    const [showPrestigeModal, setShowPrestigeModal] = useState(false);
    const [celebrationDust, setCelebrationDust] = useState<number | null>(null);

    const dustReward = Math.floor(Math.sqrt(runMoneyEarned));
    const canPrestige = runMoneyEarned >= PRESTIGE_MONEY_THRESHOLD;

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
        <div className="space-y-4">
            {celebrationDust !== null && <PrestigeCelebration dust={celebrationDust} />}

            {/* Sub-tabs */}
            {prestigeCount > 0 && (
                <div className="flex gap-2 border-b-2 border-green-200">
                    <button
                        onClick={() => setActiveTab('sell')}
                        className={`flex-1 px-4 py-2 font-semibold rounded-t-lg transition-all border-2 ${
                            activeTab === 'sell'
                                ? 'bg-green-100 text-green-900 border-green-200 border-b-0'
                                : 'bg-white/50 text-green-700 hover:bg-white/80 border-transparent'
                        }`}
                    >
                        🏦 Sell Gold
                    </button>
                    <button
                        onClick={() => setActiveTab('legacy')}
                        className={`flex-1 px-4 py-2 font-semibold rounded-t-lg transition-all border-2 ${
                            activeTab === 'legacy'
                                ? 'bg-amber-100 text-amber-900 border-amber-200 border-b-0'
                                : 'bg-white/50 text-amber-700 hover:bg-white/80 border-transparent'
                        }`}
                    >
                        ✨ Legacy
                    </button>
                </div>
            )}

            {activeTab === 'legacy' && <PrestigeShop />}

            {activeTab === 'sell' && <div className="space-y-6">
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
            {/* Prospect New Claim */}
            {canPrestige && (
                <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-3">
                    <h3 className="text-lg font-semibold text-amber-900">⭐ Prospect New Claim</h3>
                    <p className="text-sm text-amber-700">
                        This claim has yielded <span className="font-semibold">${formatNumber(runMoneyEarned)}</span>
                    </p>
                    <p className="text-sm font-semibold text-amber-800">
                        New claim reward: ✨ {dustReward} Legacy Dust
                    </p>
                    <button
                        onClick={() => setShowPrestigeModal(true)}
                        className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold"
                    >
                        Prospect New Claim
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
                    ovenWorkers={ovenWorkers}
                    furnaceWorkers={furnaceWorkers}
                    bankerWorkers={bankerWorkers}
                    hasSluiceBox={hasSluiceBox}
                    hasOven={hasOven}
                    hasFurnace={hasFurnace}
                    vehicleTier={vehicleTier}
                    onConfirm={() => {
                        setCelebrationDust(dustReward);
                        gameStore.getState().prestige();
                        setShowPrestigeModal(false);
                        setTimeout(() => setCelebrationDust(null), 2500);
                    }}
                    onCancel={() => setShowPrestigeModal(false)}
                />
            )}
            </div>}
        </div>
    );
}

const CELEBRATION_PARTICLES = [
    { left: '8%',  emoji: '✨', delay: '0ms',   dur: '1.4s' },
    { left: '18%', emoji: '⭐', delay: '120ms',  dur: '1.6s' },
    { left: '30%', emoji: '💰', delay: '60ms',   dur: '1.3s' },
    { left: '42%', emoji: '✨', delay: '200ms',  dur: '1.5s' },
    { left: '55%', emoji: '⭐', delay: '40ms',   dur: '1.7s' },
    { left: '67%', emoji: '💎', delay: '160ms',  dur: '1.4s' },
    { left: '78%', emoji: '💰', delay: '80ms',   dur: '1.6s' },
    { left: '90%', emoji: '✨', delay: '220ms',  dur: '1.3s' },
    { left: '24%', emoji: '⭐', delay: '300ms',  dur: '1.5s' },
    { left: '72%', emoji: '✨', delay: '260ms',  dur: '1.4s' },
];

function PrestigeCelebration({ dust }: { dust: number }) {
    return (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-black/65 animate-celebration-fade" />
            {CELEBRATION_PARTICLES.map((p, i) => (
                <div
                    key={i}
                    className="absolute bottom-0 text-2xl animate-float-up"
                    style={{ left: p.left, animationDelay: p.delay, animationDuration: p.dur }}
                >
                    {p.emoji}
                </div>
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center animate-celebration-pop">
                    <div className="text-7xl mb-3 drop-shadow-lg">⭐</div>
                    <div className="font-arcade text-amber-400 text-lg tracking-wide drop-shadow-lg mb-2">
                        NEW CREEK!
                    </div>
                    <div className="text-white text-2xl font-bold drop-shadow-lg">
                        +{formatNumber(dust)} Legacy Dust
                    </div>
                </div>
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
