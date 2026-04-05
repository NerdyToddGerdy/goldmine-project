import { gameStore, useGameStore, CERT_FEE, GOLD_BAR_CERTIFIED_BONUS } from '../store/gameStore';

export function Assayer() {
    const gold = useGameStore(s => s.gold);
    const goldBars = useGameStore(s => s.goldBars);
    const goldBarsCertified = useGameStore(s => s.goldBarsCertified);
    const hasFurnace = useGameStore(s => s.hasFurnace);
    const assayerLevel = useGameStore(s => s.npcLevels.assayer);
    const employees = useGameStore(s => s.employees);
    const hasCertifier = employees.some(e => e.assignedRole === 'certifier');

    if (!hasFurnace) {
        return (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl text-center space-y-1">
                <div className="text-2xl">⚖️</div>
                <p className="text-sm font-semibold text-amber-800">Assayer Office</p>
                <p className="text-xs text-amber-600">Requires a Furnace to produce certifiable gold bars.</p>
            </div>
        );
    }

    const canCertify = gold >= CERT_FEE && goldBars >= 0.001;
    const certifiedBonus = ((GOLD_BAR_CERTIFIED_BONUS - 1) * 100).toFixed(0);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-amber-800">⚖️ Assayer Office</h3>
            <p className="text-xs text-amber-700">
                Certified bars yield <span className="font-semibold">+{certifiedBonus}% gold</span> when collected.
                Pay {CERT_FEE} oz to certify all bars in hand.
            </p>

            {/* Current inventory */}
            <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Uncertified Bars</p>
                    <p className="text-lg font-bold text-gray-800">{goldBars.toFixed(2)} oz</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-center">
                    <p className="text-xs text-amber-600 mb-0.5">Certified Bars</p>
                    <p className="text-lg font-bold text-amber-800">{goldBarsCertified.toFixed(2)} oz</p>
                    {goldBarsCertified > 0 && (
                        <p className="text-xs text-amber-600">→ {(goldBarsCertified * GOLD_BAR_CERTIFIED_BONUS).toFixed(2)} oz on collect</p>
                    )}
                </div>
            </div>

            {/* Certify button */}
            <div className="p-3 rounded-xl border border-gray-200 bg-white space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Flat certification fee</span>
                    <span className="font-semibold text-gray-700">{CERT_FEE} oz gold</span>
                </div>
                <button
                    onClick={() => gameStore.getState().certifyBars()}
                    disabled={!canCertify}
                    className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Certify All Bars ({CERT_FEE} oz)
                </button>
                {!canCertify && goldBars < 0.001 && (
                    <p className="text-xs text-gray-400 text-center">No uncertified bars in inventory</p>
                )}
                {!canCertify && goldBars >= 0.001 && gold < CERT_FEE && (
                    <p className="text-xs text-red-400 text-center">Not enough gold (need {CERT_FEE} oz)</p>
                )}
            </div>

            {/* Certifier slot — unlocks at Assayer Level 2 */}
            {assayerLevel >= 2 ? (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 space-y-1">
                    <p className="text-xs font-semibold text-amber-800">⚖️ Certifier Slot</p>
                    <p className="text-xs text-amber-700">
                        {hasCertifier
                            ? 'Certifier is active — bars will be auto-certified periodically.'
                            : 'Assign a Certifier in the Hiring Hall to automate certification.'}
                    </p>
                </div>
            ) : (
                <div className="p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                    <p className="text-xs text-gray-400 text-center">🔒 Certifier slot unlocks at Assayer Level 2</p>
                </div>
            )}
        </div>
    );
}
