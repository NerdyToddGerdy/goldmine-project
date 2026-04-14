import {gameStore, useGameStore} from "../store/gameStore.ts";

export function Controls() {
    const isPaused = useGameStore((s) => s.isPaused)
    const togglePause = () => gameStore.getState().togglePause()
    const tickCount = useGameStore((s) => s.tickCount)

    return (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-sm frontier-card border shadow-sm">
            <button
                className="frontier-btn-secondary px-4 py-2"
                onClick={togglePause}
            >
                {isPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>

            <div className="ml-auto text-xs text-frontier-dust font-body">
                Ticks: {tickCount.toLocaleString()}
            </div>
        </div>
    )
}
