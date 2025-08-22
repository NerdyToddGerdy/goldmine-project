import {useGameStore} from "../store/gameStore.ts";

export function HUD() {
    const paydirt = useGameStore((s) => s.paydirt)
    const pannedGold = useGameStore((s) => s.pannedGold)

    return (
        <div className="grid grid-cols-2 gap-3">
            <StatCard label="Paydirt" value={paydirt} />
            <StatCard label="Panned Gold" value={pannedGold} />
        </div>
    )
}

export function StatCard({ label, value}: {label: string; value}) {
    return (
        <div className="rounded-2xl border shadow-sm p-4 bg-white/70">
            <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
            <div className="text-2xl font-semibold tabular-nums">{value.toFixed(2)}</div>
        </div>
    )
}