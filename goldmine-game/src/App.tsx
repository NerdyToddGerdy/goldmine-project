import './App.css'
import {Mine} from "./components/Mine.tsx";
import {Town} from "./components/Town.tsx";
import {Settings} from "./components/Settings.tsx";
import {ResourceBar} from "./components/ResourceBar.tsx";
import {ToastContainer} from "./components/ToastContainer.tsx";
import {useGameLoop} from "./hooks/useGameLoop.ts";
import {gameStore, useGameStore, VEHICLE_TIERS, getTravelDurationTicks} from "./store/gameStore.ts";
import {useState, useEffect} from "react";

type Tab = 'mine' | 'town' | 'settings';

function App() {
    useGameLoop()
    const unlockedTown = useGameStore((s) => s.unlockedTown)
    const location = useGameStore((s) => s.location)
    const isTraveling = useGameStore((s) => s.isTraveling)
    const travelProgress = useGameStore((s) => s.travelProgress)
    const travelDestination = useGameStore((s) => s.travelDestination)
    const vehicleTier = useGameStore((s) => s.vehicleTier)
    const [activeTab, setActiveTab] = useState<Tab>('mine')

    // Sync active tab when travel completes
    useEffect(() => {
        if (!isTraveling && (location === 'mine' || location === 'town')) {
            setActiveTab(location);
        }
    }, [isTraveling, location]);

    const handleTravelClick = (dest: 'mine' | 'town') => {
        if (location === dest || isTraveling) return;
        gameStore.getState().startTravel(dest);
    };

    const handleTabClick = (tab: Tab) => {
        if (tab === 'settings') {
            setActiveTab('settings');
        } else {
            handleTravelClick(tab);
        }
    }

    const tierData = VEHICLE_TIERS[vehicleTier as 0|1|2|3];

    const TRAVEL_EMOJIS = { 0: '🚶', 1: '🐴', 2: '🚂', 3: '🚛' } as const;
    const totalTicks = getTravelDurationTicks(vehicleTier);
    const travelPct = totalTicks > 0 ? Math.min(100, (travelProgress / totalTicks) * 100) : 0;
    const secsRemaining = Math.ceil((totalTicks - travelProgress) / 60);
    const emojiLeftPct = travelDestination === 'town' ? travelPct : 100 - travelPct;
    const vehicleEmoji = TRAVEL_EMOJIS[vehicleTier as 0|1|2|3];
    const emojiFlip = travelDestination === 'town' ? 'scaleX(-1)' : '';

    return (
    <div className="w-full h-screen overflow-y-scroll bg-gradient-to-b from-amber-50 to-amber-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <ToastContainer />

        {/* Sticky header — shares scrollbar context with content, so widths always match */}
        <div className="sticky top-0 z-10 bg-amber-50 dark:bg-gray-900">
            <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-0">
                <h1 className="text-2xl font-bold text-amber-900 dark:text-amber-100 mb-2">💎 Gold Mine Tycoon</h1>

                {/* Global Resources */}
                <ResourceBar />

                {/* Tabs */}
                <div className="mt-3 flex gap-2 border-b-2 border-amber-200 dark:border-gray-700">
                    <button
                        onClick={() => handleTabClick('mine')}
                        className={`flex-1 px-6 py-3 font-semibold rounded-t-xl transition-all border-2 ${
                            activeTab === 'mine'
                                ? 'bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-gray-700 border-b-0'
                                : 'bg-white/50 dark:bg-gray-800/50 text-amber-700 dark:text-amber-300 hover:bg-white/80 dark:hover:bg-gray-800/80 border-transparent'
                        }`}
                    >
                        ⛏️ Mine
                    </button>
                    {unlockedTown && (
                        <button
                            onClick={() => handleTabClick('town')}
                            className={`flex-1 px-6 py-3 font-semibold rounded-t-xl transition-all border-2 ${
                                activeTab === 'town'
                                    ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 border-green-200 dark:border-gray-700 border-b-0'
                                    : 'bg-white/50 dark:bg-gray-800/50 text-green-700 dark:text-green-300 hover:bg-white/80 dark:hover:bg-gray-800/80 border-transparent'
                            }`}
                        >
                            🏘️ Town
                        </button>
                    )}
                    <button
                        onClick={() => handleTabClick('settings')}
                        className={`px-6 py-3 font-semibold rounded-t-xl transition-all ml-auto border-2 ${
                            activeTab === 'settings'
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 border-b-0'
                                : 'bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 border-transparent'
                        }`}
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </div>
        </div>

        {/* Content — same scrolling context as header, so no width mismatch */}
        <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
            {/* Travel banner with progress bar + moving emoji */}
            {isTraveling && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-900 text-sm">
                            Traveling to {travelDestination === 'town' ? 'Town' : 'Mine'}... ({tierData.name})
                        </span>
                    </div>
                    <div className="relative h-8">
                        {/* Fill bar — flex so ml-auto anchors fill to right for Mine direction */}
                        <div className="absolute inset-0 bg-amber-100 rounded-full border border-amber-300 overflow-hidden flex">
                            <div
                                className={`h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-100${travelDestination === 'mine' ? ' ml-auto' : ''}`}
                                style={{ width: `${travelPct}%` }}
                            />
                        </div>
                        {/* Seconds label centered over bar */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-amber-900 drop-shadow-sm">{secsRemaining}s</span>
                        </div>
                        {/* Moving emoji */}
                        <div
                            className="absolute top-1/2 text-xl leading-none pointer-events-none transition-all duration-100"
                            style={{
                                left: `${emojiLeftPct}%`,
                                transform: `translateX(-50%) translateY(-50%) ${emojiFlip}`,
                            }}
                        >
                            {vehicleEmoji}
                        </div>
                    </div>
                </div>
            )}

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
