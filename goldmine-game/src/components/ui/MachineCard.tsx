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
        <div className={`p-4 rounded-sm border-2 space-y-3 ${broken ? 'border-frontier-rust bg-frontier-rust/10' : 'frontier-card border-2'}`}>
            <div className="flex items-center justify-between">
                <div className="font-semibold text-frontier-coal dark:text-frontier-bone">{name}</div>
                {broken && (
                    <span className="text-xs font-bold text-frontier-rust bg-frontier-rust/10 px-2 py-0.5 rounded-sm">
                        ⚠️ BROKEN
                    </span>
                )}
                {!broken && (
                    <span className="text-xs text-frontier-dust">
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
                    className="flex-1 frontier-btn-secondary text-sm"
                    style={{ color: 'var(--fw-sage)' }}
                >
                    🔧 Repair ${formatNumber(repairCost)}
                </button>
                <button
                    onClick={onRefuel}
                    disabled={fuel >= 100 || !canAffordRefuel}
                    className="flex-1 px-3 py-2 rounded-sm border border-blue-700 bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold font-body"
                >
                    ⛽ Refuel ${formatNumber(refuelCost)}
                </button>
            </div>
        </div>
    );
}
