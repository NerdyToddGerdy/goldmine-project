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
import {defaultSaveV28, type LatestSave, migrateToLatest, SCHEMA_VERSION, STORAGE_KEY} from "./schema"

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

// Sluice box mechanic: dirt → paydirt conversion
export const SLUICE_CONVERSION_RATIO = 0.65;  // 10 dirt → 6.5 paydirt (35% mass loss)
export const PAYDIRT_YIELD_MULTIPLIER = 2.5;  // each paydirt unit yields 2.5× more gold; net: 0.65 × 2.5 = 1.625×
export const SLUICE_DRAIN_RATE = 3;           // units of dirt drained from sluice box per second (base rate)

export const RICH_CONVERSION_RATIO = 0.85;  // rich dirt: 85% → paydirt (vs 65% normal)
export const MOTHERLODE_CHANCE = 0.20;      // 20% chance of 3× patch capacity
export const DETECTOR_SPOTS_PER_SEC = 0.5;  // auto-detect progress per second per worker
export const DETECT_PROGRESS_PER_CLICK = 1; // base progress added per manual detect click
export const DETECT_TARGET_MIN = 5;         // min clicks to discover a patch
export const DETECT_TARGET_MAX = 15;        // max clicks to discover a patch
export const PATCH_CAPACITY_MIN = 5;        // min rich dirt units per discovered patch
export const PATCH_CAPACITY_MAX = 15;       // max rich dirt units per discovered patch

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let _toastId = 0;

export interface FloatingNumber {
    id: number;
    resource: 'gold' | 'money';
    amount: number;
}
let _floatId = 0;

