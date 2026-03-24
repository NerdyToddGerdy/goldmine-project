import { gameStore, useGameStore, SMELTING_FEE_PERCENT, INVESTMENTS, WITHDRAWAL_PENALTY } from "../store/gameStore";
import { formatNumber } from "../utils/format";
import { useState } from "react";

export function Banking() {
    const gold = useGameStore((s) => s.gold);
    const money = useGameStore((s) => s.money);
    const investmentSafeBonds = useGameStore((s) => s.investmentSafeBonds);
    const investmentStocks = useGameStore((s) => s.investmentStocks);
    const investmentHighRisk = useGameStore((s) => s.investmentHighRisk);

    const sellGold = () => gameStore.getState().sellGold();

    // Manual selling uses base value with smelting fee (no worker bonuses)
    const baseValue = gold;
    const fee = baseValue * SMELTING_FEE_PERCENT;
    const finalValue = baseValue - fee;

    return (
        <div className="space-y-6">
            {/* Sell Gold */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-800">🏦 Sell Gold</h3>
                <button
                    onClick={sellGold}
                    disabled={gold < 0.01}
                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div>💰 Sell All Gold → ${formatNumber(finalValue)}</div>
                    {gold > 0 && (
                        <div className="text-xs opacity-80 mt-1">
                            ({(SMELTING_FEE_PERCENT * 100).toFixed(0)}% smelting fee: -${formatNumber(fee)})
                        </div>
                    )}
                </button>
            </div>

            {/* Investments */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-800">📈 Investments</h3>
                <p className="text-sm text-gray-600 italic">
                    Invest your money to earn passive income. Higher returns come with higher risk!
                    Withdrawal penalty: {(WITHDRAWAL_PENALTY * 100).toFixed(0)}%
                </p>

                {/* Investment Options */}
                <div className="space-y-3">
                    <InvestmentCard
                        type="safeBonds"
                        name={INVESTMENTS.safeBonds.name}
                        currentBalance={investmentSafeBonds}
                        interestRate={INVESTMENTS.safeBonds.interestRate}
                        riskChance={INVESTMENTS.safeBonds.riskChance}
                        riskLossMin={INVESTMENTS.safeBonds.riskLossMin}
                        riskLossMax={INVESTMENTS.safeBonds.riskLossMax}
                        money={money}
                        icon="🛡️"
                        color="blue"
                    />

                    <InvestmentCard
                        type="stocks"
                        name={INVESTMENTS.stocks.name}
                        currentBalance={investmentStocks}
                        interestRate={INVESTMENTS.stocks.interestRate}
                        riskChance={INVESTMENTS.stocks.riskChance}
                        riskLossMin={INVESTMENTS.stocks.riskLossMin}
                        riskLossMax={INVESTMENTS.stocks.riskLossMax}
                        money={money}
                        icon="📊"
                        color="purple"
                    />

                    <InvestmentCard
                        type="highRisk"
                        name={INVESTMENTS.highRisk.name}
                        currentBalance={investmentHighRisk}
                        interestRate={INVESTMENTS.highRisk.interestRate}
                        riskChance={INVESTMENTS.highRisk.riskChance}
                        riskLossMin={INVESTMENTS.highRisk.riskLossMin}
                        riskLossMax={INVESTMENTS.highRisk.riskLossMax}
                        money={money}
                        icon="🎲"
                        color="red"
                    />
                </div>
            </div>
        </div>
    );
}

function InvestmentCard({
    type,
    name,
    currentBalance,
    interestRate,
    riskChance,
    riskLossMin,
    riskLossMax,
    money,
    icon,
    color
}: {
    type: 'safeBonds' | 'stocks' | 'highRisk';
    name: string;
    currentBalance: number;
    interestRate: number;
    riskChance: number;
    riskLossMin: number;
    riskLossMax: number;
    money: number;
    icon: string;
    color: 'blue' | 'purple' | 'red';
}) {
    const [depositAmount, setDepositAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");

    const depositInvestment = (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => {
        const success = gameStore.getState().depositInvestment(type, amount);
        if (success) {
            setDepositAmount("");
        }
    };

    const withdrawInvestment = (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => {
        const success = gameStore.getState().withdrawInvestment(type, amount);
        if (success) {
            setWithdrawAmount("");
        }
    };

    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-300',
            text: 'text-blue-900',
            textMuted: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700',
            buttonSecondary: 'border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100'
        },
        purple: {
            bg: 'bg-purple-50',
            border: 'border-purple-300',
            text: 'text-purple-900',
            textMuted: 'text-purple-600',
            button: 'bg-purple-600 hover:bg-purple-700',
            buttonSecondary: 'border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100'
        },
        red: {
            bg: 'bg-red-50',
            border: 'border-red-300',
            text: 'text-red-900',
            textMuted: 'text-red-600',
            button: 'bg-red-600 hover:bg-red-700',
            buttonSecondary: 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100'
        }
    };

    const colors = colorClasses[color];
    const depositNum = parseFloat(depositAmount) || 0;
    const withdrawNum = parseFloat(withdrawAmount) || 0;
    const canDeposit = depositNum > 0 && money >= depositNum;
    const canWithdraw = withdrawNum > 0 && currentBalance >= withdrawNum;

    return (
        <div className={`p-4 ${colors.bg} border-2 ${colors.border} rounded-xl space-y-3`}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className={`font-semibold ${colors.text}`}>
                        {icon} {name}
                    </div>
                    <div className="text-sm mt-1">
                        <span className="text-green-600 font-semibold">+{(interestRate * 100).toFixed(1)}%/min</span>
                        <span className={`ml-2 ${colors.textMuted} text-xs`}>
                            {riskChance > 0
                                ? `${(riskChance * 100).toFixed(0)}% risk/min (${(riskLossMin * 100).toFixed(0)}–${(riskLossMax * 100).toFixed(0)}% loss)`
                                : 'No risk'}
                        </span>
                    </div>
                </div>
                <div className={`text-lg font-bold ${colors.text}`}>
                    ${formatNumber(currentBalance)}
                </div>
            </div>

            {/* Deposit Section */}
            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="Deposit amount"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className={`flex-1 px-3 py-2 border-2 ${colors.border} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1`}
                    min="0"
                    step="0.01"
                />
                <button
                    onClick={() => setDepositAmount(money.toFixed(2))}
                    className={`px-3 py-2 rounded-lg border ${colors.buttonSecondary} transition-all text-sm font-semibold`}
                >
                    Max
                </button>
                <button
                    onClick={() => depositInvestment(type, depositNum)}
                    disabled={!canDeposit}
                    className={`px-4 py-2 ${colors.button} text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold`}
                >
                    Deposit
                </button>
            </div>

            {/* Withdraw Section */}
            <div className="flex gap-2">
                <input
                    type="number"
                    placeholder="Withdraw amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className={`flex-1 px-3 py-2 border-2 ${colors.border} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-offset-1`}
                    min="0"
                    step="0.01"
                />
                <button
                    onClick={() => setWithdrawAmount(currentBalance.toFixed(2))}
                    className={`px-3 py-2 rounded-lg border ${colors.buttonSecondary} transition-all text-sm font-semibold`}
                >
                    Max
                </button>
                <button
                    onClick={() => withdrawInvestment(type, withdrawNum)}
                    disabled={!canWithdraw}
                    className={`px-4 py-2 ${colors.button} text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold`}
                >
                    Withdraw
                </button>
            </div>

            {/* Withdrawal penalty info */}
            {withdrawNum > 0 && canWithdraw && (
                <div className="text-xs text-gray-600 italic">
                    You'll receive: ${formatNumber(withdrawNum * (1 - WITHDRAWAL_PENALTY))} (after {(WITHDRAWAL_PENALTY * 100).toFixed(0)}% penalty)
                </div>
            )}
        </div>
    );
}
