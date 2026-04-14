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
        <div className="w-full p-4 frontier-card border-2 rounded-sm">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-frontier-coal dark:text-frontier-bone flex items-center gap-2">
                        {icon && <span>{icon}</span>}
                        <span>{name}</span>
                        <span className="text-sm text-frontier-dust font-normal">×{count}</span>
                    </div>
                    {description && (
                        <div className="text-sm text-frontier-dust mt-0.5">{description}</div>
                    )}
                    {count > 0 && (
                        <div className="text-xs text-frontier-ember mt-1">
                            💰 ${formatNumber(wage)}/sec total wages
                        </div>
                    )}
                    {nextHireWage !== undefined && nextHireWage > 0 && (
                        <div className={`text-xs mt-0.5 ${nextHireWouldExceedIncome ? 'text-frontier-rust font-semibold' : 'text-frontier-dust'}`}>
                            {nextHireWouldExceedIncome ? '⚠️' : '+'} Next hire: +${formatNumber(nextHireWage)}/sec
                        </div>
                    )}
                    {!canHire && playerMoney !== undefined && hireCost - playerMoney > 0 && (
                        <div className="text-xs text-frontier-rust mt-0.5">
                            Need ${formatNumber(hireCost - playerMoney)} more
                        </div>
                    )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <button
                        onClick={onHire}
                        disabled={!canHire}
                        className="frontier-btn-secondary text-sm px-3 py-2"
                        style={{ color: 'var(--fw-sage)' }}
                    >
                        Hire ${formatNumber(hireCost)}
                    </button>
                    <button
                        onClick={onFire}
                        disabled={!canFire}
                        className="frontier-btn-danger text-sm px-3 py-2"
                    >
                        Fire
                    </button>
                </div>
            </div>
        </div>
    );
}
