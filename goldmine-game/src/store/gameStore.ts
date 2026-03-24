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
import { useStore } from 'zustand'
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import {defaultSaveV10, type LatestSave, migrateToLatest, SCHEMA_VERSION, STORAGE_KEY} from "./schema"

// Fixed simulation step (ms). 60 FPS -> ~16.666..., we use 16.6667.
export const FIXED_DT_MS = 1000 / 60;

// Bucket capacity for manual scooping
export const BUCKET_CAPACITY = 10;

// Pan/Sluice capacity for processing
export const PAN_CAPACITY = 20;

// Investment system constants
export const INVESTMENTS = {
    safeBonds: {
        name: "Safe Bonds",
        interestRate: 0.02, // 2% per minute
        riskChance: 0.01, // 1% chance per check
        riskLoss: 0.10, // 10% loss on risk event
    },
    stocks: {
        name: "Stocks",
        interestRate: 0.05, // 5% per minute
        riskChance: 0.05, // 5% chance per check
        riskLoss: 0.20, // 20% loss on risk event
    },
    highRisk: {
        name: "High Risk",
        interestRate: 0.10, // 10% per minute
        riskChance: 0.15, // 15% chance per check
        riskLoss: 0.50, // 50% loss on risk event
    },
};

export const RISK_CHECK_INTERVAL_MS = 60000; // Check for risk events every 60 seconds
export const WITHDRAWAL_PENALTY = 0.05; // 5% penalty on withdrawal

export type ToastType = 'info' | 'warning' | 'error';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let _toastId = 0;

