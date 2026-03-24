import {gameStore, useGameStore} from "../store/gameStore.ts";

export function Controls() {
    const isPaused = useGameStore((s) => s.isPaused)
    const togglePause = () => gameStore.getState().togglePause()
    const tickCount = useGameStore((s) => s.tickCount)

    return (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl shadow-sm bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
            <button
                className="px-4 py-2 rounded-xl shadow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow-md active:scale-[0.98] transition-all text-gray-900 dark:text-gray-100"
                onClick={togglePause}
            >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>

            <div className="ml-auto text-xs text-gray-600 dark:text-gray-400 font-mono">
                Ticks: {tickCount.toLocaleString()}
            </div>
        </div>
    )
}