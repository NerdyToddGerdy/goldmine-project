import { CHANGELOG } from '../../data/changelog';

export function WhatsNewModal({ lastSeenVersion, onDismiss }: {
    lastSeenVersion: string;
    onDismiss: () => void;
}) {
    const seenIdx = CHANGELOG.findIndex(e => e.version === lastSeenVersion);
    const newEntries = seenIdx === -1 ? CHANGELOG : CHANGELOG.slice(0, seenIdx);

    if (newEntries.length === 0) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4 max-h-[80vh] flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">🆕 What's New</h2>
                <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                    {newEntries.map(entry => (
                        <div key={entry.version}>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-bold text-gray-900 dark:text-gray-100">{entry.version}</span>
                                <span className="text-sm text-gray-500">{entry.title}</span>
                            </div>
                            <ul className="space-y-0.5">
                                {entry.changes.map((c, i) => (
                                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                                        <span className="text-gray-400 flex-shrink-0">•</span>
                                        <span>{c}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onDismiss}
                    className="w-full px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all"
                >
                    Got it!
                </button>
            </div>
        </div>
    );
}
