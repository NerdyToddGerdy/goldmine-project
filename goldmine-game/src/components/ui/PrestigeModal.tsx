import { formatNumber } from '../../utils/format';
import { VEHICLE_TIERS, countAssigned, type Employee } from '../../store/gameStore';

export function PrestigeModal({
    dustReward,
    legacyDust,
    gold,
    employees,
    hasSluiceBox,
    hasFurnace,
    vehicleTier,
    onConfirm,
    onCancel,
}: {
    dustReward: number;
    legacyDust: number;
    gold: number;
    employees: Employee[];
    hasSluiceBox: boolean;
    hasFurnace: boolean;
    vehicleTier: number;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const miners = countAssigned(employees, 'miner');
    const prospectors = countAssigned(employees, 'prospector');
    const sluiceOps = countAssigned(employees, 'sluiceOperator');
    const furnaceOps = countAssigned(employees, 'furnaceOperator');

    const lossList: string[] = [];
    if (gold > 0) lossList.push(`✨ ${formatNumber(gold)} oz gold`);
    if (miners > 0) lossList.push(`👷 ${miners} Miner${miners !== 1 ? 's' : ''}`);
    if (prospectors > 0) lossList.push(`🧑‍🔬 ${prospectors} Prospector${prospectors !== 1 ? 's' : ''}`);
    if (sluiceOps > 0) lossList.push(`🚿 ${sluiceOps} Sluice Operator${sluiceOps !== 1 ? 's' : ''}`);
    if (furnaceOps > 0) lossList.push(`⚗️ ${furnaceOps} Furnace Operator${furnaceOps !== 1 ? 's' : ''}`);
    if (hasSluiceBox) lossList.push('🚿 Sluice Box');
    if (hasFurnace) lossList.push('⚗️ Furnace');
    if (vehicleTier > 0) lossList.push(`🚗 ${VEHICLE_TIERS[vehicleTier as 1 | 2 | 3].name}`);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="has-texture bg-frontier-parchment dark:bg-frontier-coal rounded-sm shadow-2xl p-6 max-w-sm w-full mx-4 space-y-5 max-h-[90vh] overflow-y-auto border-2 border-frontier-hide dark:border-frontier-iron" style={{ outline: '1px solid var(--fw-aged)', outlineOffset: '2px' }}>
                <div className="text-center space-y-2">
                    <div className="text-5xl">⭐</div>
                    <h2 className="font-display text-2xl text-frontier-coal dark:text-frontier-bone tracking-wide">
                        New Creek Run
                    </h2>
                    <p className="text-frontier-dust text-sm">
                        Start fresh at a new creek site. Your progress resets, but you keep your
                        Legacy Gold Dust and any permanent upgrades.
                    </p>
                </div>

                <div className="rounded-sm p-4 text-center border-2 border-frontier-nugget/40 bg-frontier-nugget/10">
                    <div className="text-sm text-frontier-nugget font-semibold uppercase tracking-wide">
                        You'll earn
                    </div>
                    <div className="text-3xl font-bold text-frontier-nugget mt-1">
                        ✨ {formatNumber(dustReward)} Legacy Dust
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {/* What you lose */}
                    {lossList.length > 0 && (
                        <div className="rounded-sm p-3 border border-frontier-rust/40 bg-frontier-rust/10">
                            <div className="text-xs font-semibold uppercase tracking-wide text-frontier-rust mb-2">
                                ❌ Losing
                            </div>
                            <ul className="space-y-1">
                                {lossList.map((item, i) => (
                                    <li key={i} className="text-xs text-frontier-dirt dark:text-frontier-aged">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* What you keep */}
                    <div className={`rounded-sm p-3 border border-frontier-sage/40 bg-frontier-sage/10 ${lossList.length === 0 ? 'col-span-2' : ''}`}>
                        <div className="text-xs font-semibold uppercase tracking-wide text-frontier-sage mb-2">
                            ✅ Keeping
                        </div>
                        <ul className="space-y-1">
                            <li className="text-xs text-frontier-dirt dark:text-frontier-aged">
                                ✨ Dust: {formatNumber(legacyDust)} → {formatNumber(legacyDust + dustReward)}
                            </li>
                            <li className="text-xs text-frontier-dirt dark:text-frontier-aged">
                                All Legacy upgrades
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 frontier-btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 frontier-btn-primary"
                    >
                        Prestige!
                    </button>
                </div>
            </div>
        </div>
    );
}
