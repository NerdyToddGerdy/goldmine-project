import { useState } from 'react';
import { formatNumber } from '../../utils/format';

export function InvestmentCard({
    name,
    icon,
    balance,
    interestRate,
    riskDescription,
    penaltyPct,
    canAffordDeposit,
    maxDeposit,
    onDeposit,
    onWithdraw,
}: {
    name: string;
    icon: string;
    balance: number;
    interestRate: number;
    riskDescription?: string;
    penaltyPct: number;
    canAffordDeposit: (amount: number) => boolean;
    maxDeposit: number;
    onDeposit: (amount: number) => void;
    onWithdraw: (amount: number) => void;
}) {
    const [depositInput, setDepositInput] = useState('');
    const [withdrawInput, setWithdrawInput] = useState('');

    const depositNum = parseFloat(depositInput) || 0;
    const withdrawNum = parseFloat(withdrawInput) || 0;
    const afterPenalty = withdrawNum * (1 - penaltyPct);

    return (
        <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {icon} {name}
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold tabular-nums text-gray-900 dark:text-gray-100">
                        ${formatNumber(balance)}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400">
                        +{(interestRate * 100).toFixed(1)}%/min
                    </div>
                    {riskDescription && (
                        <div className="text-xs text-orange-500">{riskDescription}</div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {/* Deposit */}
                <div className="space-y-1">
                    <div className="flex gap-1">
                        <input
                            type="number"
                            min="0"
                            value={depositInput}
                            onChange={(e) => setDepositInput(e.target.value)}
                            placeholder="Amount"
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <button
                            onClick={() => setDepositInput(maxDeposit.toFixed(2))}
                            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                        >
                            Max
                        </button>
                    </div>
                    <button
                        onClick={() => { onDeposit(depositNum); setDepositInput(''); }}
                        disabled={depositNum <= 0 || !canAffordDeposit(depositNum)}
                        className="w-full px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Deposit
                    </button>
                </div>

                {/* Withdraw */}
                <div className="space-y-1">
                    <div className="flex gap-1">
                        <input
                            type="number"
                            min="0"
                            value={withdrawInput}
                            onChange={(e) => setWithdrawInput(e.target.value)}
                            placeholder="Amount"
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        />
                        <button
                            onClick={() => setWithdrawInput(balance.toFixed(2))}
                            className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap"
                        >
                            Max
                        </button>
                    </div>
                    <button
                        onClick={() => { onWithdraw(withdrawNum); setWithdrawInput(''); }}
                        disabled={withdrawNum <= 0 || withdrawNum > balance}
                        className="w-full px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Withdraw
                    </button>
                </div>
            </div>

            {penaltyPct > 0 && withdrawNum > 0 && withdrawNum <= balance && (
                <div className="text-xs text-orange-600 dark:text-orange-400">
                    You'll receive ${formatNumber(afterPenalty)} after {(penaltyPct * 100).toFixed(0)}% penalty
                </div>
            )}
        </div>
    );
}
