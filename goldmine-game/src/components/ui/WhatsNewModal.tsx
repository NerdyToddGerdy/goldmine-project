import { CHANGELOG } from '../../data/changelog';

export function WhatsNewModal({ lastSeenVersion, onDismiss }: {
    lastSeenVersion: string;
    onDismiss: () => void;
}) {
    const seenIdx = CHANGELOG.findIndex(e => e.version === lastSeenVersion);
    const newEntries = seenIdx === -1 ? CHANGELOG : CHANGELOG.slice(0, seenIdx);

    if (newEntries.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="has-texture bg-frontier-parchment dark:bg-frontier-coal rounded-sm shadow-2xl p-6 max-w-md w-full mx-4 space-y-4 max-h-[80vh] flex flex-col border-2 border-frontier-hide dark:border-frontier-iron" style={{ outline: '1px solid var(--fw-aged)', outlineOffset: '2px' }}>
                <h2 className="font-display text-xl text-frontier-coal dark:text-frontier-bone tracking-wide">📜 What's New</h2>
                <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                    {newEntries.map(entry => (
                        <div key={entry.version}>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-frontier-coal dark:text-frontier-bone font-body">{entry.version}</span>
                                <span className="text-sm text-frontier-dust">{entry.title}</span>
                            </div>
                            <ul className="space-y-0.5">
                                {entry.changes.map((c, i) => (
                                    <li key={i} className="text-sm text-frontier-dirt dark:text-frontier-aged flex gap-2">
                                        <span className="text-frontier-iron flex-shrink-0">•</span>
                                        <span>{c}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onDismiss}
                    className="w-full frontier-btn-primary"
                >
                    Got it!
                </button>
            </div>
        </div>
    );
}
