import { ProgressBar } from './ProgressBar';
import { formatNumber } from '../../utils/format';

export function MachineCard({
    name,
    health,
    fuel,
    throughput,
    repairCost,
    refuelCost,
    onRepair,
    onRefuel,
    broken = false,
    canAffordRepair,
    canAffordRefuel,
}: {
    name: string;
    health: number;
    fuel: number;
    throughput: number;
    repairCost: number;
    refuelCost: number;
    onRepair: () => void;
    onRefuel: () => void;
    broken?: boolean;
    canAffordRepair: boolean;
    canAffordRefuel: boolean;
}) {
    return (
        <div className={`p-4 rounded-xl border-2 space-y-3 ${broken ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
            <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-900 dark:text-gray-100">{name}</div>
                {broken && (
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 px-2 py-0.5 rounded-full">
                        ⚠️ BROKEN
                    </span>
                )}
                {!broken && (
                    <span className="text-xs text-gray-500">
                        {formatNumber(throughput)}/sec
                    </span>
                )}
            </div>

            <div className="space-y-2">
                <ProgressBar value={health} max={100} color={health < 30 ? 'red' : 'green'} label="Health" />
                <ProgressBar value={fuel} max={100} color={fuel < 20 ? 'red' : 'blue'} label="Fuel" />
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onRepair}
                    disabled={health >= 100 || !canAffordRepair}
                    className="flex-1 px-3 py-2 rounded-lg border border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                >
                    🔧 Repair ${formatNumber(repairCost)}
                </button>
                <button
                    onClick={onRefuel}
                    disabled={fuel >= 100 || !canAffordRefuel}
                    className="flex-1 px-3 py-2 rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                >
                    ⛽ Refuel ${formatNumber(refuelCost)}
                </button>
            </div>
        </div>
    );
}
