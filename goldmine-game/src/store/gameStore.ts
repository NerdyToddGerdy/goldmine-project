// =============================================
// Issue 2: Zustand store + game tick; pause/resume
// Project: goldmine-game (Vite + React + TS + Tailwind)
// =============================================
// This patch introduces a central Zustand store for game state
// and a fixed-step game loop with pause/resume controls.
// Files included below with full contents.
// ---------------------------------------------


// FILE: src/store/gameStore.ts
//----------------------------------------------

import { createStore } from 'zustand/vanilla'
import { devtools } from "zustand/middleware";

// Fixed simulation step (ms). 60 FPS -> ~16.666..., we use 16.6667.
export const FIXED_DT_MS = 1000 / 60;

export type GameState = {
    // Core meta
    isPaused: boolean
    tickCount: number // how many fixed ticks have run since start/reset
    timeScale: number // 1 = normal speed, can be tuned later

    // Example resources for Phase 1 to prove ticking works
    paydirt: number
    pannedGold: number

    // Internal Helpers
    _accumulator: number // leftover fractional time from RAF

    // Actions
    pause: () => void
    resume: () => void
    togglePause: () => void
    setTimeScale: (s: number) => void
    reset: () => void
    stepSimulation: (dtMs: number) => void // variable dt from raf -> converts into fixed step
    _fixedTick: () => void
}

export const useGameStore = createStore<GameState>()(
    devtools((set, get) => ({
        isPaused: false,
        tickCount: 0,
        timeScale: 1,

        paydirt: 0,
        pannedGold: 0,

        _accumulator: 0,

        pause: () => set({ isPaused: true }),
        resume: () => set({ isPaused: false }),
        togglePause: () => set((s) => ({ isPaused: !s.isPaused })),
        setTimeScale: (s: number) => set({ timeScale: Math.max(0, s) }),
        reset: () =>
            set({
                isPaused: false,
                tickCount: 0,
                timeScale: 1,

                paydirt: 0,
                pannedGold: 0,
                _accumulator: 0,
            }),
        stepSimulation: (dtMs: number) => {
            const { isPaused, timeScale } = get()
            if (isPaused || timeScale <= 0) return

            const scaled = dtMs * timeScale;
            let acc = get()._accumulator + scaled;

            // Process fixed steps of FIXED_DT_MS
            while (acc >= FIXED_DT_MS) {
                get()._fixedTick();
                acc -= FIXED_DT_MS;
            }

            set({ _accumulator: acc })
        },

        _fixedTick: () => {
            // Deterministic per-tick updates live here
            // For Issue 2 we keep it simple: generate a trickle of paydirt
            set((s) => ({
                tickCount: s.tickCount + 1,
                paydirt: s.paydirt + 0.01, // tiny proof-of-life gain per tick
            }))
        },
    }))
)