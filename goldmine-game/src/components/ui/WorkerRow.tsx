import { formatNumber } from '../../utils/format';

export function WorkerRow({
    name,
    count,
    hireCost,
    wage,
    canHire,
    canFire,
    onHire,
    onFire,
    icon,
    description,
    nextHireWage,
    nextHireWouldExceedIncome,
    playerMoney,
}: {
    name: string;
    count: number;
    hireCost: number;
    wage: number;
    canHire: boolean;
    canFire: boolean;
    onHire: () => void;
    onFire: () => void;
    icon?: string;
    description?: string;
    nextHireWage?: number;
    nextHireWouldExceedIncome?: boolean;
    playerMoney?: number;
}) {
    return (
        <div className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {icon && <span>{icon}</span>}
                        <span>{name}</span>
                        <span className="text-sm text-gray-500 font-normal">×{count}</span>
                    </div>
                    {description && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
                    )}
                    {count > 0 && (
                        <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                            💰 ${formatNumber(wage)}/sec total wages
                        </div>
                    )}
                    {nextHireWage !== undefined && nextHireWage > 0 && (
                        <div className={`text-xs mt-0.5 ${nextHireWouldExceedIncome ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                            {nextHireWouldExceedIncome ? '⚠️' : '+'} Next hire: +${formatNumber(nextHireWage)}/sec
                        </div>
                    )}
                    {!canHire && playerMoney !== undefined && hireCost - playerMoney > 0 && (
                        <div className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                            Need ${formatNumber(hireCost - playerMoney)} more
                        </div>
                    )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={onHire}
                        disabled={!canHire}
                        className="px-3 py-2 rounded-lg border border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                        Hire ${formatNumber(hireCost)}
                    </button>
                    <button
                        onClick={onFire}
                        disabled={!canFire}
                        className="px-3 py-2 rounded-lg border border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                    >
                        Fire
                    </button>
                </div>
            </div>
        </div>
    );
}
