import { gameStore, useGameStore, CERT_FEE, GOLD_BAR_CERTIFIED_BONUS } from '../store/gameStore';

export function Assayer() {
    const gold = useGameStore(s => s.gold);
    const goldBarsAtMine = useGameStore(s => s.goldBarsAtMine);
    const goldBarsCertified = useGameStore(s => s.goldBarsCertified);
    const hasFurnace = useGameStore(s => s.hasFurnace);
    const assayerLevel = useGameStore(s => s.npcLevels.assayer);
    const employees = useGameStore(s => s.employees);
    const hasCertifier = employees.some(e => e.assignedRole === 'certifier');

    if (!hasFurnace) {
        return (
            <div className="frontier-panel text-center space-y-1">
                <div className="text-2xl">⚖️</div>
                <p className="text-sm font-semibold text-frontier-bone">Assayer Office</p>
                <p className="text-xs text-frontier-dust">Requires a Furnace to produce certifiable gold bars.</p>
            </div>
        );
    }

    const canCertify = gold >= CERT_FEE && goldBarsAtMine >= 0.001;
    const certifiedBonus = ((GOLD_BAR_CERTIFIED_BONUS - 1) * 100).toFixed(0);

    return (
        <div className="space-y-4">
            <h3 className="font-display text-base text-frontier-bone tracking-wide">⚖️ Assayer Office</h3>
            <p className="text-xs text-frontier-dust">
                Certified bars yield <span className="font-semibold text-frontier-nugget">+{certifiedBonus}% gold</span> when collected.
                Pay {CERT_FEE} oz to certify all bars at the mine.
            </p>

            {/* Current inventory */}
            <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-sm bg-frontier-coal/30 border border-frontier-iron/40 text-center">
                    <p className="text-xs text-frontier-dust mb-0.5">Bars at Mine</p>
                    <p className="text-lg font-bold text-frontier-bone">{goldBarsAtMine.toFixed(2)} oz</p>
                </div>
                <div className="p-3 rounded-sm bg-frontier-nugget/10 border border-frontier-nugget/40 text-center">
                    <p className="text-xs text-frontier-nugget mb-0.5">Certified Bars</p>
                    <p className="text-lg font-bold text-frontier-nugget">{goldBarsCertified.toFixed(2)} oz</p>
                    {goldBarsCertified > 0 && (
                        <p className="text-xs text-frontier-ember">→ {(goldBarsCertified * GOLD_BAR_CERTIFIED_BONUS).toFixed(2)} oz on delivery</p>
                    )}
                </div>
            </div>

            {/* Certify button */}
            <div className="frontier-card rounded-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-frontier-dust">
                    <span>Flat certification fee</span>
                    <span className="font-semibold text-frontier-bone">{CERT_FEE} oz gold</span>
                </div>
                <button
                    onClick={() => gameStore.getState().certifyBars()}
                    disabled={!canCertify}
                    className="w-full frontier-btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Certify All Bars ({CERT_FEE} oz)
                </button>
                {!canCertify && goldBarsAtMine < 0.001 && (
                    <p className="text-xs text-frontier-dust text-center">No uncertified bars at the mine</p>
                )}
                {!canCertify && goldBarsAtMine >= 0.001 && gold < CERT_FEE && (
                    <p className="text-xs text-frontier-rust text-center">Not enough gold (need {CERT_FEE} oz)</p>
                )}
            </div>

            {/* Certifier slot */}
            {assayerLevel >= 2 ? (
                <div className="p-3 rounded-sm border border-frontier-nugget/30 bg-frontier-nugget/5 space-y-1">
                    <p className="text-xs font-semibold text-frontier-bone">⚖️ Certifier Slot</p>
                    <p className="text-xs text-frontier-dust">
                        {hasCertifier
                            ? 'Certifier is active — bars will be auto-certified periodically.'
                            : 'Assign a Certifier in the Hiring Hall to automate certification.'}
                    </p>
                </div>
            ) : (
                <div className="p-3 rounded-sm border border-dashed border-frontier-iron/40 bg-frontier-coal/20">
                    <p className="text-xs text-frontier-dust text-center">🔒 Certifier slot unlocks at Assayer Level 2</p>
                </div>
            )}
        </div>
    );
}