export type GameState = {
    // Core meta
    isPaused: boolean
    tickCount: number // how many fixed ticks have run since start/reset
    timeScale: number // 1 = normal speed, can be tuned later
    location: 'mine' | 'town' // current location

    // Manual action state
    bucketFilled: number // how much dirt is in the bucket (0 to BUCKET_CAPACITY)
    panFilled: number // how much dirt/paydirt is in the pan (0 to PAN_CAPACITY)

    // Resources
    dirt: number // raw dirt from scooping
    paydirt: number // dirt that potentially contains gold
    gold: number // refined gold from panning
    money: number // currency from selling gold

    // Investments
    investmentSafeBonds: number // money invested in safe bonds
    investmentStocks: number // money invested in stocks
    investmentHighRisk: number // money invested in high risk
    lastRiskCheck: number // timestamp of last risk check (in game ticks)

    // Workers (owned count)
    shovels: number // miners that dig dirt
    pans: number // prospectors that pan for gold
    carts: number // auto-travel upgrades
    sluiceWorkers: number // operate sluice boxes for bonus extraction
    separatorWorkers: number // operate magnetic separators
    ovenWorkers: number // operate ovens to clean gold
    furnaceWorkers: number // operate furnaces to smelt gold
    bankerWorkers: number // automatically sell gold for money

    // Equipment (owned/unlocked) - now prerequisites for workers
    hasSluiceBox: boolean // unlocks sluice workers
    hasMagneticSeparator: boolean // unlocks separator workers
    hasOven: boolean // unlocks oven workers
    hasFurnace: boolean // unlocks furnace workers
    hasBankCounter: boolean // unlocks banker workers

    // Manual action power
    scoopPower: number // dirt per manual scoop
    sluicePower: number // paydirt per manual sluice
    panPower: number // gold per manual pan

    // Equipment gear levels (improve worker effectiveness)
    sluiceGear: number // improves sluice worker bonus
    separatorGear: number // improves separator worker bonus
    ovenGear: number // improves oven worker bonus
    furnaceGear: number // improves furnace worker bonus

    // Unlock flags
    unlockedPanning: boolean
    unlockedTown: boolean
    unlockedShop: boolean

    // Toasts (transient, not persisted)
    toasts: Toast[]

    // Internal Helpers
    _accumulator: number // leftover fractional time from RAF

    // Actions - Core
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

    // Actions - Game
    scoopDirt: () => void // manual action - fills bucket
    emptyBucket: () => void // empties bucket into dirt or paydirt (depending on sluice box)
    sluiceDirt: () => void // manual action (costs dirt, produces paydirt) - DEPRECATED, use emptyBucket
    panForGold: () => void // manual action (costs paydirt)
    travelTo: (location: 'mine' | 'town') => void
    sellGold: () => void // convert all gold -> money
    buyUpgrade: (upgrade: string) => boolean // returns success
    fireWorker: (workerType: string) => boolean // fires one worker, returns success

    // Investments
    depositInvestment: (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => boolean
    withdrawInvestment: (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => boolean

    // Toasts
    addToast: (message: string, type?: ToastType) => void
    dismissToast: (id: number) => void
}

// Upgrade costs and definitions
export const UPGRADES = {
    shovel: { baseCost: 10, multiplier: 1.15, dirtPerSec: 3 },
    pan: { baseCost: 25, multiplier: 1.15, goldPerSec: 1.5 },
    cart: { baseCost: 100, multiplier: 1.2 },
    betterShovel: { baseCost: 50, multiplier: 1.3 }, // increases manual scoop
    betterPan: { baseCost: 100, multiplier: 1.3 }, // increases manual pan
    betterSluice: { baseCost: 150, multiplier: 1.4 }, // increases sluice worker bonus
    betterSeparator: { baseCost: 500, multiplier: 1.5 }, // increases separator worker bonus
    betterOven: { baseCost: 300, multiplier: 1.4 }, // increases oven worker bonus
    betterFurnace: { baseCost: 1000, multiplier: 1.5 }, // increases furnace worker bonus
    sluiceWorker: { baseCost: 75, multiplier: 1.2, extractionBonus: 0.1 }, // +10% extraction per worker
    separatorWorker: { baseCost: 300, multiplier: 1.25, extractionBonus: 0.15 }, // +15% extraction per worker
    ovenWorker: { baseCost: 150, multiplier: 1.2, valueBonus: 0.2 }, // +20% sell value per worker
    furnaceWorker: { baseCost: 500, multiplier: 1.3, valueBonus: 0.3 }, // +30% sell value per worker
    bankerWorker: { baseCost: 200, multiplier: 1.25, goldPerSec: 2.0 }, // Sells 2 gold/sec automatically
};

// Equipment costs (one-time purchases - unlock workers)
export const EQUIPMENT = {
    sluiceBox: { cost: 200 }, // Unlocks sluice workers
    magneticSeparator: { cost: 1000 }, // Unlocks separator workers
    oven: { cost: 500 }, // Unlocks oven workers
    furnace: { cost: 2500 }, // Unlocks furnace workers + removes fee
    bankCounter: { cost: 400 }, // Unlocks banker workers
};

// Constants
export const SMELTING_FEE_PERCENT = 0.15; // 15% fee when selling gold
export const BASE_EXTRACTION = 0.2; // 20% base gold extraction rate

// Wage system - base wages per second
export const WORKER_WAGES = {
    shovel: 0.10,        // Miners
    pan: 0.15,           // Prospectors
    sluiceWorker: 0.20,  // Sluice Operators
    separatorWorker: 0.30, // Separator Technicians
    ovenWorker: 0.25,    // Oven Operators
    furnaceWorker: 0.40, // Furnace Operators
    bankerWorker: 0.35,  // Bankers
};

export const WAGE_SCALING_MULTIPLIER = 1.15; // 15% increase per additional worker of same type

// Calculate wage for a single worker based on how many of that type exist
export function getWorkerWage(workerType: keyof typeof WORKER_WAGES, count: number): number {
    const baseWage = WORKER_WAGES[workerType];
    if (count === 0) return 0;
    return baseWage * Math.pow(WAGE_SCALING_MULTIPLIER, count - 1);
}

// Calculate total wage cost for all workers of a type
export function getTotalWageForType(workerType: keyof typeof WORKER_WAGES, count: number): number {
    let total = 0;
    for (let i = 1; i <= count; i++) {
        total += getWorkerWage(workerType, i);
    }
    return total;
}

// Calculate total payroll across all worker types
export function getTotalPayroll(state: {
    shovels: number;
    pans: number;
    sluiceWorkers: number;
    separatorWorkers: number;
    ovenWorkers: number;
    furnaceWorkers: number;
    bankerWorkers: number;
}): number {
    return (
        getTotalWageForType('shovel', state.shovels) +
        getTotalWageForType('pan', state.pans) +
        getTotalWageForType('sluiceWorker', state.sluiceWorkers) +
        getTotalWageForType('separatorWorker', state.separatorWorkers) +
        getTotalWageForType('ovenWorker', state.ovenWorkers) +
        getTotalWageForType('furnaceWorker', state.furnaceWorkers) +
        getTotalWageForType('bankerWorker', state.bankerWorkers)
    );
}

export function getUpgradeCost(baseUpgrade: string, owned: number): number {
    const upgrade = UPGRADES[baseUpgrade as keyof typeof UPGRADES];
    if (!upgrade) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.multiplier, owned));
}

