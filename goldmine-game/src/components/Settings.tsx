import { gameStore } from "../store/gameStore";
import { useState, useEffect } from "react";

export function Settings() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const saved = localStorage.getItem('theme');
        return (saved === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    const handleSoftReset = () => {
        if (confirm('Reset this run? This will clear your current progress but keep meta upgrades.')) {
            gameStore.getState().reset();
        }
    };

    const handleHardReset = () => {
        if (confirm('Are you sure? This will delete ALL progress and reset the game completely.')) {
            gameStore.getState().hardResetSave();
            window.location.reload();
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">⚙️ Settings</h2>

            {/* Theme Settings */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Appearance</h3>

                <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100">Theme</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Current: {theme === 'light' ? 'Light' : 'Dark'} Mode
                            </div>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className="px-4 py-2 rounded-xl shadow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                        >
                            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Options */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Reset Options</h3>

                <div className="p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="space-y-3">
                        <div>
                            <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Soft Reset</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Resets current run progress while keeping meta upgrades
                            </div>
                            <button
                                onClick={handleSoftReset}
                                className="px-4 py-2 rounded-xl shadow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all"
                            >
                                🔄 Soft Reset
                            </button>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                            <div className="font-semibold text-red-700 dark:text-red-400 mb-1">Hard Reset</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Deletes ALL progress and resets the entire game
                            </div>
                            <button
                                onClick={handleHardReset}
                                className="px-4 py-2 rounded-xl shadow border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-all"
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
