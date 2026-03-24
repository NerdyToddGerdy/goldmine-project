import './App.css'
import {Mine} from "./components/Mine.tsx";
import {Town} from "./components/Town.tsx";
import {Settings} from "./components/Settings.tsx";
import {ResourceBar} from "./components/ResourceBar.tsx";
import {ToastContainer} from "./components/ToastContainer.tsx";
import {useGameLoop} from "./hooks/useGameLoop.ts";
import {gameStore, useGameStore} from "./store/gameStore.ts";
import {useState} from "react";

type Tab = 'mine' | 'town' | 'settings';

function App() {
    useGameLoop()
    const unlockedTown = useGameStore((s) => s.unlockedTown)
    const [activeTab, setActiveTab] = useState<Tab>('mine')

    const setLocation = (loc: 'mine' | 'town') => {
        gameStore.getState().travelTo(loc);
        setActiveTab(loc);
    }

    const handleTabClick = (tab: Tab) => {
        if (tab === 'settings') {
            setActiveTab('settings');
        } else {
            setLocation(tab);
        }
    }

    return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <ToastContainer />
        <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">💎 Gold Mine Tycoon</h1>

            {/* Global Resources */}
            <ResourceBar />

            {/* Tabs */}
            <div className="flex gap-2 border-b-2 border-amber-200 dark:border-gray-700">
                <button
                    onClick={() => handleTabClick('mine')}
                    className={`px-6 py-3 font-semibold rounded-t-xl transition-all ${
                        activeTab === 'mine'
                            ? 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border-2 border-b-0 border-amber-200 dark:border-gray-700'
                            : 'bg-white/50 dark:bg-gray-800/50 text-amber-700 dark:text-amber-300 hover:bg-white/80 dark:hover:bg-gray-800/80'
                    }`}
                >
                    ⛏️ Mine
                </button>
                {unlockedTown && (
                    <button
                        onClick={() => handleTabClick('town')}
                        className={`px-6 py-3 font-semibold rounded-t-xl transition-all ${
                            activeTab === 'town'
                                ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border-2 border-b-0 border-green-200 dark:border-gray-700'
                                : 'bg-white/50 dark:bg-gray-800/50 text-green-700 dark:text-green-300 hover:bg-white/80 dark:hover:bg-gray-800/80'
                        }`}
                    >
                        🏘️ Town
                    </button>
                )}
                <button
                    onClick={() => handleTabClick('settings')}
                    className={`px-6 py-3 font-semibold rounded-t-xl transition-all ml-auto ${
                        activeTab === 'settings'
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-2 border-b-0 border-gray-200 dark:border-gray-700'
                            : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80'
                    }`}
                >
                    ⚙️ Settings
                </button>
            </div>

            {/* Tab content */}
            <div>
                {activeTab === 'mine' && <Mine />}
                {activeTab === 'town' && <Town />}
                {activeTab === 'settings' && <Settings />}
            </div>
        </div>
    </div>
    );
}

export default App