export type GameState = {
    // Core meta
    isPaused: boolean
    tickCount: number // how many fixed ticks have run since start/reset
    timeScale: number // 1 = normal speed, can be tuned later
    location: 'mine' | 'town' // current location

    // Manual action state
    bucketFilled: number // how much dirt is in the bucket (0 to BUCKET_CAPACITY)
    panFilled: number // how much dirt/paydirt is in the pan (0 to PAN_CAPACITY)
    sluiceBoxFilled: number // dirt currently draining through the sluice box
    minersMossFilled: number // concentrated paydirt caught by the miner's moss

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
    furnaceWorkers: number // operate furnaces to smelt gold
    bankerWorkers: number // automatically sell gold for money

    // Equipment (owned/unlocked) - now prerequisites for workers
    hasSluiceBox: boolean // unlocks sluice workers
    hasFurnace: boolean // unlocks furnace workers

    // Manual action power
    scoopPower: number // dirt per manual scoop
    sluicePower: number // paydirt per manual sluice
    panPower: number // gold per manual pan

    // Equipment gear levels (improve worker effectiveness)
    sluiceGear: number // improves sluice worker bonus
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
    dustDetectRate: number  // 0-3: +1 spot per detect per level
    dustSpotCap: number     // 0-3: +2 spot cap per level

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
    goldPriceHistory: number[]   // last 20 price samples for sparkline (session-only, not persisted)

    // Auto-empty upgrade (persisted)
    haulers: number              // workers who auto-empty the bucket when full

    // Metal detector
    richDirtInBucket: number     // portion of bucket fill that came from high-yield patch
    richDirtInSluice: number     // portion of sluice contents that is rich dirt
    hasMetalDetector: boolean
    detectorWorkers: number
    hasMotherlode: boolean
    detectProgress: number       // current click progress toward finding a patch (0..detectTarget)
    detectTarget: number         // randomized target clicks for current search (0 = no search started)
    patchActive: boolean         // true when a patch is discovered and has remaining rich dirt
    patchRemaining: number       // rich dirt units left in the active patch
    patchCapacity: number        // total capacity when patch was discovered (for progress display)

    // Furnace active smelting (persisted)
    furnaceFilled: number     // oz of gold flakes currently loaded in furnace
    furnaceRunning: boolean   // switch state — smelting is active
    furnaceBars: number       // bars produced inside furnace, not yet collected
    goldBars: number          // bars in player's possession (sellable)

    // Driver carrier (persisted)
    driverCarryingFlakes: number // oz of raw flakes currently in transit
    driverCarryingBars: number   // oz of gold bars currently in transit
    driverCapUpgrades: number    // Larger Carrier upgrade level (0–3)
    vaultFlakes: number          // oz of raw flakes deposited at the bank vault
    vaultBars: number            // oz of gold bars deposited at the bank vault

    // Changelog tracking (persisted)
    lastSeenChangelogVersion: string  // last changelog version player acknowledged

    // Lifetime stats (persisted, never reset)
    totalGoldExtracted: number  // cumulative gold panned across all runs
    totalMoneyEarned: number    // cumulative money received from all sales
    peakRunMoney: number        // highest runMoneyEarned in a single run

    // Settings (persisted)
    timePlayed: number // total ticks played
    darkMode: boolean

    // Toasts (transient, not persisted)
    toasts: Toast[]

    // Floating number animations (transient, not persisted)
    floatingNumbers: FloatingNumber[]

    // Dev tools (transient, not persisted)
    devMode: boolean
    devLogs: string[]

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
    emptyBucket: () => void // empties bucket into pan (no sluice) or adds to sluice box if bucket fits in remaining space
    cleanMoss: () => void // transfers miner's moss paydirt into the pan (capped at pan capacity)
    detectPatch: () => void // manual action - advances detection progress toward a high-yield patch
    sluiceDirt: () => void // manual action (costs dirt, produces paydirt) - DEPRECATED, use emptyBucket
    panForGold: () => void // manual action (costs paydirt)
    travelTo: (location: 'mine' | 'town') => void // instant location change (internal/dev use)
    startTravel: (destination: 'mine' | 'town') => void // begins timed travel
    cancelTravel: () => void // aborts travel, player stays at current location
    buyVehicle: (tier: number) => boolean
    buyDriver: () => boolean
    loadFurnace: () => void  // transfer gold flakes → furnaceFilled (up to FURNACE_CAPACITY)
    toggleFurnace: () => void // toggle furnaceRunning switch
    collectBars: () => void  // move furnaceBars → goldBars
    sellGold: () => void // sell goldBars (with furnace) or gold flakes (without)
    sellVault: () => void // sell raw gold flakes stored in bank vault
    buyUpgrade: (upgrade: string) => boolean // returns success
    fireWorker: (workerType: string) => boolean // fires one worker, returns success

    // Investments
    depositInvestment: (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => boolean
    withdrawInvestment: (type: 'safeBonds' | 'stocks' | 'highRisk', amount: number) => boolean

    // Toasts
    addToast: (message: string, type?: ToastType) => void
    dismissToast: (id: number) => void

    // Floating numbers
    addFloatingNumber: (resource: 'gold' | 'money', amount: number) => void

    // Settings
    setDarkMode: (dark: boolean) => void
    setLastSeenChangelogVersion: (version: string) => void

    // Dev tools
    toggleDevMode: () => void

    // Prestige
    prestige: () => void

    // Legacy Dust shop
    buyDustUpgrade: (type: 'scoopBoost' | 'panYield' | 'goldValue' | 'headStart' | 'bucketSize' | 'panSpeed' | 'panCapacity' | 'detectRate' | 'spotCap') => boolean
}

// Upgrade costs and definitions
export const UPGRADES = {
    shovel: { baseCost: 10, multiplier: 1.15, dirtPerSec: 3 },
    pan: { baseCost: 25, multiplier: 1.15, goldPerSec: 1.5 },
    cart: { baseCost: 100, multiplier: 1.2 },
    betterShovel: { baseCost: 50, multiplier: 1.3 }, // increases manual scoop
    betterPan: { baseCost: 100, multiplier: 1.3 }, // increases manual pan
    betterSluice: { baseCost: 75, multiplier: 1.4 }, // increases sluice worker bonus
    betterFurnace: { baseCost: 300, multiplier: 1.4 }, // increases smelt rate
    haulerWorker: { baseCost: 35, multiplier: 1.2 }, // auto-empties bucket into sluice/pan when full
    sluiceWorker: { baseCost: 75, multiplier: 1.2, extractionBonus: 0.1 }, // +10% extraction per worker
    furnaceWorker: { baseCost: 150, multiplier: 1.25 }, // auto-loads, smelts, and collects gold bars
    bankerWorker: { baseCost: 200, multiplier: 1.25, goldPerSec: 2.0 }, // Sells 2 gold/sec automatically
    detectorWorker: { baseCost: 100, multiplier: 1.2, spotsPerSec: 0.5 },
    largerCarrier: { baseCost: 250, multiplier: 1.6 }, // +5 oz driver capacity per upgrade
};

// Equipment costs (one-time purchases - unlock workers)
export const EQUIPMENT = {
    sluiceBox: { cost: 200 }, // Unlocks sluice workers
    furnace: { cost: 1500 }, // Unlocks furnace workers + removes fee
    metalDetector: { cost: 350 }, // Unlocks detect action + detector workers
    motherlode: { cost: 500 }, // 20% chance of 3× spots per detect
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
export const SMELTING_FEE_PERCENT = 0.15;   // 15% fee when selling raw flakes
export const GOLD_BAR_PRICE_MULTIPLIER = 1.2; // bars sell at 20% premium over market price
export const FURNACE_CAPACITY = 10;        // oz of gold flakes the furnace holds
export const SMELT_RATE_BASE = 1.0;        // oz flakes → bars per second (× furnaceGear)
export const BASE_EXTRACTION = 0.2; // 20% base gold extraction rate

// Driver carrier constants
export const DRIVER_BASE_CAPACITY = 10;    // oz per trip at no upgrades
export const DRIVER_CAP_BONUS_OZ = 5;      // oz added per Larger Carrier upgrade
export const MAX_DRIVER_CAP_UPGRADES = 3;

export function getDriverCapacity(capUpgrades: number): number {
    return DRIVER_BASE_CAPACITY + capUpgrades * DRIVER_CAP_BONUS_OZ;
}

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
    shovel: 0.10,           // Miners
    pan: 0.15,              // Prospectors
    haulerWorker: 0.08,     // Haulers
    sluiceWorker: 0.20,     // Sluice Operators
    furnaceWorker: 0.22,    // Furnace Operators
    bankerWorker: 0.35,     // Bankers
    detectorWorker: 0.18,   // Detector Operators
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
    haulers: number;
    sluiceWorkers: number;
    furnaceWorkers: number;
    bankerWorkers: number;
    detectorWorkers: number;
}): number {
    return (
        getTotalWageForType('shovel', state.shovels) +
        getTotalWageForType('pan', state.pans) +
        getTotalWageForType('haulerWorker', state.haulers) +
        getTotalWageForType('sluiceWorker', state.sluiceWorkers) +
        getTotalWageForType('furnaceWorker', state.furnaceWorkers) +
        getTotalWageForType('bankerWorker', state.bankerWorkers) +
        getTotalWageForType('detectorWorker', state.detectorWorkers)
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
            floatingNumbers: [],
            tickCount: 0,
            timeScale: 1,
            location: 'mine',

            // Manual action state
            bucketFilled: 0,
            panFilled: 0,
            sluiceBoxFilled: 0,
            minersMossFilled: 0,

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
            haulers: 0,
            sluiceWorkers: 0,
            furnaceWorkers: 0,
            bankerWorkers: 0,

            // Equipment
            hasSluiceBox: false,
            hasFurnace: false,

            // Manual powers
            scoopPower: 1,
            sluicePower: 1,
            panPower: 1,

            // Equipment gear levels
            sluiceGear: 1,
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
            goldPriceHistory: [1.0],

            // Metal detector
            richDirtInBucket: 0,
            richDirtInSluice: 0,
            hasMetalDetector: false,
            detectorWorkers: 0,
            hasMotherlode: false,
            detectProgress: 0,
            detectTarget: 0,
            patchActive: false,
            patchRemaining: 0,
            patchCapacity: 0,

            // Legacy Dust upgrades (detector)
            dustDetectRate: 0,
            dustSpotCap: 0,

            // Furnace active smelting
            furnaceFilled: 0,
            furnaceRunning: false,
            furnaceBars: 0,
            goldBars: 0,

            // Driver carrier
            driverCarryingFlakes: 0,
            driverCarryingBars: 0,
            driverCapUpgrades: 0,
            vaultFlakes: 0,
            vaultBars: 0,

            // Changelog tracking
            lastSeenChangelogVersion: defaultSaveV28().lastSeenChangelogVersion,

            // Lifetime stats
            totalGoldExtracted: 0,
            totalMoneyEarned: 0,
            peakRunMoney: 0,

            // Settings
            timePlayed: 0,
            darkMode: false,

            _accumulator: 0,

            // Dev tools
            devMode: false,
            devLogs: [],

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
                    floatingNumbers: [],
                    tickCount: 0,
                    location: 'mine',
                    bucketFilled: 0,
                    panFilled: 0,
                    sluiceBoxFilled: 0,
                    minersMossFilled: 0,
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
                    haulers: 0,
                    sluiceWorkers: 0,
                    furnaceWorkers: 0,
                    bankerWorkers: 0,
                    hasSluiceBox: false,
                    hasFurnace: false,
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
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
                    goldPriceHistory: [1.0],
                    richDirtInBucket: 0,
                    richDirtInSluice: 0,
                    hasMetalDetector: false,
                    detectorWorkers: 0,
                    hasMotherlode: false,
                    detectProgress: 0,
                    detectTarget: 0,
                    patchActive: false,
                    patchRemaining: 0,
                    patchCapacity: 0,
                    furnaceFilled: 0,
                    furnaceRunning: false,
                    furnaceBars: 0,
                    goldBars: 0,
                    driverCarrying: 0,
                    driverCapUpgrades: 0,
                    bankVault: 0,
                    _accumulator: 0,
                    devMode: false,
                    devLogs: [],
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
                    floatingNumbers: [],
                    tickCount: 0,
                    timeScale: 1,
                    location: 'mine',
                    bucketFilled: 0,
                    panFilled: 0,
                    sluiceBoxFilled: 0,
                    minersMossFilled: 0,
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
                    haulers: 0,
                    sluiceWorkers: 0,
                    furnaceWorkers: 0,
                    bankerWorkers: 0,
                    hasSluiceBox: false,
                    hasFurnace: false,
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
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
                    goldPriceHistory: [1.0],
                    timePlayed: 0,
                    darkMode: false,
                    richDirtInBucket: 0,
                    richDirtInSluice: 0,
                    hasMetalDetector: false,
                    detectorWorkers: 0,
                    hasMotherlode: false,
                    detectProgress: 0,
                    detectTarget: 0,
                    patchActive: false,
                    patchRemaining: 0,
                    patchCapacity: 0,
                    dustDetectRate: 0,
                    dustSpotCap: 0,
                    furnaceFilled: 0,
                    furnaceRunning: false,
                    furnaceBars: 0,
                    goldBars: 0,
                    driverCarryingFlakes: 0,
                    driverCarryingBars: 0,
                    driverCapUpgrades: 0,
                    vaultFlakes: 0,
                    vaultBars: 0,
                    lastSeenChangelogVersion: defaultSaveV28().lastSeenChangelogVersion,
                    totalGoldExtracted: 0,
                    totalMoneyEarned: 0,
                    peakRunMoney: 0,
                    _accumulator: 0,
                    devMode: false,
                    devLogs: [],
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
                    sluiceBoxFilled: s.sluiceBoxFilled,
                    minersMossFilled: s.minersMossFilled,
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
                    haulers: s.haulers,
                    sluiceWorkers: s.sluiceWorkers,
                    furnaceWorkers: s.furnaceWorkers,
                    bankerWorkers: s.bankerWorkers,
                    hasSluiceBox: s.hasSluiceBox,
                    hasFurnace: s.hasFurnace,
                    scoopPower: s.scoopPower,
                    sluicePower: s.sluicePower,
                    panPower: s.panPower,
                    sluiceGear: s.sluiceGear,
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
                    lastSeenChangelogVersion: s.lastSeenChangelogVersion,
                    totalGoldExtracted: s.totalGoldExtracted,
                    totalMoneyEarned: s.totalMoneyEarned,
                    peakRunMoney: s.peakRunMoney,
                    richDirtInBucket: s.richDirtInBucket,
                    richDirtInSluice: s.richDirtInSluice,
                    hasMetalDetector: s.hasMetalDetector,
                    detectorWorkers: s.detectorWorkers,
                    hasMotherlode: s.hasMotherlode,
                    dustDetectRate: s.dustDetectRate,
                    dustSpotCap: s.dustSpotCap,
                    detectProgress: s.detectProgress,
                    detectTarget: s.detectTarget,
                    patchActive: s.patchActive,
                    patchRemaining: s.patchRemaining,
                    patchCapacity: s.patchCapacity,
                    furnaceFilled: s.furnaceFilled,
                    furnaceRunning: s.furnaceRunning,
                    furnaceBars: s.furnaceBars,
                    goldBars: s.goldBars,
                    driverCarryingFlakes: s.driverCarryingFlakes,
                    driverCarryingBars: s.driverCarryingBars,
                    driverCapUpgrades: s.driverCapUpgrades,
                    vaultFlakes: s.vaultFlakes,
                    vaultBars: s.vaultBars,
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
                    sluiceBoxFilled: migrated.sluiceBoxFilled,
                    minersMossFilled: migrated.minersMossFilled,
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
                    haulers: migrated.haulers,
                    sluiceWorkers: migrated.sluiceWorkers,
                    furnaceWorkers: migrated.furnaceWorkers,
                    bankerWorkers: migrated.bankerWorkers,
                    hasSluiceBox: migrated.hasSluiceBox,
                    hasFurnace: migrated.hasFurnace,
                    scoopPower: migrated.scoopPower,
                    sluicePower: migrated.sluicePower,
                    panPower: migrated.panPower,
                    sluiceGear: migrated.sluiceGear,
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
                    lastSeenChangelogVersion: migrated.lastSeenChangelogVersion,
                    totalGoldExtracted: migrated.totalGoldExtracted,
                    totalMoneyEarned: migrated.totalMoneyEarned,
                    peakRunMoney: migrated.peakRunMoney,
                    richDirtInBucket: migrated.richDirtInBucket,
                    richDirtInSluice: migrated.richDirtInSluice,
                    hasMetalDetector: migrated.hasMetalDetector,
                    detectorWorkers: migrated.detectorWorkers,
                    hasMotherlode: migrated.hasMotherlode,
                    dustDetectRate: migrated.dustDetectRate,
                    dustSpotCap: migrated.dustSpotCap,
                    detectProgress: migrated.detectProgress,
                    detectTarget: migrated.detectTarget,
                    patchActive: migrated.patchActive,
                    patchRemaining: migrated.patchRemaining,
                    patchCapacity: migrated.patchCapacity,
                    furnaceFilled: migrated.furnaceFilled,
                    furnaceRunning: migrated.furnaceRunning,
                    furnaceBars: migrated.furnaceBars,
                    goldBars: migrated.goldBars,
                    driverCarryingFlakes: migrated.driverCarryingFlakes,
                    driverCarryingBars: migrated.driverCarryingBars,
                    driverCapUpgrades: migrated.driverCapUpgrades,
                    vaultFlakes: migrated.vaultFlakes,
                    vaultBars: migrated.vaultBars,
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

                    // Unlock panning once the bucket is full for the first time
                    const newUnlocks = newFilled >= bucketCap && !s.unlockedPanning;

                    if (s.patchActive && s.patchRemaining > 0) {
                        // Scoop rich dirt from the active patch first
                        const richGained = Math.min(gained, s.patchRemaining);
                        const newPatchRemaining = s.patchRemaining - richGained;
                        const newRichDirtInBucket = Math.min(newFilled, s.richDirtInBucket + richGained);
                        return {
                            bucketFilled: newFilled,
                            richDirtInBucket: newRichDirtInBucket,
                            patchRemaining: newPatchRemaining,
                            patchActive: newPatchRemaining > 0,
                            unlockedPanning: s.unlockedPanning || newUnlocks,
                        };
                    }

                    return {
                        bucketFilled: newFilled,
                        unlockedPanning: s.unlockedPanning || newUnlocks,
                    };
                });
            },

            emptyBucket: () => {
                set((s) => {
                    if (s.bucketFilled === 0) return s;

                    if (s.hasSluiceBox) {
                        // Sluice path: bucket adds to sluice as long as it fits
                        const sluiceCap = getEffectivePanCapacity(s.dustPanCapacity + s.panCapUpgrades);
                        if (s.sluiceBoxFilled + s.bucketFilled > sluiceCap) return s;
                        return { sluiceBoxFilled: s.sluiceBoxFilled + s.bucketFilled, bucketFilled: 0, richDirtInSluice: s.richDirtInSluice + s.richDirtInBucket, richDirtInBucket: 0 };
                    }

                    // Direct pan path (no sluice box): entire bucket must fit
                    const panCap = getEffectivePanCapacity(s.dustPanCapacity + s.panCapUpgrades);
                    if (s.panFilled + s.bucketFilled > panCap) return s;
                    return {
                        panFilled: s.panFilled + s.bucketFilled,
                        bucketFilled: 0,
                        richDirtInBucket: 0,
                    };
                });
            },

            cleanMoss: () => {
                set((s) => {
                    if (s.minersMossFilled <= 0) return s;
                    const panCap = getEffectivePanCapacity(s.dustPanCapacity + s.panCapUpgrades);
                    const spaceInPan = panCap - s.panFilled;
                    const transferred = Math.min(s.minersMossFilled, spaceInPan);
                    if (transferred <= 0) return s;
                    return {
                        minersMossFilled: s.minersMossFilled - transferred,
                        panFilled: s.panFilled + transferred,
                    };
                });
            },

            detectPatch: () => {
                set((s) => {
                    if (!s.hasMetalDetector) return s;
                    if (s.patchActive) return s; // already have an active patch

                    // Roll a random target on the first click of a new search
                    const target = s.detectTarget === 0
                        ? Math.floor(Math.random() * (DETECT_TARGET_MAX - DETECT_TARGET_MIN + 1)) + DETECT_TARGET_MIN
                        : s.detectTarget;

                    const progress = s.detectProgress + DETECT_PROGRESS_PER_CLICK + s.dustDetectRate;

                    if (progress >= target) {
                        // Patch discovered!
                        const baseCapacity = Math.floor(Math.random() * (PATCH_CAPACITY_MAX - PATCH_CAPACITY_MIN + 1)) + PATCH_CAPACITY_MIN + 5 * s.dustSpotCap;
                        const isMotherlode = s.hasMotherlode && Math.random() < MOTHERLODE_CHANCE;
                        const capacity = isMotherlode ? baseCapacity * 3 : baseCapacity;
                        return { detectProgress: 0, detectTarget: 0, patchActive: true, patchRemaining: capacity, patchCapacity: capacity };
                    }

                    return { detectProgress: progress, detectTarget: target };
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
                const s = get();
                if (s.panFilled <= 0) return;
                const materialUsed = Math.min(s.panFilled, getEffectivePanClickAmount(s.dustPanSpeed + s.panSpeedUpgrades));
                let extractionRate = BASE_EXTRACTION;
                extractionRate += s.sluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * s.sluiceGear;
                // Paydirt from sluice box yields significantly more gold per unit
                const paydirtMultiplier = s.hasSluiceBox ? PAYDIRT_YIELD_MULTIPLIER : 1;
                const baseGold = materialUsed * s.panPower * extractionRate * paydirtMultiplier * (1 + 0.1 * s.dustPanYield);
                set({ panFilled: s.panFilled - materialUsed, gold: s.gold + baseGold, totalGoldExtracted: s.totalGoldExtracted + baseGold });
                get().addFloatingNumber('gold', baseGold);
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
                    // Snapshot sellable gold in pocket when departing for Town
                    goldInPocket: destination === 'town' ? (s.hasFurnace ? s.goldBars : s.gold) : 0,
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
                get().addToast(`🚗 ${tierData.name} purchased! Travel: ${tierData.travelSecs}s`, 'success');
                return true;
            },

            buyDriver: () => {
                const s = get();
                if (s.hasDriver) return false;
                if (s.vehicleTier < 2) return false; // requires Steam Wagon
                if (s.money < DRIVER_COST) return false;
                set({ money: s.money - DRIVER_COST, hasDriver: true });
                get().addToast('🤠 Driver hired! He will auto-sell your gold.', 'success');
                return true;
            },

            sellGold: () => {
                const s = get();
                if (s.hasFurnace) {
                    // With furnace: sell goldBars carried to town (premium price, no fee)
                    const sellable = Math.min(s.goldBars, s.goldInPocket);
                    if (sellable < 0.01) return;
                    const baseValue = sellable * s.goldPrice * GOLD_BAR_PRICE_MULTIPLIER;
                    const finalValue = baseValue * (1 + 0.1 * s.dustGoldValue);
                    const newRunMoney = s.runMoneyEarned + finalValue;
                    set({
                        money: s.money + finalValue,
                        runMoneyEarned: newRunMoney,
                        goldBars: s.goldBars - sellable,
                        goldInPocket: 0,
                        totalMoneyEarned: s.totalMoneyEarned + finalValue,
                        peakRunMoney: Math.max(s.peakRunMoney, newRunMoney),
                    });
                    get().addFloatingNumber('money', finalValue);
                } else {
                    // Without furnace: sell raw flakes carried to town (15% fee)
                    const sellable = Math.min(s.gold, s.goldInPocket);
                    if (sellable < 0.01) return;
                    const baseValue = sellable * s.goldPrice;
                    const fee = baseValue * SMELTING_FEE_PERCENT;
                    const finalValue = (baseValue - fee) * (1 + 0.1 * s.dustGoldValue);
                    const newRunMoney = s.runMoneyEarned + finalValue;
                    set({
                        money: s.money + finalValue,
                        runMoneyEarned: newRunMoney,
                        gold: s.gold - sellable,
                        goldInPocket: 0,
                        totalMoneyEarned: s.totalMoneyEarned + finalValue,
                        peakRunMoney: Math.max(s.peakRunMoney, newRunMoney),
                    });
                    get().addFloatingNumber('money', finalValue);
                }
            },

            sellVault: () => {
                const s = get();
                if (s.vaultFlakes < 0.01 && s.vaultBars < 0.01) return;
                const multiplier = 1 + 0.1 * s.dustGoldValue;
                // Bars sell at premium price (no fee)
                const barsValue = s.vaultBars * s.goldPrice * GOLD_BAR_PRICE_MULTIPLIER * multiplier;
                // Flakes sell with 15% fee
                const flakesBase = s.vaultFlakes * s.goldPrice;
                const flakesValue = (flakesBase - flakesBase * SMELTING_FEE_PERCENT) * multiplier;
                const finalValue = barsValue + flakesValue;
                const newRunMoney = s.runMoneyEarned + finalValue;
                set({
                    vaultFlakes: 0,
                    vaultBars: 0,
                    money: s.money + finalValue,
                    runMoneyEarned: newRunMoney,
                    totalMoneyEarned: s.totalMoneyEarned + finalValue,
                    peakRunMoney: Math.max(s.peakRunMoney, newRunMoney),
                });
                get().addFloatingNumber('money', finalValue);
            },

            loadFurnace: () => {
                set((s) => {
                    if (!s.hasFurnace) return s;
                    const space = FURNACE_CAPACITY - s.furnaceFilled;
                    if (space <= 0 || s.gold <= 0) return s;
                    const transfer = Math.min(s.gold, space);
                    return { gold: s.gold - transfer, furnaceFilled: s.furnaceFilled + transfer };
                });
            },

            toggleFurnace: () => {
                set((s) => {
                    if (!s.hasFurnace) return s;
                    if (!s.furnaceRunning && s.furnaceFilled <= 0) return s; // can't start empty
                    return { furnaceRunning: !s.furnaceRunning };
                });
            },

            collectBars: () => {
                set((s) => {
                    if (s.furnaceBars <= 0) return s;
                    return { goldBars: s.goldBars + s.furnaceBars, furnaceBars: 0 };
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
                        get().addToast('🚿 Sluice Box purchased! Sluice Operators now available.', 'success');
                        return true;
                    }
                } else if (upgrade === 'furnace') {
                    const cost = EQUIPMENT.furnace.cost;
                    if (s.money >= cost && !s.hasFurnace) {
                        set({ money: s.money - cost, hasFurnace: true });
                        get().addToast('⚗️ Furnace purchased! Furnace Operators now available. Sell fee removed.', 'success');
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
                } else if (upgrade === 'haulerWorker') {
                    const cost = getUpgradeCost('haulerWorker', s.haulers);
                    if (s.money >= cost) {
                        set({ money: s.money - cost, haulers: s.haulers + 1 });
                        return true;
                    }
                } else if (upgrade === 'metalDetector') {
                    const cost = EQUIPMENT.metalDetector.cost;
                    if (s.money >= cost && !s.hasMetalDetector) {
                        set({ money: s.money - cost, hasMetalDetector: true });
                        get().addToast('🔍 Metal Detector purchased!', 'success');
                        return true;
                    }
                } else if (upgrade === 'motherlode') {
                    const cost = EQUIPMENT.motherlode.cost;
                    if (s.money >= cost && s.hasMetalDetector && !s.hasMotherlode) {
                        set({ money: s.money - cost, hasMotherlode: true });
                        get().addToast('💎 Motherlode Upgrade installed!', 'success');
                        return true;
                    }
                } else if (upgrade === 'detectorWorker') {
                    const cost = getUpgradeCost('detectorWorker', s.detectorWorkers);
                    if (s.money >= cost && s.hasMetalDetector) {
                        set({ money: s.money - cost, detectorWorkers: s.detectorWorkers + 1 });
                        return true;
                    }
                } else if (upgrade === 'largerCarrier') {
                    if (s.hasDriver && s.driverCapUpgrades < MAX_DRIVER_CAP_UPGRADES) {
                        const cost = getUpgradeCost('largerCarrier', s.driverCapUpgrades);
                        if (s.money >= cost) {
                            set({ money: s.money - cost, driverCapUpgrades: s.driverCapUpgrades + 1 });
                            return true;
                        }
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
                } else if (workerType === 'haulerWorker') {
                    if (s.haulers > 0) {
                        set({ haulers: s.haulers - 1 });
                        return true;
                    }
                } else if (workerType === 'sluiceWorker') {
                    if (s.sluiceWorkers > 0) {
                        set({ sluiceWorkers: s.sluiceWorkers - 1 });
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
                } else if (workerType === 'detectorWorker') {
                    if (s.detectorWorkers > 0) {
                        set({ detectorWorkers: s.detectorWorkers - 1 });
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
                    const trimmed = s.toasts.length >= 4 ? s.toasts.slice(1) : s.toasts;
                    return { toasts: [...trimmed, { id, message, type }] };
                });
                setTimeout(() => {
                    get().dismissToast(id);
                }, 4000);
            },

            dismissToast: (id) => {
                set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
            },

            addFloatingNumber: (resource, amount) => {
                const id = ++_floatId;
                set((s) => ({ floatingNumbers: [...s.floatingNumbers, { id, resource, amount }] }));
                setTimeout(() => {
                    set((s) => ({ floatingNumbers: s.floatingNumbers.filter((f) => f.id !== id) }));
                }, 1200);
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

            toggleDevMode: () => set((s) => ({ devMode: !s.devMode, devLogs: [] })),

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
                    dustDetectRate: s.dustDetectRate,
                    dustSpotCap: s.dustSpotCap,
                    timePlayed: s.timePlayed,
                    darkMode: s.darkMode,
                    timeScale: s.timeScale,
                    totalGoldExtracted: s.totalGoldExtracted,
                    totalMoneyEarned: s.totalMoneyEarned,
                    peakRunMoney: Math.max(s.peakRunMoney, s.runMoneyEarned),
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
                    haulers: 0,
                    sluiceWorkers: 0,
                    furnaceWorkers: 0,
                    bankerWorkers: 0,
                    hasSluiceBox: false,
                    hasFurnace: false,
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
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
                    sluiceBoxFilled: 0,
                    minersMossFilled: 0,
                    richDirtInBucket: 0,
                    richDirtInSluice: 0,
                    hasMetalDetector: false,
                    detectorWorkers: 0,
                    hasMotherlode: false,
                    detectProgress: 0,
                    detectTarget: 0,
                    patchActive: false,
                    patchRemaining: 0,
                    patchCapacity: 0,
                    furnaceFilled: 0,
                    furnaceRunning: false,
                    furnaceBars: 0,
                    goldBars: 0,
                    driverCarryingFlakes: 0,
                    driverCarryingBars: 0,
                    driverCapUpgrades: 0,
                    vaultFlakes: 0,
                    vaultBars: 0,
                    lastGoldPriceUpdate: 0,
                    _accumulator: 0,
                    toasts: [],
                    floatingNumbers: [],
                });
                get().addToast(`✨ New Creek! You earned ${dust} Legacy Dust.`, 'success');
            },

            buyDustUpgrade: (type) => {
                const s = get();
                let current: number;
                let fieldName: keyof typeof s;
                if (type === 'scoopBoost') { current = s.dustScoopBoost; fieldName = 'dustScoopBoost'; }
                else if (type === 'panYield') { current = s.dustPanYield; fieldName = 'dustPanYield'; }
                else if (type === 'goldValue') { current = s.dustGoldValue; fieldName = 'dustGoldValue'; }
                else if (type === 'headStart') { current = s.dustHeadStart; fieldName = 'dustHeadStart'; }
                else if (type === 'bucketSize') { current = s.dustBucketSize; fieldName = 'dustBucketSize'; }
                else if (type === 'panSpeed') { current = s.dustPanSpeed; fieldName = 'dustPanSpeed'; }
                else if (type === 'detectRate') { current = s.dustDetectRate; fieldName = 'dustDetectRate'; }
                else if (type === 'spotCap') { current = s.dustSpotCap; fieldName = 'dustSpotCap'; }
                else { current = s.dustPanCapacity; fieldName = 'dustPanCapacity'; }

                if (current >= DUST_UPGRADE_MAX_LEVEL) return false;
                const cost = DUST_UPGRADE_COSTS[current];
                if (s.legacyDust < cost) return false;

                const next = current + 1;
                set({ legacyDust: s.legacyDust - cost, [fieldName]: next });

                return true;
            },

            _fixedTick: () => {
                const riskToasts: Array<{ message: string; type: ToastType }> = [];
                let townJustUnlocked = false;
                let capturedBankerArrivalMoney = 0;
                const devEvents: string[] = [];

                set((s) => {
                    // Increment time played each tick
                    const newTimePlayed = s.timePlayed + 1;

                    // Determine bucket/pan capacity and idle state before payroll
                    const bucketCap = getEffectiveBucketCapacity(s.dustBucketSize + s.bucketUpgrades);
                    const panCap = getEffectivePanCapacity(s.dustPanCapacity + s.panCapUpgrades);
                    const minersIdle = s.bucketFilled >= bucketCap;   // bucket full → miners blocked
                    const prospectsIdle = s.panFilled <= 0;             // pan empty → prospectors blocked

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
                    const effectiveBankerWorkers = canAffordWorkers ? s.bankerWorkers : 0;

                    // Automation: miners fill the bucket (boosted by dustScoopBoost)
                    const dirtPerTick = (effectiveShovels * UPGRADES.shovel.dirtPerSec * (1 + 0.1 * s.dustScoopBoost)) / 60; // per tick at 60fps
                    let newBucketFilled = s.bucketFilled;
                    let newPanFilled = s.panFilled;
                    let newSluiceBoxFilled = s.sluiceBoxFilled;
                    let newMinersMossFilled = s.minersMossFilled;
                    let newRichDirtInSluice = s.richDirtInSluice;
                    let newRichDirtInBucketForAutoEmpty = s.richDirtInBucket; // tracks auto-empty transfers

                    // Sluice box drain: dirt drains over time, concentrated paydirt collects in miner's moss
                    if (s.hasSluiceBox) {
                        const sluiceCap = panCap; // sluice capacity = pan capacity
                        if (newSluiceBoxFilled > 0 && newMinersMossFilled < sluiceCap) {
                            const richRatio = newSluiceBoxFilled > 0 ? Math.min(1, newRichDirtInSluice / newSluiceBoxFilled) : 0;
                            const effectiveConversion = richRatio * RICH_CONVERSION_RATIO + (1 - richRatio) * SLUICE_CONVERSION_RATIO;
                            const drainPerTick = SLUICE_DRAIN_RATE / 60;
                            // Don't drain more than moss can absorb (via conversion ratio)
                            const maxDrain = Math.min(newSluiceBoxFilled, (sluiceCap - newMinersMossFilled) / effectiveConversion);
                            const actualDrain = Math.min(drainPerTick, maxDrain);
                            newSluiceBoxFilled = Math.max(0, newSluiceBoxFilled - actualDrain);
                            newRichDirtInSluice = Math.max(0, newRichDirtInSluice - actualDrain * richRatio);
                            newMinersMossFilled = Math.min(newMinersMossFilled + actualDrain * effectiveConversion, sluiceCap);
                        }
                    }

                    // Auto-empty: always if upgrade owned, otherwise only when miners are active
                    if (s.hasSluiceBox) {
                        // Sluice path: bucket → sluice when full bucket fits in remaining space
                        if (s.bucketFilled >= bucketCap && newSluiceBoxFilled + s.bucketFilled <= panCap && ((canAffordWorkers && s.haulers > 0) || dirtPerTick > 0)) {
                            newSluiceBoxFilled += s.bucketFilled;
                            newRichDirtInSluice += newRichDirtInBucketForAutoEmpty;
                            newRichDirtInBucketForAutoEmpty = 0;
                            newBucketFilled = 0;
                        }
                    } else {
                        // Direct pan path: entire bucket must fit
                        if (s.bucketFilled >= bucketCap && newPanFilled + s.bucketFilled <= panCap && ((canAffordWorkers && s.haulers > 0) || dirtPerTick > 0)) {
                            newPanFilled += s.bucketFilled;
                            newRichDirtInBucketForAutoEmpty = 0;
                            newBucketFilled = 0;
                        }
                    }

                    // Auto-clean: sluice workers transfer miner's moss into the pan
                    if (s.hasSluiceBox && effectiveSluiceWorkers > 0 && newMinersMossFilled > 0 && newPanFilled < panCap) {
                        const spaceInPan = panCap - newPanFilled;
                        const transferred = Math.min(newMinersMossFilled, spaceInPan);
                        newMinersMossFilled -= transferred;
                        newPanFilled += transferred;
                    }

                    // Detector workers advance detection progress automatically
                    let newDetectProgress = s.detectProgress;
                    let newDetectTarget = s.detectTarget;
                    let newPatchActive = s.patchActive;
                    let newPatchRemaining = s.patchRemaining;
                    let newPatchCapacity = s.patchCapacity;
                    if (s.hasMetalDetector && s.detectorWorkers > 0 && canAffordWorkers && !s.patchActive) {
                        const progressGain = (DETECTOR_SPOTS_PER_SEC * s.detectorWorkers) / 60;
                        // Roll a target if not started yet
                        if (newDetectTarget === 0) {
                            newDetectTarget = Math.floor(Math.random() * (DETECT_TARGET_MAX - DETECT_TARGET_MIN + 1)) + DETECT_TARGET_MIN;
                        }
                        newDetectProgress += progressGain;
                        if (newDetectProgress >= newDetectTarget) {
                            const baseCapacity = Math.floor(Math.random() * (PATCH_CAPACITY_MAX - PATCH_CAPACITY_MIN + 1)) + PATCH_CAPACITY_MIN + 5 * s.dustSpotCap;
                            const isMotherlode = s.hasMotherlode && Math.random() < MOTHERLODE_CHANCE;
                            const capacity = isMotherlode ? baseCapacity * 3 : baseCapacity;
                            newPatchActive = true;
                            newPatchRemaining = capacity;
                            newPatchCapacity = capacity;
                            newDetectProgress = 0;
                            newDetectTarget = 0;
                        }
                    }

                    // Miners fill bucket — prioritize active patch (rich dirt) over regular dirt
                    let newRichDirtInBucket = newRichDirtInBucketForAutoEmpty;
                    if (dirtPerTick > 0 && newBucketFilled < bucketCap) {
                        const spaceInBucket = bucketCap - newBucketFilled;
                        const actualGain = Math.min(dirtPerTick, spaceInBucket);
                        if (newPatchActive && newPatchRemaining > 0) {
                            const richGain = Math.min(actualGain, newPatchRemaining);
                            newPatchRemaining -= richGain;
                            if (newPatchRemaining <= 0) newPatchActive = false;
                            newRichDirtInBucket = Math.min(newBucketFilled + actualGain, bucketCap) <= bucketCap
                                ? newRichDirtInBucket + richGain
                                : newRichDirtInBucket;
                        }
                        newBucketFilled = Math.min(newBucketFilled + actualGain, bucketCap);
                    }

                    const dirtChange = 0;
                    const paydirtChange = 0;
                    let goldGained = 0;

                    // Prospectors consume from the pan progress bar and produce gold
                    if (effectivePans > 0 && newPanFilled > 0) {
                        // Calculate extraction rate from workers (gear multiplies the bonus)
                        let extractionRate = BASE_EXTRACTION;
                        extractionRate += effectiveSluiceWorkers * UPGRADES.sluiceWorker.extractionBonus * s.sluiceGear;

                        const panRate = (effectivePans * UPGRADES.pan.goldPerSec * extractionRate * (1 + 0.2 * (s.dustPanSpeed + s.panSpeedUpgrades))) / (60 * BASE_EXTRACTION);
                        const panConsumed = Math.min(newPanFilled, panRate);
                        // Paydirt (from sluice) yields more gold per unit than raw dirt
                        const paydirtMultiplier = s.hasSluiceBox ? PAYDIRT_YIELD_MULTIPLIER : 1;

                        newPanFilled -= panConsumed;
                        goldGained = panConsumed * extractionRate * paydirtMultiplier * (1 + 0.1 * s.dustPanYield);
                    }

                    // Automation: bankers sell gold bars (with furnace) or raw gold (without)
                    let goldSold = 0;
                    let goldBarsSold = 0;
                    let moneyGained = 0;

                    if (effectiveBankerWorkers > 0) {
                        const sellRate = (effectiveBankerWorkers * UPGRADES.bankerWorker.goldPerSec) / 60; // gold/tick

                        if (s.hasFurnace) {
                            // With furnace: sell goldBars only (premium price, no fee)
                            const maxSellable = s.goldBars;
                            goldBarsSold = Math.min(maxSellable, sellRate);
                            if (goldBarsSold > 0) {
                                const baseValue = goldBarsSold * s.goldPrice * GOLD_BAR_PRICE_MULTIPLIER;
                                moneyGained = baseValue * (1 + 0.1 * s.dustGoldValue);
                            }
                        } else {
                            // Without furnace: sell raw gold with fee
                            const maxSellable = s.gold + goldGained;
                            goldSold = Math.min(maxSellable, sellRate);
                            if (goldSold > 0) {
                                const baseValue = goldSold * s.goldPrice;
                                const fee = baseValue * SMELTING_FEE_PERCENT;
                                moneyGained = (baseValue - fee) * (1 + 0.1 * s.dustGoldValue);
                            }
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
                            if (s.devMode) devEvents.push(`[${s.tickCount}] Risk event: stocks lost ${(lossRate * 100).toFixed(0)}% ($${loss.toFixed(2)})`);
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
                            if (s.devMode) devEvents.push(`[${s.tickCount}] Risk event: highRisk lost ${(lossRate * 100).toFixed(0)}% ($${loss.toFixed(2)})`);
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

                    // Driver round-trip: load bars first (premium), then flakes; deposit to vault
                    let driverLoadedFlakes = 0;
                    let driverLoadedBars = 0;
                    let newDriverCarryingFlakes = s.driverCarryingFlakes;
                    let newDriverCarryingBars = s.driverCarryingBars;
                    let newVaultFlakes = s.vaultFlakes;
                    let newVaultBars = s.vaultBars;
                    let newDriverTripTicks = s.driverTripTicks;

                    if (s.hasDriver) {
                        const tripDuration = getTravelDurationTicks(s.vehicleTier);
                        const capacity = getDriverCapacity(s.driverCapUpgrades);

                        if (newDriverTripTicks === 0) {
                            // Driver is idle — prioritize bars, fill remaining capacity with flakes
                            const availableBars = s.goldBars - goldBarsSold;
                            const availableFlakes = s.gold + goldGained - goldSold;
                            const barsToLoad = Math.min(Math.max(0, availableBars), capacity);
                            const flakesToLoad = Math.min(Math.max(0, availableFlakes), capacity - barsToLoad);
                            if (barsToLoad > 0 || flakesToLoad > 0) {
                                driverLoadedBars = barsToLoad;
                                driverLoadedFlakes = flakesToLoad;
                                newDriverCarryingBars = barsToLoad;
                                newDriverCarryingFlakes = flakesToLoad;
                                newDriverTripTicks = 1;
                            }
                        } else {
                            newDriverTripTicks++;
                            if (newDriverTripTicks === tripDuration) {
                                // Arrived at town — deposit into vault
                                newVaultBars += newDriverCarryingBars;
                                newVaultFlakes += newDriverCarryingFlakes;
                                if (s.devMode) devEvents.push(`[${s.tickCount}] Driver deposited ${(newDriverCarryingBars + newDriverCarryingFlakes).toFixed(2)}oz → vault`);
                                newDriverCarryingBars = 0;
                                newDriverCarryingFlakes = 0;
                            }
                            if (newDriverTripTicks >= tripDuration * 2) {
                                newDriverTripTicks = 0;
                            }
                        }
                    }

                    // Banker auto-sell: on arrival at Town with goldInPocket
                    let bankerArrivalGoldSold = 0;
                    let bankerArrivalBarsSold = 0;
                    let bankerArrivalMoneyGained = 0;

                    if (newLocation === 'town' && s.bankerWorkers > 0 && s.goldInPocket > 0) {
                        if (s.hasFurnace) {
                            const availAfterOthers = s.goldBars - goldBarsSold;
                            if (availAfterOthers > 0) {
                                bankerArrivalBarsSold = Math.min(s.goldInPocket, availAfterOthers);
                                const baseValue = bankerArrivalBarsSold * s.goldPrice * GOLD_BAR_PRICE_MULTIPLIER;
                                bankerArrivalMoneyGained = baseValue * (1 + 0.1 * s.dustGoldValue);
                            }
                        } else {
                            const goldAvailableAfterOtherSells = s.gold + goldGained - goldSold - driverLoadedFlakes;
                            if (goldAvailableAfterOtherSells > 0) {
                                bankerArrivalGoldSold = Math.min(s.goldInPocket, goldAvailableAfterOtherSells);
                                const baseValue = bankerArrivalGoldSold * s.goldPrice;
                                const fee = baseValue * SMELTING_FEE_PERCENT;
                                bankerArrivalMoneyGained = (baseValue - fee) * (1 + 0.1 * s.dustGoldValue);
                            }
                        }
                        if (bankerArrivalMoneyGained > 0) {
                            capturedBankerArrivalMoney = bankerArrivalMoneyGained;
                            if (s.devMode) devEvents.push(`[${s.tickCount}] Banker auto-sold ${(bankerArrivalGoldSold + bankerArrivalBarsSold).toFixed(3)}oz → $${bankerArrivalMoneyGained.toFixed(2)}`);
                        }
                    }

                    // Furnace: smelt tick and worker automation
                    let newFurnaceFilled = s.furnaceFilled;
                    let newFurnaceRunning = s.furnaceRunning;
                    let newFurnaceBars = s.furnaceBars;
                    let newGoldBars = s.goldBars - goldBarsSold - bankerArrivalBarsSold;

                    if (s.hasFurnace) {
                        // Furnace worker automation: auto-load, auto-start, auto-collect
                        if (s.furnaceWorkers > 0 && canAffordWorkers) {
                            // Auto-load: move gold flakes → furnaceFilled
                            const goldAfterGained = s.gold + goldGained - goldSold;
                            if (goldAfterGained > 0 && newFurnaceFilled < FURNACE_CAPACITY) {
                                const space = FURNACE_CAPACITY - newFurnaceFilled;
                                const autoTransfer = Math.min(goldAfterGained, space);
                                // Note: auto-load consumes from gold; goldSold already accounts for banker sales
                                // We track this by adjusting gold in the return below
                                newFurnaceFilled += autoTransfer;
                                // goldSold gets an effective increase from this auto-load
                                goldSold += autoTransfer;
                            }
                            // Auto-start: if furnace has content and isn't running, start it
                            if (newFurnaceFilled > 0 && !newFurnaceRunning) {
                                newFurnaceRunning = true;
                            }
                            // Auto-collect: move furnaceBars → goldBars
                            if (newFurnaceBars > 0) {
                                newGoldBars += newFurnaceBars;
                                newFurnaceBars = 0;
                            }
                        }

                        // Smelt tick: drain furnaceFilled → furnaceBars
                        if (newFurnaceRunning && newFurnaceFilled > 0) {
                            const smeltPerTick = (SMELT_RATE_BASE * s.furnaceGear) / 60;
                            const actualSmelt = Math.min(newFurnaceFilled, smeltPerTick);
                            newFurnaceFilled -= actualSmelt;
                            newFurnaceBars += actualSmelt;
                            if (newFurnaceFilled <= 0) {
                                newFurnaceFilled = 0;
                                newFurnaceRunning = false;
                            }
                        }
                    }

                    // Gold market price update
                    let newGoldPrice = s.goldPrice;
                    let newLastGoldPriceUpdate = s.lastGoldPriceUpdate;
                    let newGoldPriceHistory = s.goldPriceHistory;
                    if (s.tickCount - s.lastGoldPriceUpdate >= GOLD_PRICE_UPDATE_TICKS) {
                        const swing = (Math.random() - 0.5) * 0.2;
                        const reversion = (1.0 - s.goldPrice) * 0.1;
                        newGoldPrice = Math.max(GOLD_PRICE_MIN, Math.min(GOLD_PRICE_MAX, s.goldPrice + swing + reversion));
                        newLastGoldPriceUpdate = s.tickCount;
                        newGoldPriceHistory = [...s.goldPriceHistory.slice(-19), newGoldPrice];
                        if (s.devMode) devEvents.push(`[${s.tickCount}] Gold price → $${newGoldPrice.toFixed(3)}/oz`);
                    }

                    return {
                        tickCount: s.tickCount + 1,
                        timePlayed: newTimePlayed,
                        bucketFilled: newBucketFilled,
                        panFilled: newPanFilled,
                        sluiceBoxFilled: newSluiceBoxFilled,
                        minersMossFilled: newMinersMossFilled,
                        richDirtInBucket: newRichDirtInBucket,
                        richDirtInSluice: newRichDirtInSluice,
                        detectProgress: newDetectProgress,
                        detectTarget: newDetectTarget,
                        patchActive: newPatchActive,
                        patchRemaining: newPatchRemaining,
                        patchCapacity: newPatchCapacity,
                        dirt: s.dirt + dirtChange,
                        paydirt: s.paydirt + paydirtChange,
                        gold: s.gold + goldGained - goldSold - driverLoadedFlakes - bankerArrivalGoldSold,
                        goldBars: Math.max(0, newGoldBars - driverLoadedBars),
                        furnaceFilled: newFurnaceFilled,
                        furnaceRunning: newFurnaceRunning,
                        furnaceBars: newFurnaceBars,
                        driverCarryingFlakes: newDriverCarryingFlakes,
                        driverCarryingBars: newDriverCarryingBars,
                        driverCapUpgrades: s.driverCapUpgrades,
                        vaultFlakes: newVaultFlakes,
                        vaultBars: newVaultBars,
                        money: moneyAfterPayroll + bankerArrivalMoneyGained,
                        runMoneyEarned: s.runMoneyEarned + moneyGained + bankerArrivalMoneyGained,
                        totalGoldExtracted: s.totalGoldExtracted + goldGained,
                        totalMoneyEarned: s.totalMoneyEarned + moneyGained + bankerArrivalMoneyGained,
                        peakRunMoney: Math.max(s.peakRunMoney, s.runMoneyEarned + moneyGained + bankerArrivalMoneyGained),
                        goldInPocket: (bankerArrivalGoldSold > 0 || bankerArrivalBarsSold > 0) ? 0 : s.goldInPocket,
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
                        goldPriceHistory: newGoldPriceHistory,
                        devLogs: s.devMode && devEvents.length > 0
                            ? [...devEvents, ...s.devLogs].slice(0, 100)
                            : s.devLogs,
                    };
                });

                for (const { message, type } of riskToasts) {
                    get().addToast(message, type);
                }
                if (capturedBankerArrivalMoney > 0) {
                    const bankerAmtStr = capturedBankerArrivalMoney >= 1000
                        ? `${(capturedBankerArrivalMoney / 1000).toFixed(1)}K`
                        : capturedBankerArrivalMoney.toFixed(2);
                    get().addToast(`🏦 Banker sold your gold for $${bankerAmtStr}`, 'success');
                    get().addFloatingNumber('money', capturedBankerArrivalMoney);
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
            sluiceBoxFilled: state.sluiceBoxFilled,
            minersMossFilled: state.minersMossFilled,
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
            haulers: state.haulers,
            sluiceWorkers: state.sluiceWorkers,
            furnaceWorkers: state.furnaceWorkers,
            bankerWorkers: state.bankerWorkers,
            hasSluiceBox: state.hasSluiceBox,
            hasFurnace: state.hasFurnace,
            scoopPower: state.scoopPower,
            sluicePower: state.sluicePower,
            panPower: state.panPower,
            sluiceGear: state.sluiceGear,
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
            lastSeenChangelogVersion: state.lastSeenChangelogVersion,
            totalGoldExtracted: state.totalGoldExtracted,
            totalMoneyEarned: state.totalMoneyEarned,
            peakRunMoney: state.peakRunMoney,
            richDirtInBucket: state.richDirtInBucket,
            richDirtInSluice: state.richDirtInSluice,
            hasMetalDetector: state.hasMetalDetector,
            detectorWorkers: state.detectorWorkers,
            hasMotherlode: state.hasMotherlode,
            dustDetectRate: state.dustDetectRate,
            dustSpotCap: state.dustSpotCap,
            detectProgress: state.detectProgress,
            detectTarget: state.detectTarget,
            patchActive: state.patchActive,
            patchRemaining: state.patchRemaining,
            patchCapacity: state.patchCapacity,
            furnaceFilled: state.furnaceFilled,
            furnaceRunning: state.furnaceRunning,
            furnaceBars: state.furnaceBars,
            goldBars: state.goldBars,
            driverCarryingFlakes: state.driverCarryingFlakes,
            driverCarryingBars: state.driverCarryingBars,
            driverCapUpgrades: state.driverCapUpgrades,
            vaultFlakes: state.vaultFlakes,
            vaultBars: state.vaultBars,
        }),
        migrate: (persisted, fromVersion) => {
            try {
                return migrateToLatest(persisted, fromVersion ?? undefined);
            } catch (e) {
                console.warn("Migration failed; using default save.", e);
                return defaultSaveV28();
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
            state.floatingNumbers = [];
            // Return any gold the driver was carrying mid-trip to the mine
            if (state.driverCarryingFlakes > 0) {
                state.gold += state.driverCarryingFlakes;
                state.driverCarryingFlakes = 0;
            }
            if (state.driverCarryingBars > 0) {
                state.goldBars += state.driverCarryingBars;
                state.driverCarryingBars = 0;
            }
            state.goldPriceHistory = [state.goldPrice];
            // If lastGoldPriceUpdate is ahead of tickCount (e.g. stale value after prestige reset tickCount to 0),
            // reset it so the price update timer doesn't get stuck indefinitely.
            if (state.lastGoldPriceUpdate > state.tickCount) {
                state.lastGoldPriceUpdate = 0;
            }
            if (state.sluiceBoxFilled < 0) state.sluiceBoxFilled = 0;
            if (state.minersMossFilled < 0) state.minersMossFilled = 0;
            state.devMode = false;
            state.devLogs = [];
            // Restore gold-in-pocket on reload: if at Town, all current sellable gold was carried there
            state.goldInPocket = state.location === 'town' ? (state.hasFurnace ? state.goldBars : state.gold) : 0;
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