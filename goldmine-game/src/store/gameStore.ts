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
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import {defaultSaveV2, type LatestSave, migrateToLatest, SCHEMA_VERSION, STORAGE_KEY} from "./schema"

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
    reset: () => void // soft reset of run values
    hardResetSave: () => void // wipe LocalStorage + state
    exportSave: () => string // JSON string for backup/share
    importSave: (json: string) => void // load JSON (with migration)
    stepSimulation: (dtMs: number) => void // variable dt from raf -> converts into fixed step
    _fixedTick: () => void
}

export const useGameStore = createStore<GameState>()(
    persist(
        devtools((set, get) => ({
            isPaused: false,
            tickCount: 0,
            timeScale: 1,

            paydirt: 0,
            pannedGold: 0,

            _accumulator: 0,

            pause: () => set({ isPaused: true}),
            resume: () => set({ isPaused: false}),
            togglePause: () => set((s) => ({ isPaused: !s.isPaused})),
            setTimeScale: (s: number) => set({ timeScale: Math.max(0, s) }),

            // Soft reset: clears run values, keeps meta like timeScale (and doesn’t wipe storage schema/version)
            reset: () => {
                set((s) => ({
                    ...s,
                    isPaused: false,
                    tickCount: 0,
                    paydirt: 0,
                    pannedGold: 0,
                    _accumulator: 0,
                }))
            },
            // Hard reset: wipe LocalStorage + restore defaults
            hardResetSave: () => {
                get().pause();
                window.localStorage.removeItem(STORAGE_KEY);
                set({
                    isPaused: false,
                    tickCount: 0,
                    timeScale: 1,
                    paydirt: 0,
                    pannedGold: 0,
                    _accumulator: 0,
                })
            },

            exportSave: () => {
                const s = get();

                const save: LatestSave = {
                    version: SCHEMA_VERSION,
                    tickCount: s.tickCount,
                    timeScale: s.timeScale,
                    pannedGold: s.pannedGold,
                    paydirt: s.paydirt,
                };
                return JSON.stringify(save, null, 2);
            },

            importSave: (json: string) => {
                let raw: unknown;

                try {
                    raw = JSON.parse(json);
                } catch (e) {
                    console.error("Invalid JSON provided to importSave", e);
                    return;
                }
                const maybeObj = raw as { version?: unknown };
                const fromVersion =
                    typeof maybeObj.version === "number" ? maybeObj.version : undefined;
                const migrated = migrateToLatest(raw, fromVersion);
                set((s) => ({
                    ...s,
                    tickCount: migrated.tickCount,
                    timeScale: migrated.timeScale,
                    pannedGold: migrated.pannedGold,
                    paydirt: migrated.paydirt,
                }));
            },

            stepSimulation: (dtMs: number) => {
                const { isPaused, timeScale } = get();
                if ( isPaused || timeScale <= 0) return;

                const scaled = dtMs * timeScale
                let acc = get()._accumulator + scaled;

                while (acc >= FIXED_DT_MS) {
                    get()._fixedTick();
                    acc -= FIXED_DT_MS;
                }

                set({ _accumulator: acc });
        },

        _fixedTick: () => {
            set((s) => ({
                tickCount: s.tickCount + 1,
                paydirt: s.paydirt + 0.01,
            }));
        },

    })),
    {
        name: STORAGE_KEY,
        version: SCHEMA_VERSION,
        storage: createJSONStorage(() => window.localStorage),
        // Only persist these fields; exclude transient runtime helpers
        partialize: (state) => ({
            tickCount: state.tickCount,
            timeScale: state.timeScale,
            pannedGold: state.pannedGold,
            paydirt: state.paydirt,
        }),
        migrate: (persisted, fromVersion) => {
            try {
                return migrateToLatest(persisted, fromVersion ?? undefined);
            } catch (e) {
                console.warn("Migration failed; using default save.", e);
                return defaultSaveV2();
            }
        },
        onRehydrateStorage: ()=> (state) => {
            if (!state) return;
            // Ensure transient flags are sensible after load
            state.isPaused = false;
            state._accumulator = 0;
        }
    }
    )
);