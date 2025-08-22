import {useGameStore} from "../store/gameStore.ts";

export function Controls    () {
    const isPaused = useGameStore((s) => s.isPaused)
    const togglePause = useGameStore((s) => s.togglePause)
    const timeScale = useGameStore((s) => s.timeScale)
    const setTimeScale = useGameStore((s) => s.setTimeScale)
    const reset = useGameStore((s) => s.reset)
    const tickCount = useGameStore((s) => s.tickCount)

    return (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl shadoe-sm bg-white/70">
            <button className="px-4 py-2 rounded-xl shadow border hover:shadow-md active:scale-[0.98]"
                    onClick={togglePause}>\
                {isPaused ? 'Resume' : 'Pause'}
            </button>
            <label className="flex items-center gap-2">
                <span className="text-sm">Speed</span>
                <input
                    type="range"
                    min={0}
                    max={3}
                    step={0.1}
                    value={timeScale}
                    onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                />
                <span className="w-10 text-right tabular-nums">{timeScale.toFixed(1)}*</span>
            </label>
            <button
                className="px-3 py-2 rounded-xl border shadow hover:shadow-md"
                onClick={reset}
            >
                Reset
            </button>

            <div className="ml-auto text-xs text-gray-600">ticks: {tickCount}</div>
        </div>
    )
}