import './App.css'
import {Mine} from "./components/Mine.tsx";
import {Town} from "./components/Town.tsx";
import {Settings} from "./components/Settings.tsx";
import {DevPanel} from "./components/DevPanel.tsx";
import {ResourceBar} from "./components/ResourceBar.tsx";
import {ToastContainer} from "./components/ToastContainer.tsx";
import {WhatsNewModal} from "./components/ui";
import {useGameLoop} from "./hooks/useGameLoop.ts";
import {gameStore, useGameStore} from "./store/gameStore.ts";
import {CHANGELOG} from "./data/changelog.ts";
import {useState, useEffect} from "react";

type Tab = 'mine' | 'town' | 'settings' | 'dev';

function App() {
    useGameLoop()
    const unlockedTown = useGameStore((s) => s.unlockedTown)
    const location = useGameStore((s) => s.location)
    const isTraveling = useGameStore((s) => s.isTraveling)
    const lastSeenChangelogVersion = useGameStore((s) => s.lastSeenChangelogVersion)
    const devMode = useGameStore((s) => s.devMode)
    const showWhatsNew = lastSeenChangelogVersion !== CHANGELOG[0].version
    const [activeTab, setActiveTab] = useState<Tab>('mine')

    // Sync active tab when travel completes
    useEffect(() => {
        if (!isTraveling && (location === 'mine' || location === 'town')) {
            setActiveTab(location);
        }
    }, [isTraveling, location]);

    // Reset to mine tab when dev mode is turned off
    useEffect(() => {
        if (!devMode && activeTab === 'dev') setActiveTab('mine');
    }, [devMode]);

    // Keyboard shortcut: Ctrl+Shift+D toggles dev mode
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                gameStore.getState().toggleDevMode();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleTravelClick = (dest: 'mine' | 'town') => {
        if (location === dest || isTraveling) return;
        gameStore.getState().startTravel(dest);
    };

    const handleTabClick = (tab: Tab) => {
        if (tab === 'settings' || tab === 'dev') {
            setActiveTab(tab);
        } else if (location === tab) {
            setActiveTab(tab);
        } else {
            handleTravelClick(tab);
        }
    }

    const bgClass = ({
        mine:     'frontier-bg-mine',
        town:     'frontier-bg-town',
        settings: 'frontier-bg-mine',
        dev:      'frontier-bg-mine',
    } as Record<Tab, string>)[activeTab];

    return (
    <div className={`w-full h-screen overflow-y-scroll transition-colors duration-500 ${bgClass}`}>
        <ToastContainer />
        {showWhatsNew && (
            <WhatsNewModal
                lastSeenVersion={lastSeenChangelogVersion}
                onDismiss={() => gameStore.getState().setLastSeenChangelogVersion(CHANGELOG[0].version)}
            />
        )}

        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-frontier-coal border-b border-frontier-iron/60 shadow-lg">
            <div className="w-full max-w-4xl mx-auto px-4 pt-4 pb-0">
                <h1 className="font-display text-base text-frontier-nugget tracking-widest uppercase mb-2">⛏ Gold Mine Tycoon</h1>

                {/* Global Resources */}
                <ResourceBar />

                {/* Tabs */}
                <div className="mt-3 frontier-tab-bar">
                    <button
                        onClick={() => handleTabClick('mine')}
                        className={activeTab === 'mine' ? 'frontier-tab-active' : 'frontier-tab-inactive'}
                    >
                        ⛏️ Mine
                    </button>
                    {unlockedTown && (
                        <button
                            onClick={() => handleTabClick('town')}
                            className={activeTab === 'town' ? 'frontier-tab-active' : 'frontier-tab-inactive'}
                        >
                            🏘️ Town
                        </button>
                    )}
                    <button
                        onClick={() => handleTabClick('settings')}
                        className={`${activeTab === 'settings' ? 'frontier-tab-active' : 'frontier-tab-inactive'} ml-auto`}
                    >
                        ⚙️ Settings
                    </button>
                    {devMode && (
                        <button
                            onClick={() => setActiveTab('dev')}
                            className={activeTab === 'dev' ? 'frontier-tab-active' : 'frontier-tab-inactive'}
                        >
                            🛠️ Dev
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="w-full max-w-4xl mx-auto px-4 py-4 space-y-4">
            <div key={activeTab} className="motion-safe:animate-tab-enter">
                {activeTab === 'mine' && <Mine />}
                {activeTab === 'town' && <Town />}
                {activeTab === 'settings' && <Settings />}
                {activeTab === 'dev' && <DevPanel />}
            </div>
        </div>
    </div>
    );
}

export default App
