import { formatNumber } from '../../utils/format';

export function UpgradeButton({
    name,
    description,
    cost,
    currentLevel,
    maxLevel,
    locked = false,
    canAfford,
    onBuy,
    icon,
    playerMoney,
}: {
    name: string;
    description: string;
    cost: number;
    currentLevel?: number;
    maxLevel?: number;
    locked?: boolean;
    canAfford: boolean;
    onBuy: () => void;
    icon?: string;
    playerMoney?: number;
}) {
    if (locked) return null;
    const maxed = maxLevel !== undefined && currentLevel !== undefined && currentLevel >= maxLevel;
    const disabled = maxed || !canAfford;
    const shortage = !canAfford && !locked && !maxed && playerMoney !== undefined
        ? cost - playerMoney
        : 0;

    return (
        <button
            onClick={onBuy}
            disabled={disabled}
            className="w-full p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-amber-400 dark:hover:border-amber-500 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        {icon && <span>{icon}</span>}
                        <span>{name}</span>
                        {currentLevel !== undefined && (
                            <span className="text-xs text-gray-500 font-normal">
                                Lv {currentLevel}{maxLevel ? `/${maxLevel}` : ''}
                            </span>
                        )}
                        {maxed && <span className="text-xs text-amber-600 font-semibold">MAX</span>}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</div>
                    {shortage > 0 && (
                        <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                            Need {formatNumber(shortage)} oz more
                        </div>
                    )}
                </div>
                {!maxed && !locked && (
                    <div className={`text-base font-bold flex-shrink-0 ${canAfford ? 'text-green-600' : 'text-red-500'}`}>
                        {formatNumber(cost)} oz
                    </div>
                )}
            </div>
        </button>
    );
}
