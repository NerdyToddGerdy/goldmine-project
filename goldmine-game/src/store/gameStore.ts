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
import {defaultSaveV19, type LatestSave, migrateToLatest, SCHEMA_VERSION, STORAGE_KEY} from "./schema"

// Fixed simulation step (ms). 60 FPS -> ~16.666..., we use 16.6667.
export const FIXED_DT_MS = 1000 / 60;

// Bucket capacity for manual scooping (base value)
export const BUCKET_CAPACITY = 10;

// Pan/Sluice capacity for processing (base value)
export const PAN_CAPACITY = 20;

// Dynamic capacity helpers — use these wherever state is available
export function getEffectiveBucketCapacity(dustBucketSize: number): number {
    return BUCKET_CAPACITY + 5 * dustBucketSize;
}
export function getEffectivePanCapacity(dustPanCapacity: number): number {
    return PAN_CAPACITY + 10 * dustPanCapacity;
}
// Manual pan click: base 1 unit, +0.5 per panSpeed level
export function getEffectivePanClickAmount(dustPanSpeed: number): number {
    return 1 + 0.5 * dustPanSpeed;
}

// Money-purchasable gear upgrade costs (3 levels each, resets on prestige)
export const BUCKET_UPGRADE_COSTS = [15, 55, 175] as const;
export const PAN_CAP_UPGRADE_COSTS = [15, 55, 175] as const;
export const PAN_SPEED_UPGRADE_COSTS = [8, 30, 100] as const;
export const MAX_GEAR_UPGRADE_LEVEL = 3;

// Investment system constants
export const INVESTMENTS = {
    safeBonds: {
        name: "Safe Bonds",
        interestRate: 0.02, // 2% per minute
        riskChance: 0,      // no risk events
        riskLossMin: 0,
        riskLossMax: 0,
    },
    stocks: {
        name: "Stocks",
        interestRate: 0.05, // 5% per minute
        riskChance: 0.05,   // 5% chance per 60s check
        riskLossMin: 0.05,  // 5% min loss
        riskLossMax: 0.15,  // 15% max loss
    },
    highRisk: {
        name: "High Risk",
        interestRate: 0.10, // 10% per minute
        riskChance: 0.15,   // 15% chance per 60s check
        riskLossMin: 0.15,  // 15% min loss
        riskLossMax: 0.40,  // 40% max loss
    },
};

export const RISK_CHECK_INTERVAL_MS = 60000; // Check for risk events every 60 seconds
export const WITHDRAWAL_PENALTY = 0.05; // 5% penalty on withdrawal
export const PRESTIGE_MONEY_THRESHOLD = 250; // cumulative money earned to unlock prestige

