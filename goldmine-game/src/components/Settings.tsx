import { gameStore, useGameStore } from "../store/gameStore";
import { SCHEMA_VERSION } from "../store/schema";
import { CHANGELOG } from "../data/changelog";
import { formatNumber } from "../utils/format";
import { useState, useRef } from "react";

function ChangelogSection() {
    const [open, setOpen] = useState(false);

    return (
        <div className="space-y-3">
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between text-sm font-semibold text-frontier-bone text-left"
            >
                <span className="font-display tracking-wide">📋 Changelog</span>
                <span className="text-xs text-frontier-dust font-body">{open ? '▲ Hide' : '▼ Show'}</span>
            </button>

            {open && (
                <div className="space-y-3">
                    {CHANGELOG.map((entry) => (
                        <div
                            key={entry.version}
                            className="frontier-card border-2 rounded-sm p-3 space-y-2"
                        >
                            <div className="flex items-baseline justify-between gap-2">
                                <span className="text-xs font-semibold font-body">
                                    {entry.version} — {entry.title}
                                </span>
                                <span className="text-xs text-frontier-dust flex-shrink-0 font-body">{entry.date}</span>
                            </div>
                            <ul className="space-y-1">
                                {entry.changes.map((change, i) => (
                                    <li key={i} className="text-xs text-frontier-dust flex gap-2 font-body">
                                        <span className="text-frontier-dust flex-shrink-0">•</span>
                                        <span>{change}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function formatTimePlayed(ticks: number): string {
    const totalSeconds = Math.floor(ticks / 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Settings() {
    const darkMode = useGameStore((s) => s.darkMode);
    const devMode = useGameStore((s) => s.devMode);
    const timePlayed = useGameStore((s) => s.timePlayed);
    const seasonNumber = useGameStore((s) => s.seasonNumber);
    const totalGoldExtracted = useGameStore((s) => s.totalGoldExtracted);

    const [hardResetInput, setHardResetInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleToggleDark = () => {
        gameStore.getState().setDarkMode(!darkMode);
    };

    const handleExport = () => {
        const json = gameStore.getState().exportSave();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'goldmine-save.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        setImportError(null);
        setImportSuccess(false);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            try {
                JSON.parse(text); // validate JSON before passing to store
                gameStore.getState().importSave(text);
                setImportSuccess(true);
                setImportError(null);
            } catch {
                setImportError('Invalid save file — could not parse JSON.');
            }
        };
        reader.readAsText(file);
        // Reset input so re-importing the same file works
        e.target.value = '';
    };

    const handleSoftReset = () => {
        if (confirm('Reset this run? This will clear your current progress but keep settings.')) {
            gameStore.getState().reset();
        }
    };

    const handleHardReset = () => {
        if (hardResetInput !== 'RESET') return;
        gameStore.getState().hardResetSave();
        window.location.reload();
    };

    return (
        <div className="space-y-6">
            <h2 className="font-display text-base text-frontier-bone tracking-wide">⚙️ Settings</h2>

            {/* Stats */}
            <div className="frontier-card border-2 rounded-sm p-3 space-y-2">
                <h3 className="frontier-label">Game Info</h3>
                <div className="flex justify-between text-xs">
                    <span className="text-frontier-dust font-body">Time Played</span>
                    <span className="font-mono font-semibold">{formatTimePlayed(timePlayed)}</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-frontier-dust font-body">Save Version</span>
                    <span className="font-mono text-frontier-dust">v{SCHEMA_VERSION}</span>
                </div>
            </div>

            {/* Lifetime Stats */}
            <div className="frontier-card border-2 rounded-sm p-3 space-y-2">
                <h3 className="frontier-label">Lifetime Stats</h3>
                <div className="flex justify-between text-xs">
                    <span className="text-frontier-dust font-body">Total Gold Extracted</span>
                    <span className="font-semibold tabular-nums text-frontier-nugget font-body">✨ {formatNumber(totalGoldExtracted)} oz</span>
                </div>
                <div className="flex justify-between text-xs">
                    <span className="text-frontier-dust font-body">Season</span>
                    <span className="font-semibold tabular-nums text-frontier-ember font-body">❄️ {seasonNumber}</span>
                </div>
            </div>

            {/* Appearance */}
            <div className="space-y-3">
                <h3 className="font-display text-sm text-frontier-bone tracking-wide">Appearance</h3>
                <div className="frontier-card border-2 rounded-sm p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-semibold font-body">Theme</div>
                            <div className="text-xs text-frontier-dust font-body">
                                {darkMode ? 'Dark Mode' : 'Light Mode'}
                            </div>
                        </div>
                        <button
                            onClick={handleToggleDark}
                            className="frontier-btn-secondary text-xs px-3 py-1.5"
                        >
                            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Management */}
            <div className="space-y-3">
                <h3 className="font-display text-sm text-frontier-bone tracking-wide">Save File</h3>
                <div className="frontier-card border-2 rounded-sm p-3 space-y-3">
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="flex-1 frontier-btn-secondary text-xs px-3 py-2"
                        >
                            ⬇️ Export Save
                        </button>
                        <button
                            onClick={handleImportClick}
                            className="flex-1 frontier-btn-secondary text-xs px-3 py-2"
                        >
                            ⬆️ Import Save
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,application/json"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    {importSuccess && (
                        <div className="text-xs text-frontier-sage text-center font-semibold font-body">
                            ✅ Save imported successfully!
                        </div>
                    )}
                    {importError && (
                        <div className="text-xs text-frontier-rust text-center font-semibold font-body">
                            ❌ {importError}
                        </div>
                    )}
                </div>
            </div>

            {/* Changelog */}
            <ChangelogSection />

            {/* Reset Options */}
            <div className="space-y-3">
                <h3 className="font-display text-sm text-frontier-bone tracking-wide">Reset Options</h3>
                <div className="frontier-card border-2 rounded-sm p-3 space-y-4">
                    <div>
                        <div className="text-xs font-semibold mb-1 font-body">Soft Reset</div>
                        <div className="text-xs text-frontier-dust mb-2 font-body">
                            Clears current run progress, keeps settings and time played.
                        </div>
                        <button
                            onClick={handleSoftReset}
                            className="frontier-btn-secondary text-xs px-3 py-1.5"
                        >
                            🔄 Soft Reset
                        </button>
                    </div>

                    <div className="border-t border-frontier-hide/40 pt-4">
                        <div className="text-xs font-semibold text-frontier-rust mb-1 font-body">Hard Reset</div>
                        <div className="text-xs text-frontier-dust mb-2 font-body">
                            Deletes ALL progress. Type <span className="font-mono font-bold">RESET</span> to confirm.
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={hardResetInput}
                                onChange={(e) => setHardResetInput(e.target.value)}
                                placeholder="Type RESET"
                                className="frontier-input flex-1 text-xs font-mono"
                            />
                            <button
                                onClick={handleHardReset}
                                disabled={hardResetInput !== 'RESET'}
                                className="frontier-btn-danger text-xs px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                ⚠️ Hard Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dev mode toggle */}
            <div className="pt-2 border-t border-frontier-iron/40 text-center">
                <button
                    onClick={() => gameStore.getState().toggleDevMode()}
                    className="text-xs text-frontier-dust hover:text-frontier-aged transition-colors font-body"
                >
                    {devMode ? '🛠️ Dev mode ON — Ctrl+Shift+D to toggle' : '🛠️ Enable dev mode'}
                </button>
            </div>
        </div>
    );
}
