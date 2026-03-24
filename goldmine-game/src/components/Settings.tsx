import { gameStore, useGameStore } from "../store/gameStore";
import { SCHEMA_VERSION } from "../store/schema";
import { useState, useRef } from "react";

function formatTimePlayed(ticks: number): string {
    const totalSeconds = Math.floor(ticks / 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Settings() {
    const darkMode = useGameStore((s) => s.darkMode);
    const timePlayed = useGameStore((s) => s.timePlayed);

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">⚙️ Settings</h2>

            {/* Stats */}
            <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Game Info</h3>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Time Played</span>
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{formatTimePlayed(timePlayed)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Save Version</span>
                    <span className="font-mono text-gray-500 dark:text-gray-400">v{SCHEMA_VERSION}</span>
                </div>
            </div>

            {/* Appearance */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Appearance</h3>
                <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">Theme</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                {darkMode ? 'Dark Mode' : 'Light Mode'}
                            </div>
                        </div>
                        <button
                            onClick={handleToggleDark}
                            className="px-4 py-2 rounded-xl shadow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                        >
                            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Save Management */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Save File</h3>
                <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                    <div className="flex gap-3">
                        <button
                            onClick={handleExport}
                            className="flex-1 px-4 py-2 rounded-xl border border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all font-semibold"
                        >
                            ⬇️ Export Save
                        </button>
                        <button
                            onClick={handleImportClick}
                            className="flex-1 px-4 py-2 rounded-xl border border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 transition-all font-semibold"
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
                        <div className="text-sm text-green-700 dark:text-green-400 text-center font-semibold">
                            ✅ Save imported successfully!
                        </div>
                    )}
                    {importError && (
                        <div className="text-sm text-red-600 dark:text-red-400 text-center font-semibold">
                            ❌ {importError}
                        </div>
                    )}
                </div>
            </div>

            {/* Reset Options */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Reset Options</h3>
                <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl space-y-4">
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Soft Reset</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Clears current run progress, keeps settings and time played.
                        </div>
                        <button
                            onClick={handleSoftReset}
                            className="px-4 py-2 rounded-xl shadow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                        >
                            🔄 Soft Reset
                        </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="font-semibold text-red-700 dark:text-red-400 mb-1">Hard Reset</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Deletes ALL progress. Type <span className="font-mono font-bold">RESET</span> to confirm.
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={hardResetInput}
                                onChange={(e) => setHardResetInput(e.target.value)}
                                placeholder="Type RESET"
                                className="flex-1 px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-mono"
                            />
                            <button
                                onClick={handleHardReset}
                                disabled={hardResetInput !== 'RESET'}
                                className="px-4 py-2 rounded-xl shadow border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                            >
                                ⚠️ Hard Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}