// Gold market price constants
export const GOLD_PRICE_MIN = 0.60;
export const GOLD_PRICE_MAX = 1.80;
export const GOLD_PRICE_UPDATE_TICKS = 1800; // 30s × 60 ticks/s

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
    unlockedBanking: boolean // Phase 2: unlocked after first prestige

    // Prestige
    legacyDust: number      // permanent currency, survives prestige
    runMoneyEarned: number  // cumulative money income this run (resets on prestige)
    prestigeCount: number   // total prestiges completed

    // Legacy Dust upgrades (permanent, survive prestige and reset)
    dustScoopBoost: number  // 0-3: +10% bucket fill speed per level
    dustPanYield: number    // 0-3: +10% gold extraction per level
    dustGoldValue: number   // 0-3: +10% sell price per level
    dustHeadStart: number   // 0-3: begin each run with bonus money
    dustBucketSize: number  // 0-3: +5 bucket capacity per level
    dustPanSpeed: number    // 0-3: +20% pan processing rate per level
    dustPanCapacity: number // 0-3: +10 pan capacity per level

    // Money-purchasable gear upgrades (persisted, reset on prestige)
    bucketUpgrades: number   // 0-3: +5 bucket capacity per level
    panCapUpgrades: number   // 0-3: +10 pan capacity per level
    panSpeedUpgrades: number // 0-3: +0.5 pan click amount per level

    // Travel mechanic (persisted)
    vehicleTier: number  // 0=on foot, 1=mule cart, 2=steam wagon, 3=motor truck
    hasDriver: boolean   // hired a driver to auto-sell gold

    // Travel state (transient, not persisted)
    isTraveling: boolean
    travelProgress: number       // ticks elapsed of current travel
    travelDestination: 'mine' | 'town'
    driverTripTicks: number      // driver's position in round-trip cycle
    goldInPocket: number         // gold snapshotted at departure to Town; caps what can be sold

    // Gold market price (persisted)
    goldPrice: number            // current $/oz market rate
    lastGoldPriceUpdate: number  // tickCount at last price update

    // Auto-empty upgrade (persisted)
    hasAutoEmpty: boolean        // purchased auto-empty bucket upgrade

    // Changelog tracking (persisted)
    lastSeenChangelogVersion: string  // last changelog version player acknowledged

    // Settings (persisted)
    timePlayed: number // total ticks played
    darkMode: boolean

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
    travelTo: (location: 'mine' | 'town') => void // instant location change (internal/dev use)
    startTravel: (destination: 'mine' | 'town') => void // begins timed travel
    cancelTravel: () => void // aborts travel, player stays at current location
    buyVehicle: (tier: number) => boolean
    buyDriver: () => boolean
    sellGold: () => void // convert all gold -> money
    buyUpgrade: (upgrade: string) => boolean // returns success
    fireWorker: (workerType: string) => boolean // fires one worker, returns success

    // Investments
    depositInvestment: (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => boolean
    withdrawInvestment: (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => boolean

    // Toasts
    addToast: (message: string, type?: ToastType) => void
    dismissToast: (id: number) => void

    // Settings
    setDarkMode: (dark: boolean) => void
    setLastSeenChangelogVersion: (version: string) => void

    // Prestige
    prestige: () => void

    // Legacy Dust shop
    buyDustUpgrade: (type: 'scoopBoost' | 'panYield' | 'goldValue' | 'headStart' | 'bucketSize' | 'panSpeed' | 'panCapacity') => boolean
}

// Upgrade costs and definitions
export const UPGRADES = {
    shovel: { baseCost: 10, multiplier: 1.15, dirtPerSec: 3 },
    pan: { baseCost: 25, multiplier: 1.15, goldPerSec: 1.5 },
    cart: { baseCost: 100, multiplier: 1.2 },
    betterShovel: { baseCost: 50, multiplier: 1.3 }, // increases manual scoop
    betterPan: { baseCost: 100, multiplier: 1.3 }, // increases manual pan
    betterSluice: { baseCost: 75, multiplier: 1.4 }, // increases sluice worker bonus
    betterSeparator: { baseCost: 250, multiplier: 1.5 }, // increases separator worker bonus
    betterOven: { baseCost: 150, multiplier: 1.4 }, // increases oven worker bonus
    betterFurnace: { baseCost: 500, multiplier: 1.5 }, // increases furnace worker bonus
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
    autoEmpty: { cost: 75 }, // Auto-empties bucket to pan when full
};

// Vehicle tiers for travel mechanic
export const VEHICLE_TIERS = [
    { name: 'On Foot',     travelSecs: 15,  cost: 0 },
    { name: 'Mule Cart',   travelSecs: 8,   cost: 150 },
    { name: 'Steam Wagon', travelSecs: 4,   cost: 750 },
    { name: 'Motor Truck', travelSecs: 2,   cost: 3000 },
] as const;

export const DRIVER_COST = 5000;

export function getTravelDurationTicks(vehicleTier: number): number {
    return (VEHICLE_TIERS[vehicleTier as 0|1|2|3]?.travelSecs ?? 60) * 60;
}

// Constants
export const SMELTING_FEE_PERCENT = 0.15; // 15% fee when selling gold
export const BASE_EXTRACTION = 0.2; // 20% base gold extraction rate

// Legacy Dust upgrade shop
export const DUST_UPGRADE_MAX_LEVEL = 3;
export const DUST_UPGRADE_COSTS = [5, 15, 40] as const; // cost per level (0→1, 1→2, 2→3)
export const DUST_HEAD_START_AMOUNTS = [0, 25, 75, 200] as const; // starting money per headStart level

// Tool upgrade tiers (5 tiers, fixed costs) — defined in data/tools.ts
export { MAX_TOOL_TIER, TOOL_TIERS } from "../data/tools";
import { MAX_TOOL_TIER } from "../data/tools";
export const SHOVEL_TIER_COSTS = [10, 50, 200, 800, 3000] as const;
export const PAN_TIER_COSTS = [10, 50, 200, 800, 3000] as const;

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
            unlockedBanking: false,

            // Prestige
            legacyDust: 0,
            runMoneyEarned: 0,
            prestigeCount: 0,

            // Legacy Dust upgrades
            dustScoopBoost: 0,
            dustPanYield: 0,
            dustGoldValue: 0,
            dustHeadStart: 0,
            dustBucketSize: 0,
            dustPanSpeed: 0,
            dustPanCapacity: 0,

            // Money gear upgrades
            bucketUpgrades: 0,
            panCapUpgrades: 0,
            panSpeedUpgrades: 0,

            // Travel mechanic
            vehicleTier: 0,
            hasDriver: false,
            isTraveling: false,
            travelProgress: 0,
            travelDestination: 'mine' as const,
            driverTripTicks: 0,
            goldInPocket: 0,

            // Gold market price
            goldPrice: 1.0,
            lastGoldPriceUpdate: 0,

            // Auto-empty upgrade
            hasAutoEmpty: false,

            // Changelog tracking
            lastSeenChangelogVersion: defaultSaveV19().lastSeenChangelogVersion,

            // Settings
            timePlayed: 0,
            darkMode: false,

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
                    money: DUST_HEAD_START_AMOUNTS[s.dustHeadStart],
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
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
                    separatorGear: 1,
                    ovenGear: 1,
                    furnaceGear: 1,
                    unlockedPanning: false,
                    unlockedTown: false,
                    unlockedBanking: false,
                    runMoneyEarned: 0,
                    vehicleTier: 0,
                    hasDriver: false,
                    isTraveling: false,
                    travelProgress: 0,
                    travelDestination: 'mine' as const,
                    driverTripTicks: 0,
                    goldInPocket: 0,
                    goldPrice: 1.0,
                    lastGoldPriceUpdate: 0,
                    hasAutoEmpty: false,
                    _accumulator: 0,
                    // dustUpgrades preserved (permanent)
                    // lastSeenChangelogVersion preserved (not run-specific)
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
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
                    separatorGear: 1,
                    ovenGear: 1,
                    furnaceGear: 1,
                    unlockedPanning: false,
                    unlockedTown: false,
                    unlockedBanking: false,
                    legacyDust: 0,
                    runMoneyEarned: 0,
                    prestigeCount: 0,
                    dustScoopBoost: 0,
                    dustPanYield: 0,
                    dustGoldValue: 0,
                    dustHeadStart: 0,
                    dustBucketSize: 0,
                    dustPanSpeed: 0,
                    dustPanCapacity: 0,
                    bucketUpgrades: 0,
                    panCapUpgrades: 0,
                    panSpeedUpgrades: 0,
                    vehicleTier: 0,
                    hasDriver: false,
                    isTraveling: false,
                    travelProgress: 0,
                    travelDestination: 'mine' as const,
                    driverTripTicks: 0,
                    goldInPocket: 0,
                    goldPrice: 1.0,
                    lastGoldPriceUpdate: 0,
                    timePlayed: 0,
                    darkMode: false,
                    hasAutoEmpty: false,
                    lastSeenChangelogVersion: defaultSaveV19().lastSeenChangelogVersion,
                    _accumulator: 0,
                });
                document.documentElement.classList.remove('dark');
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
                    scoopPower: s.scoopPower,
                    sluicePower: s.sluicePower,
                    panPower: s.panPower,
                    sluiceGear: s.sluiceGear,
                    separatorGear: s.separatorGear,
                    ovenGear: s.ovenGear,
                    furnaceGear: s.furnaceGear,
                    unlockedPanning: s.unlockedPanning,
                    unlockedTown: s.unlockedTown,
                    unlockedBanking: s.unlockedBanking,
                    legacyDust: s.legacyDust,
                    runMoneyEarned: s.runMoneyEarned,
                    prestigeCount: s.prestigeCount,
                    dustScoopBoost: s.dustScoopBoost,
                    dustPanYield: s.dustPanYield,
                    dustGoldValue: s.dustGoldValue,
                    dustHeadStart: s.dustHeadStart,
                    dustBucketSize: s.dustBucketSize,
                    dustPanSpeed: s.dustPanSpeed,
                    dustPanCapacity: s.dustPanCapacity,
                    bucketUpgrades: s.bucketUpgrades,
                    panCapUpgrades: s.panCapUpgrades,
                    panSpeedUpgrades: s.panSpeedUpgrades,
                    vehicleTier: s.vehicleTier,
                    hasDriver: s.hasDriver,
                    timePlayed: s.timePlayed,
                    darkMode: s.darkMode,
                    goldPrice: s.goldPrice,
                    lastGoldPriceUpdate: s.lastGoldPriceUpdate,
                    hasAutoEmpty: s.hasAutoEmpty,
                    lastSeenChangelogVersion: s.lastSeenChangelogVersion,
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
                    scoopPower: migrated.scoopPower,
                    sluicePower: migrated.sluicePower,
                    panPower: migrated.panPower,
                    sluiceGear: migrated.sluiceGear,
                    separatorGear: migrated.separatorGear,
                    ovenGear: migrated.ovenGear,
                    furnaceGear: migrated.furnaceGear,
                    unlockedPanning: migrated.unlockedPanning,
                    unlockedTown: migrated.unlockedTown,
                    unlockedBanking: migrated.unlockedBanking,
                    legacyDust: migrated.legacyDust,
                    runMoneyEarned: migrated.runMoneyEarned,
                    prestigeCount: migrated.prestigeCount,
                    dustScoopBoost: migrated.dustScoopBoost,
                    dustPanYield: migrated.dustPanYield,
                    dustGoldValue: migrated.dustGoldValue,
                    dustHeadStart: migrated.dustHeadStart,
                    dustBucketSize: migrated.dustBucketSize,
                    dustPanSpeed: migrated.dustPanSpeed,
                    dustPanCapacity: migrated.dustPanCapacity,
                    bucketUpgrades: migrated.bucketUpgrades,
                    panCapUpgrades: migrated.panCapUpgrades,
                    panSpeedUpgrades: migrated.panSpeedUpgrades,
                    vehicleTier: migrated.vehicleTier,
                    hasDriver: migrated.hasDriver,
                    timePlayed: migrated.timePlayed,
                    darkMode: migrated.darkMode,
                    goldPrice: migrated.goldPrice,
                    lastGoldPriceUpdate: migrated.lastGoldPriceUpdate,
                    hasAutoEmpty: migrated.hasAutoEmpty,
                    lastSeenChangelogVersion: migrated.lastSeenChangelogVersion,
                }));
                // Apply darkMode immediately
                if (migrated.darkMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
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
                    const bucketCap = getEffectiveBucketCapacity(s.dustBucketSize + s.bucketUpgrades);
                    // Can't scoop if bucket is full
                    if (s.bucketFilled >= bucketCap) return s;

                    const gained = s.scoopPower * (1 + 0.1 * s.dustScoopBoost);
                    const newFilled = Math.min(s.bucketFilled + gained, bucketCap);

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

                    const panCap = getEffectivePanCapacity(s.dustPanCapacity + s.panCapUpgrades);
                    const newPanFilled = Math.min(s.panFilled + amountToAdd, panCap);

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

                    const materialUsed = Math.min(s.panFilled, getEffectivePanClickAmount(s.dustPanSpeed + s.panSpeedUpgrades));

                    // Manual panning benefits from gear upgrades
                    let extractionRate = BASE_EXTRACTION;
                    extractionRate += s.sluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * s.sluiceGear;
                    extractionRate += s.separatorWorkers * UPGRADES.separatorWorker.extractionBonus * s.separatorGear;

                    const baseGold = materialUsed * s.panPower * extractionRate * (1 + 0.1 * s.dustPanYield);

                    return {
                        panFilled: s.panFilled - materialUsed,
                        gold: s.gold + baseGold,
                    };
                });
            },

            travelTo: (location: 'mine' | 'town') => {
                set({ location });
            },

            startTravel: (destination: 'mine' | 'town') => {
                const s = get();
                if (s.isTraveling || s.location === destination) return;
                set({
                    isTraveling: true,
                    travelDestination: destination,
                    travelProgress: 0,
                    // Snapshot gold in pocket when departing for Town
                    goldInPocket: destination === 'town' ? s.gold : 0,
                });
            },

            cancelTravel: () => {
                set({ isTraveling: false, travelProgress: 0, goldInPocket: 0 });
            },

            buyVehicle: (tier: number) => {
                const s = get();
                if (tier < 1 || tier > 3) return false;
                if (tier <= s.vehicleTier) return false;
                if (tier !== s.vehicleTier + 1) return false; // must buy in order
                const tierData = VEHICLE_TIERS[tier as 1|2|3];
                if (s.money < tierData.cost) return false;
                set({ money: s.money - tierData.cost, vehicleTier: tier });
                get().addToast(`🚗 ${tierData.name} purchased! Travel: ${tierData.travelSecs}s`, 'info');
                return true;
            },

            buyDriver: () => {
                const s = get();
                if (s.hasDriver) return false;
                if (s.vehicleTier < 2) return false; // requires Steam Wagon
                if (s.money < DRIVER_COST) return false;
                set({ money: s.money - DRIVER_COST, hasDriver: true });
                get().addToast('🤠 Driver hired! He will auto-sell your gold.', 'info');
                return true;
            },

            sellGold: () => {
                set((s) => {
                    const sellable = Math.min(s.gold, s.goldInPocket);
                    if (sellable < 0.01) return s;

                    const baseValue = sellable * s.goldPrice;
                    // Smelting fee applies when you don't have a furnace (no furnace = pay to smelt elsewhere)
                    const fee = !s.hasFurnace ? baseValue * SMELTING_FEE_PERCENT : 0;
                    const finalValue = (baseValue - fee) * (1 + 0.1 * s.dustGoldValue);

                    return {
                        money: s.money + finalValue,
                        runMoneyEarned: s.runMoneyEarned + finalValue,
                        gold: s.gold - sellable,
                        goldInPocket: 0,
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
                    const tier = s.scoopPower - 1; // 0-indexed current tier
                    if (tier >= MAX_TOOL_TIER) return false;
                    const cost = SHOVEL_TIER_COSTS[tier];
                    if (s.money >= cost) {
                        set({
                            money: s.money - cost,
                            scoopPower: s.scoopPower + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterPan') {
                    const tier = s.panPower - 1; // 0-indexed current tier
                    if (tier >= MAX_TOOL_TIER) return false;
                    const cost = PAN_TIER_COSTS[tier];
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
                        set({ money: s.money - cost, hasSluiceBox: true });
                        get().addToast('🚿 Sluice Box purchased! Sluice Operators now available.', 'info');
                        return true;
                    }
                } else if (upgrade === 'magneticSeparator') {
                    const cost = EQUIPMENT.magneticSeparator.cost;
                    if (s.money >= cost && !s.hasMagneticSeparator) {
                        set({ money: s.money - cost, hasMagneticSeparator: true });
                        get().addToast('🧲 Magnetic Separator purchased! Separator Technicians now available.', 'info');
                        return true;
                    }
                } else if (upgrade === 'oven') {
                    const cost = EQUIPMENT.oven.cost;
                    if (s.money >= cost && !s.hasOven) {
                        set({ money: s.money - cost, hasOven: true });
                        get().addToast('🔥 Oven purchased! Oven Operators now available.', 'info');
                        return true;
                    }
                } else if (upgrade === 'furnace') {
                    const cost = EQUIPMENT.furnace.cost;
                    if (s.money >= cost && !s.hasFurnace) {
                        set({ money: s.money - cost, hasFurnace: true });
                        get().addToast('⚗️ Furnace purchased! Furnace Operators now available. Sell fee removed.', 'info');
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
                } else if (upgrade === 'bucketUpgrade') {
                    if (s.bucketUpgrades >= MAX_GEAR_UPGRADE_LEVEL) return false;
                    const cost = BUCKET_UPGRADE_COSTS[s.bucketUpgrades];
                    if (s.money >= cost) {
                        set({ money: s.money - cost, bucketUpgrades: s.bucketUpgrades + 1 });
                        return true;
                    }
                } else if (upgrade === 'panCapUpgrade') {
                    if (s.panCapUpgrades >= MAX_GEAR_UPGRADE_LEVEL) return false;
                    const cost = PAN_CAP_UPGRADE_COSTS[s.panCapUpgrades];
                    if (s.money >= cost) {
                        set({ money: s.money - cost, panCapUpgrades: s.panCapUpgrades + 1 });
                        return true;
                    }
                } else if (upgrade === 'panSpeedUpgrade') {
                    if (s.panSpeedUpgrades >= MAX_GEAR_UPGRADE_LEVEL) return false;
                    const cost = PAN_SPEED_UPGRADE_COSTS[s.panSpeedUpgrades];
                    if (s.money >= cost) {
                        set({ money: s.money - cost, panSpeedUpgrades: s.panSpeedUpgrades + 1 });
                        return true;
                    }
                } else if (upgrade === 'autoEmpty') {
                    if (s.hasAutoEmpty) return false;
                    const cost = EQUIPMENT.autoEmpty.cost;
                    if (s.money < cost) return false;
                    set({ money: s.money - cost, hasAutoEmpty: true });
                    return true;
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

            setDarkMode: (dark: boolean) => {
                set({ darkMode: dark });
                if (dark) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            },

            setLastSeenChangelogVersion: (version: string) => {
                set({ lastSeenChangelogVersion: version });
            },

            prestige: () => {
                const s = get();
                const dust = Math.floor(Math.sqrt(s.runMoneyEarned));
                set({
                    // Permanent — keep and update
                    legacyDust: s.legacyDust + dust,
                    prestigeCount: s.prestigeCount + 1,
                    unlockedBanking: true,
                    dustScoopBoost: s.dustScoopBoost,
                    dustPanYield: s.dustPanYield,
                    dustGoldValue: s.dustGoldValue,
                    dustHeadStart: s.dustHeadStart,
                    dustBucketSize: s.dustBucketSize,
                    dustPanSpeed: s.dustPanSpeed,
                    dustPanCapacity: s.dustPanCapacity,
                    timePlayed: s.timePlayed,
                    darkMode: s.darkMode,
                    timeScale: s.timeScale,
                    // Reset run fields
                    isPaused: false,
                    tickCount: 0,
                    location: 'mine',
                    bucketFilled: 0,
                    panFilled: 0,
                    dirt: 0,
                    paydirt: 0,
                    gold: 0,
                    money: DUST_HEAD_START_AMOUNTS[s.dustHeadStart],
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
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
                    separatorGear: 1,
                    ovenGear: 1,
                    furnaceGear: 1,
                    unlockedPanning: false,
                    unlockedTown: false,
                    runMoneyEarned: 0,
                    bucketUpgrades: 0,
                    panCapUpgrades: 0,
                    panSpeedUpgrades: 0,
                    vehicleTier: 0,
                    hasDriver: false,
                    isTraveling: false,
                    travelProgress: 0,
                    travelDestination: 'mine' as const,
                    driverTripTicks: 0,
                    goldInPocket: 0,
                    _accumulator: 0,
                    toasts: [],
                });
                get().addToast(`✨ New Creek! You earned ${dust} Legacy Dust.`, 'info');
            },

            buyDustUpgrade: (type) => {
                const s = get();
                let current: number;
                if (type === 'scoopBoost') current = s.dustScoopBoost;
                else if (type === 'panYield') current = s.dustPanYield;
                else if (type === 'goldValue') current = s.dustGoldValue;
                else if (type === 'headStart') current = s.dustHeadStart;
                else if (type === 'bucketSize') current = s.dustBucketSize;
                else if (type === 'panSpeed') current = s.dustPanSpeed;
                else current = s.dustPanCapacity;

                if (current >= DUST_UPGRADE_MAX_LEVEL) return false;
                const cost = DUST_UPGRADE_COSTS[current];
                if (s.legacyDust < cost) return false;

                const next = current + 1;
                if (type === 'scoopBoost') set({ legacyDust: s.legacyDust - cost, dustScoopBoost: next });
                else if (type === 'panYield') set({ legacyDust: s.legacyDust - cost, dustPanYield: next });
                else if (type === 'goldValue') set({ legacyDust: s.legacyDust - cost, dustGoldValue: next });
                else if (type === 'headStart') set({ legacyDust: s.legacyDust - cost, dustHeadStart: next });
                else if (type === 'bucketSize') set({ legacyDust: s.legacyDust - cost, dustBucketSize: next });
                else if (type === 'panSpeed') set({ legacyDust: s.legacyDust - cost, dustPanSpeed: next });
                else set({ legacyDust: s.legacyDust - cost, dustPanCapacity: next });

                return true;
            },

            _fixedTick: () => {
                const riskToasts: Array<{ message: string; type: ToastType }> = [];
                let townJustUnlocked = false;

                set((s) => {
                    // Increment time played each tick
                    const newTimePlayed = s.timePlayed + 1;

                    // Determine bucket/pan capacity and idle state before payroll
                    const bucketCap = getEffectiveBucketCapacity(s.dustBucketSize + s.bucketUpgrades);
                    const panCap = getEffectivePanCapacity(s.dustPanCapacity + s.panCapUpgrades);
                    const minersIdle = s.bucketFilled >= bucketCap;   // bucket full → miners blocked
                    const prospectsIdle = s.panFilled < 1;             // pan empty → prospectors blocked

                    // Active payroll excludes idle workers
                    const fullPayrollPerTick = getTotalPayroll(s) / 60;
                    const minerWagePerTick = getTotalWageForType('shovel', s.shovels) / 60;
                    const prospectWagePerTick = getTotalWageForType('pan', s.pans) / 60;
                    const activePayrollPerTick = fullPayrollPerTick
                        - (minersIdle ? minerWagePerTick : 0)
                        - (prospectsIdle ? prospectWagePerTick : 0);

                    const canAffordWorkers = s.money >= activePayrollPerTick;

                    // If we can't afford workers, they go idle (produce nothing)
                    const effectiveShovels = (canAffordWorkers && !minersIdle) ? s.shovels : 0;
                    const effectivePans = (canAffordWorkers && !prospectsIdle) ? s.pans : 0;
                    const effectiveSluiceWorkers = canAffordWorkers ? s.sluiceWorkers : 0;
                    const effectiveSeparatorWorkers = canAffordWorkers ? s.separatorWorkers : 0;
                    const effectiveBankerWorkers = canAffordWorkers ? s.bankerWorkers : 0;

                    // Automation: miners fill the bucket (boosted by dustScoopBoost)
                    const dirtPerTick = (effectiveShovels * UPGRADES.shovel.dirtPerSec * (1 + 0.1 * s.dustScoopBoost)) / 60; // per tick at 60fps
                    let newBucketFilled = s.bucketFilled;
                    let newPanFilled = s.panFilled;

                    // Auto-empty: always if upgrade owned, otherwise only when miners are active
                    if (s.bucketFilled >= bucketCap && newPanFilled < panCap && (s.hasAutoEmpty || dirtPerTick > 0)) {
                        const effectiveSluicePower = s.hasSluiceBox
                            ? s.sluicePower * s.sluiceGear
                            : 1;
                        const amountToAdd = s.bucketFilled * effectiveSluicePower;
                        newPanFilled = Math.min(newPanFilled + amountToAdd, panCap);
                        newBucketFilled = 0;
                    }

                    // Miners fill bucket
                    if (dirtPerTick > 0 && newBucketFilled < bucketCap) {
                        newBucketFilled = Math.min(newBucketFilled + dirtPerTick, bucketCap);
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

                        const panRate = (effectivePans * UPGRADES.pan.goldPerSec * extractionRate * (1 + 0.2 * (s.dustPanSpeed + s.panSpeedUpgrades))) / (60 * BASE_EXTRACTION);
                        const panConsumed = Math.min(newPanFilled, panRate);

                        newPanFilled -= panConsumed;
                        goldGained = panConsumed * extractionRate * (1 + 0.1 * s.dustPanYield);
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

                            // Smelting fee applies without a furnace; furnace workers reduce it
                            let effectiveFeePercent = !s.hasFurnace ? SMELTING_FEE_PERCENT : 0;
                            if (!s.hasFurnace && s.furnaceWorkers > 0) {
                                effectiveFeePercent = Math.max(0, SMELTING_FEE_PERCENT - (s.furnaceWorkers * 0.015));
                            }

                            const baseValue = goldSold * valueMultiplier * s.goldPrice;
                            const fee = baseValue * effectiveFeePercent;
                            moneyGained = (baseValue - fee) * (1 + 0.1 * s.dustGoldValue);
                        }
                    }

                    // Payroll: deduct wages only for active (non-idle) workers
                    const moneyAfterPayroll = canAffordWorkers
                        ? s.money + moneyGained - activePayrollPerTick
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
                        // Stocks: 5% chance per check, 5–15% random loss
                        if (newInvestmentStocks > 0 && Math.random() < INVESTMENTS.stocks.riskChance) {
                            const lossRate = INVESTMENTS.stocks.riskLossMin +
                                Math.random() * (INVESTMENTS.stocks.riskLossMax - INVESTMENTS.stocks.riskLossMin);
                            const loss = newInvestmentStocks * lossRate;
                            newInvestmentStocks -= loss;
                            riskToasts.push({
                                message: `📉 Stock market dip! Lost $${loss.toFixed(2)} from Stocks.`,
                                type: 'warning',
                            });
                        }

                        // High Risk: 15% chance per check, 15–40% random loss
                        if (newInvestmentHighRisk > 0 && Math.random() < INVESTMENTS.highRisk.riskChance) {
                            const lossRate = INVESTMENTS.highRisk.riskLossMin +
                                Math.random() * (INVESTMENTS.highRisk.riskLossMax - INVESTMENTS.highRisk.riskLossMin);
                            const loss = newInvestmentHighRisk * lossRate;
                            newInvestmentHighRisk -= loss;
                            riskToasts.push({
                                message: `💥 High-risk crash! Lost $${loss.toFixed(2)} from High Risk.`,
                                type: 'error',
                            });
                        }

                        // Update last risk check timestamp
                        newLastRiskCheck = s.tickCount;
                    }

                    // Player travel progress
                    let newIsTraveling = s.isTraveling;
                    let newTravelProgress = s.travelProgress;
                    let newLocation = s.location;

                    if (s.isTraveling) {
                        const travelDuration = getTravelDurationTicks(s.vehicleTier);
                        newTravelProgress = s.travelProgress + 1;
                        if (newTravelProgress >= travelDuration) {
                            newLocation = s.travelDestination;
                            newIsTraveling = false;
                            newTravelProgress = 0;
                            if (newLocation === 'town' && !s.unlockedTown) {
                                townJustUnlocked = true;
                            }
                        }
                    }

                    // Driver round-trip: sell gold at town midpoint
                    let driverGoldSold = 0;
                    let driverMoneyGained = 0;
                    let newDriverTripTicks = s.driverTripTicks;

                    if (s.hasDriver) {
                        const tripDuration = getTravelDurationTicks(s.vehicleTier);
                        const availableGold = s.gold + goldGained - goldSold;
                        if (availableGold > 0 || s.driverTripTicks > 0) {
                            newDriverTripTicks = s.driverTripTicks + 1;
                            // Driver arrives at town — sell all gold
                            if (newDriverTripTicks === tripDuration && availableGold > 0) {
                                driverGoldSold = availableGold;
                                const baseValue = driverGoldSold * s.goldPrice;
                                const fee = !s.hasFurnace ? baseValue * SMELTING_FEE_PERCENT : 0;
                                driverMoneyGained = (baseValue - fee) * (1 + 0.1 * s.dustGoldValue);
                            }
                            // Driver completes round-trip — reset counter
                            if (newDriverTripTicks >= tripDuration * 2) {
                                newDriverTripTicks = 0;
                            }
                        }
                    }

                    // Gold market price update
                    let newGoldPrice = s.goldPrice;
                    let newLastGoldPriceUpdate = s.lastGoldPriceUpdate;
                    if (s.tickCount - s.lastGoldPriceUpdate >= GOLD_PRICE_UPDATE_TICKS) {
                        const swing = (Math.random() - 0.5) * 0.2;
                        const reversion = (1.0 - s.goldPrice) * 0.1;
                        newGoldPrice = Math.max(GOLD_PRICE_MIN, Math.min(GOLD_PRICE_MAX, s.goldPrice + swing + reversion));
                        newLastGoldPriceUpdate = s.tickCount;
                    }

                    return {
                        tickCount: s.tickCount + 1,
                        timePlayed: newTimePlayed,
                        bucketFilled: newBucketFilled,
                        panFilled: newPanFilled,
                        dirt: s.dirt + dirtChange,
                        paydirt: s.paydirt + paydirtChange,
                        gold: s.gold + goldGained - goldSold - driverGoldSold,
                        money: moneyAfterPayroll + driverMoneyGained,
                        runMoneyEarned: s.runMoneyEarned + moneyGained + driverMoneyGained,
                        investmentSafeBonds: newInvestmentSafeBonds,
                        investmentStocks: newInvestmentStocks,
                        investmentHighRisk: newInvestmentHighRisk,
                        lastRiskCheck: newLastRiskCheck,
                        isTraveling: newIsTraveling,
                        travelProgress: newTravelProgress,
                        location: newLocation,
                        unlockedTown: s.unlockedTown || townJustUnlocked,
                        driverTripTicks: newDriverTripTicks,
                        goldPrice: newGoldPrice,
                        lastGoldPriceUpdate: newLastGoldPriceUpdate,
                    };
                });

                for (const { message, type } of riskToasts) {
                    get().addToast(message, type);
                }
                if (townJustUnlocked) {
                    get().addToast('🏘️ You arrived at Town for the first time!', 'info');
                }
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
            scoopPower: state.scoopPower,
            sluicePower: state.sluicePower,
            panPower: state.panPower,
            sluiceGear: state.sluiceGear,
            separatorGear: state.separatorGear,
            ovenGear: state.ovenGear,
            furnaceGear: state.furnaceGear,
            unlockedPanning: state.unlockedPanning,
            unlockedTown: state.unlockedTown,
            unlockedBanking: state.unlockedBanking,
            legacyDust: state.legacyDust,
            runMoneyEarned: state.runMoneyEarned,
            prestigeCount: state.prestigeCount,
            dustScoopBoost: state.dustScoopBoost,
            dustPanYield: state.dustPanYield,
            dustGoldValue: state.dustGoldValue,
            dustHeadStart: state.dustHeadStart,
            dustBucketSize: state.dustBucketSize,
            dustPanSpeed: state.dustPanSpeed,
            dustPanCapacity: state.dustPanCapacity,
            bucketUpgrades: state.bucketUpgrades,
            panCapUpgrades: state.panCapUpgrades,
            panSpeedUpgrades: state.panSpeedUpgrades,
            vehicleTier: state.vehicleTier,
            hasDriver: state.hasDriver,
            timePlayed: state.timePlayed,
            darkMode: state.darkMode,
            goldPrice: state.goldPrice,
            lastGoldPriceUpdate: state.lastGoldPriceUpdate,
            hasAutoEmpty: state.hasAutoEmpty,
            lastSeenChangelogVersion: state.lastSeenChangelogVersion,
        }),
        migrate: (persisted, fromVersion) => {
            try {
                return migrateToLatest(persisted, fromVersion ?? undefined);
            } catch (e) {
                console.warn("Migration failed; using default save.", e);
                return defaultSaveV19();
            }
        },
        onRehydrateStorage: ()=> (state) => {
            if (!state) return;
            // Ensure transient flags are sensible after load
            state.isPaused = false;
            state._accumulator = 0;
            state.isTraveling = false;
            state.travelProgress = 0;
            state.driverTripTicks = 0;
            // Restore gold-in-pocket on reload: if at Town, all current gold was carried there
            state.goldInPocket = state.location === 'town' ? state.gold : 0;
            // Apply persisted dark mode preference
            if (state.darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }
    )
);

// React hook wrapper for the vanilla store
export function useGameStore<T>(selector: (state: GameState) => T): T {
    return useStore(gameStore, selector);
}