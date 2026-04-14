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
        <div className="p-4 frontier-card border-2 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
                <div className="font-semibold text-frontier-coal dark:text-frontier-bone">
                    {icon} {name}
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold tabular-nums text-frontier-coal dark:text-frontier-bone">
                        ${formatNumber(balance)}
                    </div>
                    <div className="text-xs text-frontier-sage">
                        +{(interestRate * 100).toFixed(1)}%/min
                    </div>
                    {riskDescription && (
                        <div className="text-xs text-frontier-ember">{riskDescription}</div>
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
                            className="frontier-input w-full text-sm py-1.5"
                        />
                        <button
                            onClick={() => setDepositInput(maxDeposit.toFixed(2))}
                            className="frontier-btn-ghost px-2 py-1.5 text-xs whitespace-nowrap"
                        >
                            Max
                        </button>
                    </div>
                    <button
                        onClick={() => { onDeposit(depositNum); setDepositInput(''); }}
                        disabled={depositNum <= 0 || !canAffordDeposit(depositNum)}
                        className="w-full frontier-btn-primary text-sm py-1.5"
                        style={{ background: 'linear-gradient(to bottom, var(--fw-sage), var(--fw-pine))', borderColor: 'var(--fw-pine)' }}
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
                            className="frontier-input w-full text-sm py-1.5"
                        />
                        <button
                            onClick={() => setWithdrawInput(balance.toFixed(2))}
                            className="frontier-btn-ghost px-2 py-1.5 text-xs whitespace-nowrap"
                        >
                            Max
                        </button>
                    </div>
                    <button
                        onClick={() => { onWithdraw(withdrawNum); setWithdrawInput(''); }}
                        disabled={withdrawNum <= 0 || withdrawNum > balance}
                        className="w-full frontier-btn-primary text-sm py-1.5"
                    >
                        Withdraw
                    </button>
                </div>
            </div>

            {penaltyPct > 0 && withdrawNum > 0 && withdrawNum <= balance && (
                <div className="text-xs text-frontier-ember">
                    You'll receive ${formatNumber(afterPenalty)} after {(penaltyPct * 100).toFixed(0)}% penalty
                </div>
            )}
        </div>
    );
}