export const gameStore = createStore<GameState>()(
    persist(
        devtools((set, get) => ({
            isPaused: false,
            toasts: [],
            tickCount: 0,
            timeScale: 1,
            location: 'mine',

            // Manual action state
            bucketFilled: 0,
            panFilled: 0,

            // Resources
            dirt: 0,
            paydirt: 0,
            gold: 0,
            money: 0,

            // Investments
            investmentSafeBonds: 0,
            investmentStocks: 0,
            investmentHighRisk: 0,
            lastRiskCheck: 0,

            // Workers
            shovels: 0,
            pans: 0,
            carts: 0,
            sluiceWorkers: 0,
            separatorWorkers: 0,
            ovenWorkers: 0,
            furnaceWorkers: 0,
            bankerWorkers: 0,

            // Equipment
            hasSluiceBox: false,
            hasMagneticSeparator: false,
            hasOven: false,
            hasFurnace: false,
            hasBankCounter: false,

            // Manual powers
            scoopPower: 1,
            sluicePower: 1,
            panPower: 1,

            // Equipment gear levels
            sluiceGear: 1,
            separatorGear: 1,
            ovenGear: 1,
            furnaceGear: 1,

            // Unlocks
            unlockedPanning: false,
            unlockedTown: false,
            unlockedShop: false,

            _accumulator: 0,

            pause: () => set({ isPaused: true}),
            resume: () => set({ isPaused: false}),
            togglePause: () => set((s) => ({ isPaused: !s.isPaused})),
            setTimeScale: (s: number) => set({ timeScale: Math.max(0, s) }),

            // Soft reset: clears run values, keeps meta like timeScale (and doesn't wipe storage schema/version)
            reset: () => {
                set((s) => ({
                    ...s,
                    isPaused: false,
                    toasts: [],
                    tickCount: 0,
                    location: 'mine',
                    bucketFilled: 0,
                    panFilled: 0,
                    dirt: 0,
                    paydirt: 0,
                    gold: 0,
                    money: 0,
                    investmentSafeBonds: 0,
                    investmentStocks: 0,
                    investmentHighRisk: 0,
                    lastRiskCheck: 0,
                    shovels: 0,
                    pans: 0,
                    carts: 0,
                    sluiceWorkers: 0,
                    separatorWorkers: 0,
                    ovenWorkers: 0,
                    furnaceWorkers: 0,
                    bankerWorkers: 0,
                    hasSluiceBox: false,
                    hasMagneticSeparator: false,
                    hasOven: false,
                    hasFurnace: false,
                    hasBankCounter: false,
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
                    separatorGear: 1,
                    ovenGear: 1,
                    furnaceGear: 1,
                    unlockedPanning: false,
                    unlockedTown: false,
                    unlockedShop: false,
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
                    location: 'mine',
                    bucketFilled: 0,
                    panFilled: 0,
                    dirt: 0,
                    paydirt: 0,
                    gold: 0,
                    money: 0,
                    investmentSafeBonds: 0,
                    investmentStocks: 0,
                    investmentHighRisk: 0,
                    lastRiskCheck: 0,
                    shovels: 0,
                    pans: 0,
                    carts: 0,
                    sluiceWorkers: 0,
                    separatorWorkers: 0,
                    ovenWorkers: 0,
                    furnaceWorkers: 0,
                    bankerWorkers: 0,
                    hasSluiceBox: false,
                    hasMagneticSeparator: false,
                    hasOven: false,
                    hasFurnace: false,
                    hasBankCounter: false,
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
                    separatorGear: 1,
                    ovenGear: 1,
                    furnaceGear: 1,
                    unlockedPanning: false,
                    unlockedTown: false,
                    unlockedShop: false,
                    _accumulator: 0,
                })
            },

            exportSave: () => {
                const s = get();

                const save: LatestSave = {
                    version: SCHEMA_VERSION,
                    tickCount: s.tickCount,
                    timeScale: s.timeScale,
                    location: s.location,
                    bucketFilled: s.bucketFilled,
                    panFilled: s.panFilled,
                    dirt: s.dirt,
                    paydirt: s.paydirt,
                    gold: s.gold,
                    money: s.money,
                    investmentSafeBonds: s.investmentSafeBonds,
                    investmentStocks: s.investmentStocks,
                    investmentHighRisk: s.investmentHighRisk,
                    lastRiskCheck: s.lastRiskCheck,
                    shovels: s.shovels,
                    pans: s.pans,
                    carts: s.carts,
                    sluiceWorkers: s.sluiceWorkers,
                    separatorWorkers: s.separatorWorkers,
                    ovenWorkers: s.ovenWorkers,
                    furnaceWorkers: s.furnaceWorkers,
                    bankerWorkers: s.bankerWorkers,
                    hasSluiceBox: s.hasSluiceBox,
                    hasMagneticSeparator: s.hasMagneticSeparator,
                    hasOven: s.hasOven,
                    hasFurnace: s.hasFurnace,
                    hasBankCounter: s.hasBankCounter,
                    scoopPower: s.scoopPower,
                    sluicePower: s.sluicePower,
                    panPower: s.panPower,
                    sluiceGear: s.sluiceGear,
                    separatorGear: s.separatorGear,
                    ovenGear: s.ovenGear,
                    furnaceGear: s.furnaceGear,
                    unlockedPanning: s.unlockedPanning,
                    unlockedTown: s.unlockedTown,
                    unlockedShop: s.unlockedShop,
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
                    location: migrated.location,
                    bucketFilled: migrated.bucketFilled,
                    panFilled: migrated.panFilled,
                    dirt: migrated.dirt,
                    paydirt: migrated.paydirt,
                    gold: migrated.gold,
                    money: migrated.money,
                    investmentSafeBonds: migrated.investmentSafeBonds,
                    investmentStocks: migrated.investmentStocks,
                    investmentHighRisk: migrated.investmentHighRisk,
                    lastRiskCheck: migrated.lastRiskCheck,
                    shovels: migrated.shovels,
                    pans: migrated.pans,
                    carts: migrated.carts,
                    sluiceWorkers: migrated.sluiceWorkers,
                    separatorWorkers: migrated.separatorWorkers,
                    ovenWorkers: migrated.ovenWorkers,
                    furnaceWorkers: migrated.furnaceWorkers,
                    bankerWorkers: migrated.bankerWorkers,
                    hasSluiceBox: migrated.hasSluiceBox,
                    hasMagneticSeparator: migrated.hasMagneticSeparator,
                    hasOven: migrated.hasOven,
                    hasFurnace: migrated.hasFurnace,
                    hasBankCounter: migrated.hasBankCounter,
                    scoopPower: migrated.scoopPower,
                    sluicePower: migrated.sluicePower,
                    panPower: migrated.panPower,
                    sluiceGear: migrated.sluiceGear,
                    separatorGear: migrated.separatorGear,
                    ovenGear: migrated.ovenGear,
                    furnaceGear: migrated.furnaceGear,
                    unlockedPanning: migrated.unlockedPanning,
                    unlockedTown: migrated.unlockedTown,
                    unlockedShop: migrated.unlockedShop,
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

            // Game Actions
            scoopDirt: () => {
                set((s) => {
                    // Can't scoop if bucket is full
                    if (s.bucketFilled >= BUCKET_CAPACITY) return s;

                    const gained = s.scoopPower;
                    const newFilled = Math.min(s.bucketFilled + gained, BUCKET_CAPACITY);

                    // Unlock panning after bucket gets to 2 or more for the first time
                    const newUnlocks = newFilled >= 2 && !s.unlockedPanning;

                    return {
                        bucketFilled: newFilled,
                        unlockedPanning: s.unlockedPanning || newUnlocks,
                    };
                });
            },

            emptyBucket: () => {
                set((s) => {
                    if (s.bucketFilled === 0) return s;

                    // Bucket empties into the pan (up to PAN_CAPACITY)
                    // If sluice box is unlocked, it applies sluice power multiplier with gear bonus
                    const effectiveSluicePower = s.hasSluiceBox
                        ? s.sluicePower * s.sluiceGear
                        : 1;
                    const amountToAdd = s.bucketFilled * effectiveSluicePower;

                    const newPanFilled = Math.min(s.panFilled + amountToAdd, PAN_CAPACITY);

                    return {
                        panFilled: newPanFilled,
                        bucketFilled: 0,
                    };
                });
            },

            sluiceDirt: () => {
                set((s) => {
                    if (!s.hasSluiceBox) return s; // Need sluice box to sluice
                    if (s.dirt < 1) return s; // Need dirt to sluice

                    const dirtUsed = Math.min(s.dirt, 1);
                    const paydirtGained = dirtUsed * s.sluicePower;

                    return {
                        dirt: s.dirt - dirtUsed,
                        paydirt: s.paydirt + paydirtGained,
                    };
                });
            },

            panForGold: () => {
                set((s) => {
                    if (s.panFilled < 1) return s; // Need material in the pan

                    const materialUsed = Math.min(s.panFilled, 1);

                    // Manual panning benefits from gear upgrades
                    let extractionRate = BASE_EXTRACTION;
                    extractionRate += s.sluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * s.sluiceGear;
                    extractionRate += s.separatorWorkers * UPGRADES.separatorWorker.extractionBonus * s.separatorGear;

                    let baseGold = materialUsed * s.panPower * extractionRate;

                    // Unlock town after getting some gold
                    const newTownUnlock = s.gold + baseGold >= 0.5 && !s.unlockedTown;

                    return {
                        panFilled: s.panFilled - materialUsed,
                        gold: s.gold + baseGold,
                        unlockedTown: s.unlockedTown || newTownUnlock,
                    };
                });
            },

            travelTo: (location: 'mine' | 'town') => {
                set({ location });
                // Unlock shop on first visit to town
                if (location === 'town') {
                    set((_s) => ({ unlockedShop: true }));
                }
            },

            sellGold: () => {
                set((s) => {
                    if (s.gold < 0.01) return s;

                    // Manual selling uses base value with smelting fee
                    const baseValue = s.gold;
                    const fee = baseValue * SMELTING_FEE_PERCENT;
                    const finalValue = baseValue - fee;

                    return {
                        money: s.money + finalValue,
                        gold: 0,
                    };
                });
            },

            buyUpgrade: (upgrade: string) => {
                const s = get();

                if (upgrade === 'shovel') {
                    const cost = getUpgradeCost('shovel', s.shovels);
                    if (s.money >= cost) {
                        set({
                            money: s.money - cost,
                            shovels: s.shovels + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'pan') {
                    const cost = getUpgradeCost('pan', s.pans);
                    if (s.money >= cost) {
                        set({
                            money: s.money - cost,
                            pans: s.pans + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'sluiceWorker') {
                    const cost = getUpgradeCost('sluiceWorker', s.sluiceWorkers);
                    if (s.money >= cost && s.hasSluiceBox) {
                        set({
                            money: s.money - cost,
                            sluiceWorkers: s.sluiceWorkers + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'separatorWorker') {
                    const cost = getUpgradeCost('separatorWorker', s.separatorWorkers);
                    if (s.money >= cost && s.hasMagneticSeparator) {
                        set({
                            money: s.money - cost,
                            separatorWorkers: s.separatorWorkers + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'ovenWorker') {
                    const cost = getUpgradeCost('ovenWorker', s.ovenWorkers);
                    if (s.money >= cost && s.hasOven) {
                        set({
                            money: s.money - cost,
                            ovenWorkers: s.ovenWorkers + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'furnaceWorker') {
                    const cost = getUpgradeCost('furnaceWorker', s.furnaceWorkers);
                    if (s.money >= cost && s.hasFurnace) {
                        set({
                            money: s.money - cost,
                            furnaceWorkers: s.furnaceWorkers + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterShovel') {
                    const cost = getUpgradeCost('betterShovel', s.scoopPower - 1);
                    if (s.money >= cost) {
                        set({
                            money: s.money - cost,
                            scoopPower: s.scoopPower + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterPan') {
                    const cost = getUpgradeCost('betterPan', s.panPower - 1);
                    if (s.money >= cost) {
                        set({
                            money: s.money - cost,
                            panPower: s.panPower + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterSluice') {
                    const cost = getUpgradeCost('betterSluice', s.sluiceGear - 1);
                    if (s.money >= cost && s.hasSluiceBox) {
                        set({
                            money: s.money - cost,
                            sluiceGear: s.sluiceGear + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterSeparator') {
                    const cost = getUpgradeCost('betterSeparator', s.separatorGear - 1);
                    if (s.money >= cost && s.hasMagneticSeparator) {
                        set({
                            money: s.money - cost,
                            separatorGear: s.separatorGear + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterOven') {
                    const cost = getUpgradeCost('betterOven', s.ovenGear - 1);
                    if (s.money >= cost && s.hasOven) {
                        set({
                            money: s.money - cost,
                            ovenGear: s.ovenGear + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterFurnace') {
                    const cost = getUpgradeCost('betterFurnace', s.furnaceGear - 1);
                    if (s.money >= cost && s.hasFurnace) {
                        set({
                            money: s.money - cost,
                            furnaceGear: s.furnaceGear + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'sluiceBox') {
                    const cost = EQUIPMENT.sluiceBox.cost;
                    if (s.money >= cost && !s.hasSluiceBox) {
                        set({
                            money: s.money - cost,
                            hasSluiceBox: true,
                        });
                        return true;
                    }
                } else if (upgrade === 'magneticSeparator') {
                    const cost = EQUIPMENT.magneticSeparator.cost;
                    if (s.money >= cost && !s.hasMagneticSeparator) {
                        set({
                            money: s.money - cost,
                            hasMagneticSeparator: true,
                        });
                        return true;
                    }
                } else if (upgrade === 'oven') {
                    const cost = EQUIPMENT.oven.cost;
                    if (s.money >= cost && !s.hasOven) {
                        set({
                            money: s.money - cost,
                            hasOven: true,
                        });
                        return true;
                    }
                } else if (upgrade === 'furnace') {
                    const cost = EQUIPMENT.furnace.cost;
                    if (s.money >= cost && !s.hasFurnace) {
                        set({
                            money: s.money - cost,
                            hasFurnace: true,
                        });
                        return true;
                    }
                } else if (upgrade === 'bankerWorker') {
                    const cost = getUpgradeCost('bankerWorker', s.bankerWorkers);
                    if (s.money >= cost) {
                        set({
                            money: s.money - cost,
                            bankerWorkers: s.bankerWorkers + 1,
                        });
                        return true;
                    }
                }

                return false;
            },

            fireWorker: (workerType: string) => {
                const s = get();

                if (workerType === 'shovel') {
                    if (s.shovels > 0) {
                        set({ shovels: s.shovels - 1 });
                        return true;
                    }
                } else if (workerType === 'pan') {
                    if (s.pans > 0) {
                        set({ pans: s.pans - 1 });
                        return true;
                    }
                } else if (workerType === 'sluiceWorker') {
                    if (s.sluiceWorkers > 0) {
                        set({ sluiceWorkers: s.sluiceWorkers - 1 });
                        return true;
                    }
                } else if (workerType === 'separatorWorker') {
                    if (s.separatorWorkers > 0) {
                        set({ separatorWorkers: s.separatorWorkers - 1 });
                        return true;
                    }
                } else if (workerType === 'ovenWorker') {
                    if (s.ovenWorkers > 0) {
                        set({ ovenWorkers: s.ovenWorkers - 1 });
                        return true;
                    }
                } else if (workerType === 'furnaceWorker') {
                    if (s.furnaceWorkers > 0) {
                        set({ furnaceWorkers: s.furnaceWorkers - 1 });
                        return true;
                    }
                } else if (workerType === 'bankerWorker') {
                    if (s.bankerWorkers > 0) {
                        set({ bankerWorkers: s.bankerWorkers - 1 });
                        return true;
                    }
                }

                return false;
            },

            depositInvestment: (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => {
                const s = get();

                // Check if user has enough money
                if (s.money < amount || amount <= 0) {
                    return false;
                }

                // Deduct money and add to investment
                const updates: Partial<GameState> = {
                    money: s.money - amount,
                };

                if (type === 'safeBonds') {
                    updates.investmentSafeBonds = s.investmentSafeBonds + amount;
                } else if (type === 'stocks') {
                    updates.investmentStocks = s.investmentStocks + amount;
                } else if (type === 'highRisk') {
                    updates.investmentHighRisk = s.investmentHighRisk + amount;
                }

                set(updates);
                return true;
            },

            withdrawInvestment: (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => {
                const s = get();

                // Check investment balance
                let currentInvestment = 0;
                if (type === 'safeBonds') {
                    currentInvestment = s.investmentSafeBonds;
                } else if (type === 'stocks') {
                    currentInvestment = s.investmentStocks;
                } else if (type === 'highRisk') {
                    currentInvestment = s.investmentHighRisk;
                }

                // Check if user has enough in that investment
                if (currentInvestment < amount || amount <= 0) {
                    return false;
                }

                // Apply 5% withdrawal penalty
                const afterPenalty = amount * (1 - WITHDRAWAL_PENALTY);

                // Update investment and money
                const updates: Partial<GameState> = {
                    money: s.money + afterPenalty,
                };

                if (type === 'safeBonds') {
                    updates.investmentSafeBonds = s.investmentSafeBonds - amount;
                } else if (type === 'stocks') {
                    updates.investmentStocks = s.investmentStocks - amount;
                } else if (type === 'highRisk') {
                    updates.investmentHighRisk = s.investmentHighRisk - amount;
                }

                set(updates);
                return true;
            },

            addToast: (message, type = 'info') => {
                const id = ++_toastId;
                set((s) => {
                    const trimmed = s.toasts.length >= 3 ? s.toasts.slice(1) : s.toasts;
                    return { toasts: [...trimmed, { id, message, type }] };
                });
                setTimeout(() => {
                    get().dismissToast(id);
                }, 4000);
            },

            dismissToast: (id) => {
                set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
            },

            _fixedTick: () => {
                set((s) => {
                    // Check if we can afford to pay workers this tick
                    const payrollPerTick = getTotalPayroll(s) / 60;
                    const canAffordWorkers = s.money >= payrollPerTick;

                    // If we can't afford workers, they go idle (produce nothing)
                    const effectiveShovels = canAffordWorkers ? s.shovels : 0;
                    const effectivePans = canAffordWorkers ? s.pans : 0;
                    const effectiveSluiceWorkers = canAffordWorkers ? s.sluiceWorkers : 0;
                    const effectiveSeparatorWorkers = canAffordWorkers ? s.separatorWorkers : 0;
                    const effectiveBankerWorkers = canAffordWorkers ? s.bankerWorkers : 0;

                    // Automation: miners fill the bucket
                    const dirtPerTick = (effectiveShovels * UPGRADES.shovel.dirtPerSec) / 60; // per tick at 60fps
                    let newBucketFilled = s.bucketFilled;
                    let newPanFilled = s.panFilled;

                    if (dirtPerTick > 0) {
                        // Check if bucket is full and pan has space - auto-empty bucket
                        if (s.bucketFilled >= BUCKET_CAPACITY && s.panFilled < PAN_CAPACITY) {
                            // Auto-empty bucket to pan (with sluice multiplier and gear bonus)
                            const effectiveSluicePower = s.hasSluiceBox
                                ? s.sluicePower * s.sluiceGear
                                : 1;
                            const amountToAdd = s.bucketFilled * effectiveSluicePower;
                            newPanFilled = Math.min(s.panFilled + amountToAdd, PAN_CAPACITY);
                            newBucketFilled = 0; // Empty the bucket
                        }

                        // Add dirt to bucket (stop when full)
                        if (newBucketFilled < BUCKET_CAPACITY) {
                            newBucketFilled = Math.min(newBucketFilled + dirtPerTick, BUCKET_CAPACITY);
                        }
                    }

                    let dirtChange = 0;
                    let paydirtChange = 0;
                    let goldGained = 0;

                    // Prospectors consume from the pan progress bar and produce gold
                    if (effectivePans > 0 && newPanFilled > 0) {
                        // Calculate extraction rate from workers (gear multiplies the bonus)
                        let extractionRate = BASE_EXTRACTION;
                        extractionRate += effectiveSluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * s.sluiceGear;
                        extractionRate += effectiveSeparatorWorkers * UPGRADES.separatorWorker.extractionBonus * s.separatorGear;

                        const panRate = (effectivePans * UPGRADES.pan.goldPerSec * extractionRate) / (60 * BASE_EXTRACTION);
                        const panConsumed = Math.min(newPanFilled, panRate);

                        newPanFilled -= panConsumed;
                        goldGained = panConsumed * extractionRate;
                    }

                    // Automation: bankers sell gold
                    let goldSold = 0;
                    let moneyGained = 0;

                    if (effectiveBankerWorkers > 0) {
                        const sellRate = (effectiveBankerWorkers * UPGRADES.bankerWorker.goldPerSec) / 60; // gold/tick
                        const maxSellable = s.gold + goldGained;
                        goldSold = Math.min(maxSellable, sellRate);

                        if (goldSold > 0) {
                            // Calculate value bonuses from oven/furnace workers
                            let valueMultiplier = 1.0;
                            valueMultiplier += s.ovenWorkers * UPGRADES.ovenWorker.valueBonus * s.ovenGear;
                            valueMultiplier += s.furnaceWorkers * UPGRADES.furnaceWorker.valueBonus * s.furnaceGear;

                            // Calculate smelting fee (furnace workers reduce/eliminate it)
                            let effectiveFeePercent = SMELTING_FEE_PERCENT;
                            // Each furnace worker reduces fee by 1/10th until it reaches 0
                            if (s.furnaceWorkers > 0) {
                                effectiveFeePercent = Math.max(0, SMELTING_FEE_PERCENT - (s.furnaceWorkers * 0.015));
                            }

                            const baseValue = goldSold * valueMultiplier;
                            const fee = baseValue * effectiveFeePercent;
                            moneyGained = baseValue - fee;
                        }
                    }

                    // Payroll: deduct wages only if workers were active
                    const moneyAfterPayroll = canAffordWorkers
                        ? s.money + moneyGained - payrollPerTick
                        : s.money + moneyGained;

                    // Investments: Calculate interest and check for risk events
                    let newInvestmentSafeBonds = s.investmentSafeBonds;
                    let newInvestmentStocks = s.investmentStocks;
                    let newInvestmentHighRisk = s.investmentHighRisk;
                    let newLastRiskCheck = s.lastRiskCheck;

                    // Calculate interest per tick for each investment type
                    // Interest rates are per minute, so divide by 3600 for per-tick rate (60 ticks/sec * 60 sec/min)
                    if (newInvestmentSafeBonds > 0) {
                        const interestPerTick = newInvestmentSafeBonds * (INVESTMENTS.safeBonds.interestRate / 3600);
                        newInvestmentSafeBonds += interestPerTick;
                    }
                    if (newInvestmentStocks > 0) {
                        const interestPerTick = newInvestmentStocks * (INVESTMENTS.stocks.interestRate / 3600);
                        newInvestmentStocks += interestPerTick;
                    }
                    if (newInvestmentHighRisk > 0) {
                        const interestPerTick = newInvestmentHighRisk * (INVESTMENTS.highRisk.interestRate / 3600);
                        newInvestmentHighRisk += interestPerTick;
                    }

                    // Check if enough time has passed for risk check (60 seconds = 3600 ticks)
                    const ticksSinceLastRiskCheck = s.tickCount - s.lastRiskCheck;
                    const ticksPerRiskCheck = RISK_CHECK_INTERVAL_MS / FIXED_DT_MS; // 60000ms / 16.6667ms = 3600 ticks

                    if (ticksSinceLastRiskCheck >= ticksPerRiskCheck) {
                        // Perform risk checks for each investment type
                        if (newInvestmentSafeBonds > 0) {
                            const riskRoll = Math.random();
                            if (riskRoll < INVESTMENTS.safeBonds.riskChance) {
                                // Risk event occurred - apply loss
                                const loss = newInvestmentSafeBonds * INVESTMENTS.safeBonds.riskLoss;
                                newInvestmentSafeBonds -= loss;
                            }
                        }
                        if (newInvestmentStocks > 0) {
                            const riskRoll = Math.random();
                            if (riskRoll < INVESTMENTS.stocks.riskChance) {
                                // Risk event occurred - apply loss
                                const loss = newInvestmentStocks * INVESTMENTS.stocks.riskLoss;
                                newInvestmentStocks -= loss;
                            }
                        }
                        if (newInvestmentHighRisk > 0) {
                            const riskRoll = Math.random();
                            if (riskRoll < INVESTMENTS.highRisk.riskChance) {
                                // Risk event occurred - apply loss
                                const loss = newInvestmentHighRisk * INVESTMENTS.highRisk.riskLoss;
                                newInvestmentHighRisk -= loss;
                            }
                        }

                        // Update last risk check timestamp
                        newLastRiskCheck = s.tickCount;
                    }

                    return {
                        tickCount: s.tickCount + 1,
                        bucketFilled: newBucketFilled,
                        panFilled: newPanFilled,
                        dirt: s.dirt + dirtChange,
                        paydirt: s.paydirt + paydirtChange,
                        gold: s.gold + goldGained - goldSold,
                        money: moneyAfterPayroll,
                        investmentSafeBonds: newInvestmentSafeBonds,
                        investmentStocks: newInvestmentStocks,
                        investmentHighRisk: newInvestmentHighRisk,
                        lastRiskCheck: newLastRiskCheck,
                    };
                });
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
            location: state.location,
            bucketFilled: state.bucketFilled,
            panFilled: state.panFilled,
            dirt: state.dirt,
            paydirt: state.paydirt,
            gold: state.gold,
            money: state.money,
            investmentSafeBonds: state.investmentSafeBonds,
            investmentStocks: state.investmentStocks,
            investmentHighRisk: state.investmentHighRisk,
            lastRiskCheck: state.lastRiskCheck,
            shovels: state.shovels,
            pans: state.pans,
            carts: state.carts,
            sluiceWorkers: state.sluiceWorkers,
            separatorWorkers: state.separatorWorkers,
            ovenWorkers: state.ovenWorkers,
            furnaceWorkers: state.furnaceWorkers,
            bankerWorkers: state.bankerWorkers,
            hasSluiceBox: state.hasSluiceBox,
            hasMagneticSeparator: state.hasMagneticSeparator,
            hasOven: state.hasOven,
            hasFurnace: state.hasFurnace,
            hasBankCounter: state.hasBankCounter,
            scoopPower: state.scoopPower,
            sluicePower: state.sluicePower,
            panPower: state.panPower,
            sluiceGear: state.sluiceGear,
            separatorGear: state.separatorGear,
            ovenGear: state.ovenGear,
            furnaceGear: state.furnaceGear,
            unlockedPanning: state.unlockedPanning,
            unlockedTown: state.unlockedTown,
            unlockedShop: state.unlockedShop,
        }),
        migrate: (persisted, fromVersion) => {
            try {
                return migrateToLatest(persisted, fromVersion ?? undefined);
            } catch (e) {
                console.warn("Migration failed; using default save.", e);
                return defaultSaveV10();
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

// React hook wrapper for the vanilla store
export function useGameStore<T>(selector: (state: GameState) => T): T {
    return useStore(gameStore, selector);
}