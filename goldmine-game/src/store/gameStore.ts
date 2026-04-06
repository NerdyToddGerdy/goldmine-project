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
import {defaultSaveV36, type LatestSave, migrateToLatest, SCHEMA_VERSION, STORAGE_KEY, getCommissionCost} from "./schema"
import type { Employee, Role, Rarity, RoleSlots, StoryNPCState, NPCId } from './schema';
export { makeCommonEmployee } from './schema';
export type { Employee, Role, NPCId } from './schema';
export { getCommissionCost, getCommissionOptions, NPC_COMMISSION_BASE } from './schema';
export type { NPCId as NPCIdType } from './schema';

// Fixed simulation step (ms). 60 FPS -> ~16.666..., we use 16.6667.
export const FIXED_DT_MS = 1000 / 60;

// Bucket capacity for manual scooping (base value)
export const BUCKET_CAPACITY = 10;

// Pan/Sluice capacity for processing (base value)
export const PAN_CAPACITY = 20;

// Dynamic capacity helpers — use these wherever state is available
export function getEffectiveBucketCapacity(bucketUpgradesTotal: number): number {
    return BUCKET_CAPACITY + 5 * bucketUpgradesTotal;
}
export function getEffectivePanCapacity(panCapUpgradesTotal: number): number {
    return PAN_CAPACITY + 10 * panCapUpgradesTotal;
}
// Manual pan click: base 1 unit, +0.5 per panSpeed level
export function getEffectivePanClickAmount(panSpeedUpgradesTotal: number): number {
    return 1 + 0.5 * panSpeedUpgradesTotal;
}

// Money-purchasable gear upgrade costs (3 levels each, resets on prestige)
export const BUCKET_UPGRADE_COSTS = [15, 55, 175] as const;
export const PAN_CAP_UPGRADE_COSTS = [15, 55, 175] as const;
export const PAN_SPEED_UPGRADE_COSTS = [8, 30, 100] as const;
export const MAX_GEAR_UPGRADE_LEVEL = 3;

export function getEffectiveMaxToolTier(smithLevel: number): number {
    return Math.min(MAX_TOOL_TIER, smithLevel + 1);
}
export function getEffectiveMaxGearLevel(smithLevel: number): number {
    return Math.min(MAX_GEAR_UPGRADE_LEVEL, smithLevel);
}

// Season goal (oz of gold mined to unlock winter commission) — doubles each season
export function getSeasonGoal(seasonNumber: number): number {
    return Math.round(100 * Math.pow(2, seasonNumber - 1));
}

const SETTLEMENT_STAGES = [
    { emoji: '🏕️', name: 'Camp' },
    { emoji: '⛺', name: 'Outpost' },
    { emoji: '🏚️', name: 'Shantytown' },
    { emoji: '🏠', name: 'Settlement' },
    { emoji: '🏘️', name: 'Hamlet' },
    { emoji: '🏡', name: 'Village' },
    { emoji: '🏗️', name: 'Boom Town' },
    { emoji: '🏘️', name: 'Township' },
    { emoji: '🏙️', name: 'Town' },
    { emoji: '🌆', name: 'City' },
] as const;

export function getSettlementStage(seasonNumber: number): { emoji: string; name: string } {
    const idx = Math.min(Math.max(0, (seasonNumber ?? 1) - 1), SETTLEMENT_STAGES.length - 1);
    return SETTLEMENT_STAGES[idx];
}

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
    resource: 'gold';
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
    mossLockedForFill: boolean // true after moss fills up; sluice can't refill until moss is fully emptied

    // Resources
    dirt: number // raw dirt from scooping
    paydirt: number // dirt that potentially contains gold
    gold: number // refined gold — also the spendable currency

    // Employees (new v29 system)
    employees: Employee[]
    roleSlots: RoleSlots
    storyNPCs: StoryNPCState
    seasonNumber: number
    npcsRetained: number
    draftPool: Employee[]
    draftPoolRefreshCost: number

    // Legacy cart count (auto-travel upgrades)
    carts: number // auto-travel upgrades

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

    // Season / commission system
    runGoldMined: number  // cumulative gold extracted this season (resets on commission)
    npcLevels: Record<NPCId, number>  // commission level per NPC (0 = not yet arrived)
    pendingCommission: NPCId | null   // NPC commissioned this winter (shown in spring banner)

    // Gear upgrades (persisted, reset on commission)
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

    // Metal detector
    richDirtInBucket: number     // portion of bucket fill that came from high-yield patch
    richDirtInSluice: number     // portion of sluice contents that is rich dirt
    hasMetalDetector: boolean
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
    goldBarsCertified: number    // bars certified by Assayer (collect at 1.2× gold bonus)

    // Changelog tracking (persisted)
    lastSeenChangelogVersion: string  // last changelog version player acknowledged

    // Lifetime stats (persisted, never reset)
    totalGoldExtracted: number  // cumulative gold panned across all runs

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
    certifyBars: () => boolean  // pay CERT_FEE in gold, move goldBars → goldBarsCertified (collect at 1.2×)
    buyUpgrade: (upgrade: string) => boolean // returns success

    // Hiring Hall actions (#113, #114)
    hireEmployee: (employeeId: string) => boolean
    dismissEmployee: (employeeId: string) => void
    refreshDraftPool: () => boolean
    assignEmployee: (employeeId: string, role: Role) => boolean
    unassignEmployee: (employeeId: string) => void
    buyRoleSlot: (role: Role) => boolean // stub — pricing in later issues
    mergeEmployees: (ids: [string, string, string]) => boolean
    postedJobs: Partial<Record<Role, boolean>>
    postJob: (role: Role) => boolean

    // Toasts
    addToast: (message: string, type?: ToastType) => void
    dismissToast: (id: number) => void

    // Floating numbers
    addFloatingNumber: (resource: 'gold', amount: number) => void

    // Settings
    setDarkMode: (dark: boolean) => void
    setLastSeenChangelogVersion: (version: string) => void

    // Dev tools
    toggleDevMode: () => void

    // Commission system (replaces prestige)
    selectCommission: (npcId: NPCId | null) => boolean
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

// Cost to post the job opening after buying the equipment (resets each season)
export const JOB_POSTING_COSTS: Partial<Record<Role, number>> = {
    sluiceOperator:   300,
    furnaceOperator:  2500,
    detectorOperator: 600,
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
export const GOLD_BAR_CERTIFIED_BONUS = 1.2; // certified bars yield 20% more gold oz when collected
export const CERT_FEE = 25;                   // gold oz to certify all bars in hand
export const FURNACE_CAPACITY = 10;           // oz of gold flakes the furnace holds
export const SMELT_RATE_BASE = 1.0;        // oz flakes → bars per second (× furnaceGear)
export const BASE_EXTRACTION = 0.2; // 20% base gold extraction rate
export const FLAKES_HAUL_FEE = 0.15; // 15% lost when driver delivers raw flakes — smelt into bars to avoid

// Trader head-start: oz of gold granted at the start of each new season (indexed by trader level)
export const TRADER_HEAD_START = [0, 0, 25, 75, 200] as const;
export function getTraderHeadStart(traderLevel: number): number {
    return TRADER_HEAD_START[Math.min(traderLevel, TRADER_HEAD_START.length - 1)] ?? 0;
}

// Driver carrier constants
export const DRIVER_BASE_CAPACITY = 10;    // oz per trip at no upgrades
export const DRIVER_CAP_BONUS_OZ = 5;      // oz added per Larger Carrier upgrade
export const MAX_DRIVER_CAP_UPGRADES = 3;

export function getDriverCapacity(capUpgrades: number): number {
    return DRIVER_BASE_CAPACITY + capUpgrades * DRIVER_CAP_BONUS_OZ;
}

// Tool upgrade tiers (5 tiers, fixed costs) — defined in data/tools.ts
export { MAX_TOOL_TIER, TOOL_TIERS } from "../data/tools";
import { MAX_TOOL_TIER } from "../data/tools";
export const SHOVEL_TIER_COSTS = [10, 50, 200, 800, 3000] as const;
export const PAN_TIER_COSTS = [10, 50, 200, 800, 3000] as const;

// Wage system - base wages per second

export function getUpgradeCost(baseUpgrade: string, owned: number): number {
    const upgrade = UPGRADES[baseUpgrade as keyof typeof UPGRADES];
    if (!upgrade) return Infinity;
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.multiplier, owned));
}

// Stat-to-output rates (calibrated so a Common employee at level 0 matches the old per-worker rate).
// Common L0: brawn=1, hustle=1 → power = 1*0.5 + 1*0.25 = 0.75. Rates scaled ×4 vs original.
export const MINER_DIRT_RATE = 3.2;            // dirt/sec per power unit
export const PROSPECTOR_PAN_RATE = 1.6;        // pan/sec per power unit
export const SLUICE_DRAIN_BOOST_RATE = 8 / 15; // drain multiplier per power unit
export const SLUICE_EXTRACTION_RATE = 4 / 37.5;// extraction bonus per power unit
export const DETECTOR_PROGRESS_RATE = 8 / 15;  // spots/sec per power unit

/** Starting stat value by rarity — all four stats begin at this value */
export const STAT_BASE: Record<Rarity, number> = {
    common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5,
};

/** Compute current stats from xpByRole + rarity (replaces stored stats) */
export function computeEmployeeStats(emp: Employee) {
    const base = STAT_BASE[emp.rarity];
    const lvl = (role: Role) => getEmployeeLevel(emp.xpByRole[role] ?? 0, emp.rarity);
    const allRoles: Role[] = ['miner', 'hauler', 'prospector', 'sluiceOperator', 'furnaceOperator', 'detectorOperator', 'certifier'];
    const totalLevels = allRoles.reduce((s, r) => s + lvl(r), 0);
    return {
        brawn:     base + Math.max(lvl('miner'), lvl('hauler')),
        dexterity: base + lvl('prospector'),
        technical: base + Math.max(lvl('sluiceOperator'), lvl('furnaceOperator'), lvl('detectorOperator'), lvl('certifier')),
        hustle:    base + Math.floor(totalLevels / 5),
    };
}

export const MAX_EXTRACTION_RATE = 0.8; // sluice ops cannot push extraction above this

/** Primary stat power for a given role (sqrt-scaled for diminishing returns) */
export function getEmployeeRolePower(e: Employee, role: Role): number {
    const { brawn, dexterity, technical, hustle } = computeEmployeeStats(e);
    const sh = Math.sqrt(hustle);
    switch (role) {
        case 'miner':
        case 'hauler':
            return Math.sqrt(brawn) * 0.5 + sh * 0.25;
        case 'prospector':
            return Math.sqrt(dexterity) * 0.5 + sh * 0.25;
        case 'sluiceOperator':
        case 'furnaceOperator':
        case 'detectorOperator':
        case 'certifier':
            return Math.sqrt(technical) * 0.5 + sh * 0.25;
    }
}

export const EMPLOYEE_LEVEL_CAPS: Record<Rarity, number> = {
    common: 10, uncommon: 15, rare: 20, epic: 25, legendary: 30,
};

export const EMPLOYEE_XP_RATE = 1 / 300; // 1 XP per 5 seconds of active work

export function getEmployeeLevel(xp: number, rarity: Rarity): number {
    return Math.min(Math.floor(Math.sqrt(xp / 10)), EMPLOYEE_LEVEL_CAPS[rarity]);
}

/** Sum of stat-driven power for all employees assigned to a role */
export function getAssignedPower(employees: Employee[], role: Role): number {
    return employees
        .filter(e => e.assignedRole === role)
        .reduce((sum, e) => sum + getEmployeeRolePower(e, role), 0);
}

/** Count of employees assigned to a role */
export function countAssigned(employees: Employee[], role: Role): number {
    return employees.filter(e => e.assignedRole === role).length;
}

// ─── Employee generation (Hiring Hall, #113) ─────────────────────────────────

export const HIRE_COSTS: Record<Rarity, number> = {
    common: 25,
    uncommon: 75,
    rare: 200,
    epic: 500,
    legendary: 1500,
};

export function getHireCost(e: Employee): number {
    return HIRE_COSTS[e.rarity];
}

// Assayer certification (#116)
// CERT_FEE is defined above (line ~293). UNCERTIFIED_BAR_PENALTY removed (no penalty in gold-as-currency model).

// Role slot upgrades (#117) — extra slots beyond the defaults (miner:5, hauler:1, prospector:5, sluiceOp:3, furnaceOp:2, detectorOp:2)
export const DEFAULT_ROLE_SLOTS: RoleSlots = { miner: 5, hauler: 1, prospector: 5, sluiceOperator: 3, furnaceOperator: 2, detectorOperator: 2, certifier: 1 };
export const ROLE_SLOT_COSTS: Record<Role, number[]> = {
    miner:            [300,  600, 1200],
    hauler:           [200,  400,  800],
    prospector:       [300,  600, 1200],
    sluiceOperator:   [400,  800],
    furnaceOperator:  [600, 1200],
    detectorOperator: [500],
    certifier:        [1200],
};

const _EMP_FIRST_NAMES = ['Jake', 'Clara', 'Hank', 'Mae', 'Buck', 'Ruth', 'Clem', 'Ida', 'Silas', 'Nell', 'Amos', 'Vera', 'Ezra', 'Pearl', 'Jeb', 'Flora', 'Gus', 'Ada', 'Doc', 'Lily'];
const _EMP_LAST_NAMES = ['Copper', 'Nugget', 'Vane', 'Frost', 'Crane', 'Hollow', 'Pike', 'Stone', 'Wells', 'Ash', 'Colt', 'Ridge', 'Marsh', 'Fox', 'Briggs', 'Slater', 'Quinn', 'Morrow', 'Drake', 'Finch'];

const _RARITY_WEIGHTS: [Rarity, number][] = [
    ['common', 60], ['uncommon', 25], ['rare', 10], ['epic', 4], ['legendary', 1],
];

let _empGenSeq = 0;

export const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const _RARITY_ORDER = RARITY_ORDER;

// Cost to forge 3 crew of rarity N into 1 of rarity N+1
export const MERGE_COSTS: Record<Rarity, number> = {
    common:    0,    // unused — can't merge into common
    uncommon:  50,
    rare:      150,
    epic:      400,
    legendary: 1000,
};

function _rollRarity(maxRarity: Rarity = 'legendary'): Rarity {
    const maxIdx = _RARITY_ORDER.indexOf(maxRarity);
    const allowed = _RARITY_WEIGHTS.filter(([r]) => _RARITY_ORDER.indexOf(r) <= maxIdx);
    const total = allowed.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * total;
    for (const [r, w] of allowed) { roll -= w; if (roll <= 0) return r; }
    return 'common';
}


export function generateEmployee(maxRarity: Rarity = 'legendary'): Employee {
    const rarity = _rollRarity(maxRarity);
    const first = _EMP_FIRST_NAMES[Math.floor(Math.random() * _EMP_FIRST_NAMES.length)];
    const last = _EMP_LAST_NAMES[Math.floor(Math.random() * _EMP_LAST_NAMES.length)];
    return {
        id: `emp-${Date.now()}-${++_empGenSeq}`,
        name: `${first} ${last}`,
        rarity,
        xpByRole: {},
        assignedRole: null,
    };
}

function _generateDraftPool(maxRarity: Rarity = 'legendary', poolSize = 4): Employee[] {
    return Array.from({ length: poolSize }, () => generateEmployee(maxRarity));
}

// ─────────────────────────────────────────────────────────────────────────────

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
            mossLockedForFill: false,

            // Resources
            dirt: 0,
            paydirt: 0,
            gold: 0,

            // Employees (v29)
            employees: [],
            roleSlots: { miner: 5, hauler: 1, prospector: 5, sluiceOperator: 3, furnaceOperator: 2, detectorOperator: 2, certifier: 1 },
            postedJobs: {},
            storyNPCs: { traderArrived: false, tavernBuilt: false, assayerArrived: false, blacksmithArrived: false },
            seasonNumber: 1,
            npcsRetained: 0,
            draftPool: [],
            draftPoolRefreshCost: 10,

            // Cart count
            carts: 0,

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

            // Season / commission system
            runGoldMined: 0,
            npcLevels: { trader: 0, tavernKeeper: 0, assayer: 0, blacksmith: 0 },
            pendingCommission: null,

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

            // Metal detector
            richDirtInBucket: 0,
            richDirtInSluice: 0,
            hasMetalDetector: false,
            hasMotherlode: false,
            detectProgress: 0,
            detectTarget: 0,
            patchActive: false,
            patchRemaining: 0,
            patchCapacity: 0,

            // Furnace active smelting
            furnaceFilled: 0,
            furnaceRunning: false,
            furnaceBars: 0,
            goldBars: 0,

            // Driver carrier
            driverCarryingFlakes: 0,
            driverCarryingBars: 0,
            driverCapUpgrades: 0,
            goldBarsCertified: 0,

            // Changelog tracking
            lastSeenChangelogVersion: defaultSaveV36().lastSeenChangelogVersion,

            // Lifetime stats
            totalGoldExtracted: 0,

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
                    mossLockedForFill: false,
                    dirt: 0,
                    paydirt: 0,
                    gold: 0,
                    employees: [],
                    carts: 0,
                    hasSluiceBox: false,
                    hasFurnace: false,
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
                    furnaceGear: 1,
                    unlockedPanning: false,
                    unlockedTown: false,
                    runGoldMined: 0,
                    vehicleTier: 0,
                    hasDriver: false,
                    isTraveling: false,
                    travelProgress: 0,
                    travelDestination: 'mine' as const,
                    driverTripTicks: 0,
                    richDirtInBucket: 0,
                    richDirtInSluice: 0,
                    hasMetalDetector: false,
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
                    goldBarsCertified: 0,
                    _accumulator: 0,
                    devMode: false,
                    devLogs: [],
                    // npcLevels, roleSlots, storyNPCs, seasonNumber preserved (permanent)
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
                    mossLockedForFill: false,
                    dirt: 0,
                    paydirt: 0,
                    gold: 0,
                    employees: [],
                    roleSlots: { miner: 5, hauler: 1, prospector: 5, sluiceOperator: 3, furnaceOperator: 2, detectorOperator: 2, certifier: 1 },
                    postedJobs: {},
                    storyNPCs: { traderArrived: false, tavernBuilt: false, assayerArrived: false, blacksmithArrived: false },
                    seasonNumber: 1,
                    npcsRetained: 0,
                    draftPool: [],
                    draftPoolRefreshCost: 10,
                    carts: 0,
                    hasSluiceBox: false,
                    hasFurnace: false,
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
                    furnaceGear: 1,
                    unlockedPanning: false,
                    unlockedTown: false,
                    runGoldMined: 0,
                    npcLevels: { trader: 0, tavernKeeper: 0, assayer: 0, blacksmith: 0 },
                    pendingCommission: null,
                    bucketUpgrades: 0,
                    panCapUpgrades: 0,
                    panSpeedUpgrades: 0,
                    vehicleTier: 0,
                    hasDriver: false,
                    isTraveling: false,
                    travelProgress: 0,
                    travelDestination: 'mine' as const,
                    driverTripTicks: 0,
                    timePlayed: 0,
                    darkMode: false,
                    richDirtInBucket: 0,
                    richDirtInSluice: 0,
                    hasMetalDetector: false,
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
                    goldBarsCertified: 0,
                    lastSeenChangelogVersion: defaultSaveV36().lastSeenChangelogVersion,
                    totalGoldExtracted: 0,
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
                    employees: s.employees,
                    roleSlots: s.roleSlots,
                    storyNPCs: s.storyNPCs,
                    seasonNumber: s.seasonNumber,
                    npcsRetained: s.npcsRetained,
                    draftPool: s.draftPool,
                    draftPoolRefreshCost: s.draftPoolRefreshCost,
                    carts: s.carts,
                    hasSluiceBox: s.hasSluiceBox,
                    hasFurnace: s.hasFurnace,
                    scoopPower: s.scoopPower,
                    sluicePower: s.sluicePower,
                    panPower: s.panPower,
                    sluiceGear: s.sluiceGear,
                    furnaceGear: s.furnaceGear,
                    unlockedPanning: s.unlockedPanning,
                    unlockedTown: s.unlockedTown,
                    runGoldMined: s.runGoldMined,
                    npcLevels: s.npcLevels,
                    pendingCommission: s.pendingCommission,
                    bucketUpgrades: s.bucketUpgrades,
                    panCapUpgrades: s.panCapUpgrades,
                    panSpeedUpgrades: s.panSpeedUpgrades,
                    vehicleTier: s.vehicleTier,
                    hasDriver: s.hasDriver,
                    timePlayed: s.timePlayed,
                    darkMode: s.darkMode,
                    lastSeenChangelogVersion: s.lastSeenChangelogVersion,
                    totalGoldExtracted: s.totalGoldExtracted,
                    richDirtInBucket: s.richDirtInBucket,
                    richDirtInSluice: s.richDirtInSluice,
                    hasMetalDetector: s.hasMetalDetector,
                    hasMotherlode: s.hasMotherlode,
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
                    goldBarsCertified: s.goldBarsCertified,
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
                    employees: migrated.employees,
                    roleSlots: migrated.roleSlots,
                    storyNPCs: migrated.storyNPCs,
                    seasonNumber: migrated.seasonNumber,
                    npcsRetained: migrated.npcsRetained,
                    draftPool: migrated.draftPool,
                    draftPoolRefreshCost: migrated.draftPoolRefreshCost,
                    carts: migrated.carts,
                    hasSluiceBox: migrated.hasSluiceBox,
                    hasFurnace: migrated.hasFurnace,
                    scoopPower: migrated.scoopPower,
                    sluicePower: migrated.sluicePower,
                    panPower: migrated.panPower,
                    sluiceGear: migrated.sluiceGear,
                    furnaceGear: migrated.furnaceGear,
                    unlockedPanning: migrated.unlockedPanning,
                    unlockedTown: migrated.unlockedTown,
                    runGoldMined: migrated.runGoldMined,
                    npcLevels: migrated.npcLevels,
                    pendingCommission: migrated.pendingCommission,
                    bucketUpgrades: migrated.bucketUpgrades,
                    panCapUpgrades: migrated.panCapUpgrades,
                    panSpeedUpgrades: migrated.panSpeedUpgrades,
                    vehicleTier: migrated.vehicleTier,
                    hasDriver: migrated.hasDriver,
                    timePlayed: migrated.timePlayed,
                    darkMode: migrated.darkMode,
                    lastSeenChangelogVersion: migrated.lastSeenChangelogVersion,
                    totalGoldExtracted: migrated.totalGoldExtracted,
                    richDirtInBucket: migrated.richDirtInBucket,
                    richDirtInSluice: migrated.richDirtInSluice,
                    hasMetalDetector: migrated.hasMetalDetector,
                    hasMotherlode: migrated.hasMotherlode,
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
                    goldBarsCertified: migrated.goldBarsCertified,
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
                    const bucketCap = getEffectiveBucketCapacity(s.bucketUpgrades);
                    // Can't scoop if bucket is full
                    if (s.bucketFilled >= bucketCap) return s;

                    const gained = s.scoopPower;
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
                        const sluiceCap = getEffectivePanCapacity(s.panCapUpgrades);
                        if (s.sluiceBoxFilled + s.bucketFilled > sluiceCap) return s;
                        return { sluiceBoxFilled: s.sluiceBoxFilled + s.bucketFilled, bucketFilled: 0, richDirtInSluice: s.richDirtInSluice + s.richDirtInBucket, richDirtInBucket: 0 };
                    }

                    // Direct pan path (no sluice box): entire bucket must fit
                    const panCap = getEffectivePanCapacity(s.panCapUpgrades);
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
                    const panCap = getEffectivePanCapacity(s.panCapUpgrades);
                    const spaceInPan = panCap - s.panFilled;
                    const consumed = Math.min(1, s.minersMossFilled);
                    const produced = Math.min(consumed * 3, spaceInPan);
                    if (consumed <= 0 || produced <= 0) return s;
                    return {
                        minersMossFilled: s.minersMossFilled - consumed,
                        panFilled: s.panFilled + produced,
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

                    const progress = s.detectProgress + DETECT_PROGRESS_PER_CLICK;

                    if (progress >= target) {
                        // Patch discovered!
                        const baseCapacity = Math.floor(Math.random() * (PATCH_CAPACITY_MAX - PATCH_CAPACITY_MIN + 1)) + PATCH_CAPACITY_MIN;
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
                const materialUsed = Math.min(s.panFilled, getEffectivePanClickAmount(s.panSpeedUpgrades));
                let extractionRate = BASE_EXTRACTION;
                extractionRate += getAssignedPower(s.employees, 'sluiceOperator') * SLUICE_EXTRACTION_RATE * s.sluiceGear;
                extractionRate = Math.min(extractionRate, MAX_EXTRACTION_RATE);
                // Paydirt from sluice box yields significantly more gold per unit
                const paydirtMultiplier = s.hasSluiceBox ? PAYDIRT_YIELD_MULTIPLIER : 1;
                const baseGold = materialUsed * s.panPower * extractionRate * paydirtMultiplier;
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
                });
            },

            cancelTravel: () => {
                set({ isTraveling: false, travelProgress: 0 });
            },

            buyVehicle: (tier: number) => {
                const s = get();
                if (tier < 1 || tier > 3) return false;
                if (tier <= s.vehicleTier) return false;
                if (tier !== s.vehicleTier + 1) return false; // must buy in order
                const tierData = VEHICLE_TIERS[tier as 1|2|3];
                if (s.gold < tierData.cost) return false;
                set({ gold: s.gold - tierData.cost, vehicleTier: tier });
                get().addToast(`🚗 ${tierData.name} purchased! Travel: ${tierData.travelSecs}s`, 'success');
                return true;
            },

            buyDriver: () => {
                const s = get();
                if (s.hasDriver) return false;
                if (s.vehicleTier < 2) return false; // requires Steam Wagon
                if (s.gold < DRIVER_COST) return false;
                set({ gold: s.gold - DRIVER_COST, hasDriver: true });
                get().addToast('🤠 Driver hired! He will auto-sell your gold.', 'success');
                return true;
            },

            // ─── Hiring Hall actions (#113, #114) ────────────────────────────

            hireEmployee: (employeeId: string) => {
                const s = get();
                const emp = s.draftPool.find(e => e.id === employeeId);
                if (!emp) return false;
                const cost = HIRE_COSTS[emp.rarity];
                if (s.gold < cost) return false;
                set({
                    gold: s.gold - cost,
                    draftPool: s.draftPool.filter(e => e.id !== employeeId),
                    employees: [...s.employees, emp],
                });
                return true;
            },

            dismissEmployee: (employeeId: string) => {
                set(s => ({ employees: s.employees.filter(e => e.id !== employeeId) }));
            },

            mergeEmployees: ([id1, id2, id3]: [string, string, string]) => {
                const s = get();
                const inputs = [id1, id2, id3].map(id => s.employees.find(e => e.id === id));
                if (inputs.some(e => !e)) return false;
                const [a, b, c] = inputs as Employee[];
                // All must be same rarity and unassigned
                if (a.rarity !== b.rarity || a.rarity !== c.rarity) return false;
                if ([a, b, c].some(e => e.assignedRole !== null)) return false;
                const rarityIdx = _RARITY_ORDER.indexOf(a.rarity);
                if (rarityIdx >= _RARITY_ORDER.length - 1) return false; // can't merge legendary
                const targetRarity = _RARITY_ORDER[rarityIdx + 1];
                const cost = MERGE_COSTS[targetRarity];
                if (s.gold < cost) return false;
                const merged: Employee = {
                    id: `emp-${Date.now()}-${++_empGenSeq}`,
                    name: a.name, // first selected keeps their name
                    rarity: targetRarity,
                    xpByRole: {},   // starts fresh at the new rarity's base stats
                    assignedRole: null,
                };
                const remaining = s.employees.filter(e => e.id !== id1 && e.id !== id2 && e.id !== id3);
                set({ gold: s.gold - cost, employees: [...remaining, merged] });
                return true;
            },

            postJob: (role: Role) => {
                const s = get();
                const cost = JOB_POSTING_COSTS[role];
                if (!cost) return false;
                if (s.postedJobs[role]) return false;
                if (s.gold < cost) return false;
                set({ gold: s.gold - cost, postedJobs: { ...s.postedJobs, [role]: true } });
                return true;
            },

            refreshDraftPool: () => {
                const s = get();
                const isInitial = s.draftPool.length === 0;
                if (!isInitial && s.gold < s.draftPoolRefreshCost) return false;
                const tavernLevel = s.npcLevels.tavernKeeper;
                const poolSize = tavernLevel >= 4 ? 6 : tavernLevel >= 2 ? 4 : 2;
                const maxRarity: Rarity =
                    tavernLevel >= 4 ? 'legendary' : tavernLevel >= 3 ? 'epic' : tavernLevel >= 2 ? 'rare' : 'uncommon';
                set({
                    gold: isInitial ? s.gold : s.gold - s.draftPoolRefreshCost,
                    draftPool: _generateDraftPool(maxRarity, poolSize),
                });
                return true;
            },

            assignEmployee: (employeeId: string, role: Role) => {
                const s = get();
                const emp = s.employees.find(e => e.id === employeeId);
                if (!emp || emp.assignedRole !== null) return false;
                if (countAssigned(s.employees, role) >= s.roleSlots[role]) return false;
                set({ employees: s.employees.map(e => e.id === employeeId ? { ...e, assignedRole: role } : e) });
                return true;
            },

            unassignEmployee: (employeeId: string) => {
                set(s => ({ employees: s.employees.map(e => e.id === employeeId ? { ...e, assignedRole: null } : e) }));
            },

            buyRoleSlot: (role: Role) => {
                const s = get();
                const extra = s.roleSlots[role] - DEFAULT_ROLE_SLOTS[role];
                const costs = ROLE_SLOT_COSTS[role];
                if (extra >= costs.length) return false;
                const cost = costs[extra];
                if (s.gold < cost) return false;
                set({ gold: s.gold - cost, roleSlots: { ...s.roleSlots, [role]: s.roleSlots[role] + 1 } });
                return true;
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
                // Redeems furnace bars and any gold bars in inventory back to spendable gold.
                // Certified bars yield GOLD_BAR_CERTIFIED_BONUS (1.2×).
                set((s) => {
                    if (s.furnaceBars <= 0 && s.goldBars <= 0 && s.goldBarsCertified <= 0) return s;
                    const certifiedValue = s.goldBarsCertified * GOLD_BAR_CERTIFIED_BONUS;
                    const totalGold = s.furnaceBars + s.goldBars + certifiedValue;
                    return { gold: s.gold + totalGold, furnaceBars: 0, goldBars: 0, goldBarsCertified: 0 };
                });
            },

            certifyBars: () => {
                const s = get();
                if (!s.storyNPCs.assayerArrived) return false;
                if (s.gold < CERT_FEE) return false;
                if (s.goldBars < 0.001) return false;
                set({ gold: s.gold - CERT_FEE, goldBarsCertified: s.goldBarsCertified + s.goldBars, goldBars: 0 });
                return true;
            },

            buyUpgrade: (upgrade: string) => {
                const s = get();

                // Worker hiring removed — handled by Hiring Hall (#113)
                const smithLevel = s.npcLevels.blacksmith ?? 0;
                if (upgrade === 'betterShovel') {
                    const tier = s.scoopPower - 1; // 0-indexed current tier
                    if (tier >= getEffectiveMaxToolTier(smithLevel)) return false;
                    const cost = SHOVEL_TIER_COSTS[tier];
                    if (s.gold >= cost) {
                        set({
                            gold: s.gold - cost,
                            scoopPower: s.scoopPower + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterPan') {
                    const tier = s.panPower - 1; // 0-indexed current tier
                    if (tier >= getEffectiveMaxToolTier(smithLevel)) return false;
                    const cost = PAN_TIER_COSTS[tier];
                    if (s.gold >= cost) {
                        set({
                            gold: s.gold - cost,
                            panPower: s.panPower + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterSluice') {
                    const cost = getUpgradeCost('betterSluice', s.sluiceGear - 1);
                    if (s.gold >= cost && s.hasSluiceBox) {
                        set({
                            gold: s.gold - cost,
                            sluiceGear: s.sluiceGear + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'betterFurnace') {
                    const cost = getUpgradeCost('betterFurnace', s.furnaceGear - 1);
                    if (s.gold >= cost && s.hasFurnace) {
                        set({
                            gold: s.gold - cost,
                            furnaceGear: s.furnaceGear + 1,
                        });
                        return true;
                    }
                } else if (upgrade === 'sluiceBox') {
                    const cost = EQUIPMENT.sluiceBox.cost;
                    if (s.gold >= cost && !s.hasSluiceBox) {
                        set({ gold: s.gold - cost, hasSluiceBox: true });
                        get().addToast('🚿 Sluice Box purchased! Sluice Operators now available.', 'success');
                        return true;
                    }
                } else if (upgrade === 'furnace') {
                    const cost = EQUIPMENT.furnace.cost;
                    if (s.gold >= cost && !s.hasFurnace) {
                        set({ gold: s.gold - cost, hasFurnace: true });
                        get().addToast('⚗️ Furnace purchased! Furnace Operators now available.', 'success');
                        return true;
                    }
                } else if (upgrade === 'bucketUpgrade') {
                    if (s.bucketUpgrades >= getEffectiveMaxGearLevel(smithLevel)) return false;
                    const cost = BUCKET_UPGRADE_COSTS[s.bucketUpgrades];
                    if (s.gold >= cost) {
                        set({ gold: s.gold - cost, bucketUpgrades: s.bucketUpgrades + 1 });
                        return true;
                    }
                } else if (upgrade === 'panCapUpgrade') {
                    if (s.panCapUpgrades >= getEffectiveMaxGearLevel(smithLevel)) return false;
                    const cost = PAN_CAP_UPGRADE_COSTS[s.panCapUpgrades];
                    if (s.gold >= cost) {
                        set({ gold: s.gold - cost, panCapUpgrades: s.panCapUpgrades + 1 });
                        return true;
                    }
                } else if (upgrade === 'panSpeedUpgrade') {
                    if (s.panSpeedUpgrades >= getEffectiveMaxGearLevel(smithLevel)) return false;
                    const cost = PAN_SPEED_UPGRADE_COSTS[s.panSpeedUpgrades];
                    if (s.gold >= cost) {
                        set({ gold: s.gold - cost, panSpeedUpgrades: s.panSpeedUpgrades + 1 });
                        return true;
                    }
                } else if (upgrade === 'metalDetector') {
                    const cost = EQUIPMENT.metalDetector.cost;
                    if (s.gold >= cost && !s.hasMetalDetector) {
                        set({ gold: s.gold - cost, hasMetalDetector: true });
                        get().addToast('🔍 Metal Detector purchased!', 'success');
                        return true;
                    }
                } else if (upgrade === 'motherlode') {
                    const cost = EQUIPMENT.motherlode.cost;
                    if (s.gold >= cost && s.hasMetalDetector && !s.hasMotherlode) {
                        set({ gold: s.gold - cost, hasMotherlode: true });
                        get().addToast('💎 Motherlode Upgrade installed!', 'success');
                        return true;
                    }
                } else if (upgrade === 'largerCarrier') {
                    if (s.hasDriver && s.driverCapUpgrades < MAX_DRIVER_CAP_UPGRADES) {
                        const cost = getUpgradeCost('largerCarrier', s.driverCapUpgrades);
                        if (s.gold >= cost) {
                            set({ gold: s.gold - cost, driverCapUpgrades: s.driverCapUpgrades + 1 });
                            return true;
                        }
                    }
                }

                return false;
            },

            // fireWorker removed — role assignment handled by #114

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

            selectCommission: (npcId: NPCId | null) => {
                const s = get();
                let newNpcLevels = s.npcLevels;
                if (npcId !== null) {
                    const currentLevel = s.npcLevels[npcId] ?? 0;
                    if (currentLevel < 1) return false;
                    newNpcLevels = { ...s.npcLevels, [npcId]: currentLevel + 1 };
                }

                set({
                    npcLevels: newNpcLevels,
                    pendingCommission: npcId,
                    // Permanent — keep and update
                    timePlayed: s.timePlayed,
                    darkMode: s.darkMode,
                    timeScale: s.timeScale,
                    totalGoldExtracted: s.totalGoldExtracted,
                    seasonNumber: s.seasonNumber + 1,
                    storyNPCs: s.storyNPCs,
                    roleSlots: s.roleSlots,
                    postedJobs: {},
                    // Reset run fields; trader head-start grants opening gold
                    gold: getTraderHeadStart(newNpcLevels.trader ?? 0),
                    isPaused: false,
                    tickCount: 0,
                    location: 'mine',
                    bucketFilled: 0,
                    panFilled: 0,
                    dirt: 0,
                    paydirt: 0,
                    employees: [],
                    carts: 0,
                    hasSluiceBox: false,
                    hasFurnace: false,
                    scoopPower: 1,
                    sluicePower: 1,
                    panPower: 1,
                    sluiceGear: 1,
                    furnaceGear: 1,
                    unlockedPanning: false,
                    unlockedTown: false,
                    runGoldMined: 0,
                    bucketUpgrades: 0,
                    panCapUpgrades: 0,
                    panSpeedUpgrades: 0,
                    vehicleTier: 0,
                    hasDriver: false,
                    isTraveling: false,
                    travelProgress: 0,
                    travelDestination: 'mine' as const,
                    driverTripTicks: 0,
                    sluiceBoxFilled: 0,
                    minersMossFilled: 0,
                    mossLockedForFill: false,
                    richDirtInBucket: 0,
                    richDirtInSluice: 0,
                    hasMetalDetector: false,
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
                    goldBarsCertified: 0,
                    _accumulator: 0,
                    toasts: [],
                    floatingNumbers: [],
                });
                return true;
            },

            _fixedTick: () => {
                let townJustUnlocked = false;
                const devEvents: string[] = [];
                const npcArrivals: string[] = [];
                const levelUps: string[] = [];

                set((s) => {
                    // Increment time played each tick
                    const newTimePlayed = s.timePlayed + 1;

                    // Determine bucket/pan capacity and idle state
                    const bucketCap = getEffectiveBucketCapacity(s.bucketUpgrades);
                    const panCap = getEffectivePanCapacity(s.panCapUpgrades);
                    const minersIdle = s.bucketFilled >= bucketCap;   // bucket full → miners blocked
                    const prospectsIdle = s.panFilled <= 0;             // pan empty → prospectors blocked

                    // Stat-driven worker power (zero when idle)
                    const miningPower = minersIdle ? 0 : getAssignedPower(s.employees, 'miner');
                    const prospectorPower = prospectsIdle ? 0 : getAssignedPower(s.employees, 'prospector');
                    const sluiceOpPower = getAssignedPower(s.employees, 'sluiceOperator');
                    const hasActiveHauler = countAssigned(s.employees, 'hauler') > 0;
                    const hasActiveFurnaceOp = countAssigned(s.employees, 'furnaceOperator') > 0;
                    const detectorPower = getAssignedPower(s.employees, 'detectorOperator');
                    const certifierPower = s.npcLevels.assayer >= 2
                        ? getAssignedPower(s.employees, 'certifier') : 0;

                    // Automation: miners fill the bucket
                    const dirtPerTick = (miningPower * MINER_DIRT_RATE) / 60;
                    let newBucketFilled = s.bucketFilled;
                    let newPanFilled = s.panFilled;
                    let newSluiceBoxFilled = s.sluiceBoxFilled;
                    let newMinersMossFilled = s.minersMossFilled;
                    let newRichDirtInSluice = s.richDirtInSluice;
                    let newRichDirtInBucketForAutoEmpty = s.richDirtInBucket; // tracks auto-empty transfers

                    // Sluice box drain: dirt drains over time, concentrated paydirt collects in miner's moss
                    // Moss must be fully emptied before it can accept more fill (batch cycle)
                    let newMossLockedForFill = s.mossLockedForFill;
                    if (newMinersMossFilled === 0) newMossLockedForFill = false;
                    if (s.hasSluiceBox) {
                        const sluiceCap = panCap; // sluice capacity = pan capacity
                        if (newSluiceBoxFilled > 0 && newMinersMossFilled < sluiceCap && !newMossLockedForFill) {
                            const richRatio = newSluiceBoxFilled > 0 ? Math.min(1, newRichDirtInSluice / newSluiceBoxFilled) : 0;
                            const effectiveConversion = richRatio * RICH_CONVERSION_RATIO + (1 - richRatio) * SLUICE_CONVERSION_RATIO;
                            // Sluice operators speed up the drain rate
                            const drainPerTick = (SLUICE_DRAIN_RATE * (1 + sluiceOpPower * SLUICE_DRAIN_BOOST_RATE)) / 60;
                            // Don't drain more than moss can absorb (via conversion ratio)
                            const maxDrain = Math.min(newSluiceBoxFilled, (sluiceCap - newMinersMossFilled) / effectiveConversion);
                            const actualDrain = Math.min(drainPerTick, maxDrain);
                            newSluiceBoxFilled = Math.max(0, newSluiceBoxFilled - actualDrain);
                            newRichDirtInSluice = Math.max(0, newRichDirtInSluice - actualDrain * richRatio);
                            newMinersMossFilled = Math.min(newMinersMossFilled + actualDrain * effectiveConversion, sluiceCap);
                            if (newMinersMossFilled >= sluiceCap) newMossLockedForFill = true;
                        }
                    }

                    // Auto-empty: always if upgrade owned, otherwise only when miners are active
                    if (s.hasSluiceBox) {
                        // Sluice path: bucket → sluice when full bucket fits in remaining space
                        if (s.bucketFilled >= bucketCap && newSluiceBoxFilled + s.bucketFilled <= panCap && (hasActiveHauler || dirtPerTick > 0)) {
                            newSluiceBoxFilled += s.bucketFilled;
                            newRichDirtInSluice += newRichDirtInBucketForAutoEmpty;
                            newRichDirtInBucketForAutoEmpty = 0;
                            newBucketFilled = 0;
                        }
                    } else {
                        // Direct pan path: entire bucket must fit
                        if (s.bucketFilled >= bucketCap && newPanFilled + s.bucketFilled <= panCap && (hasActiveHauler || dirtPerTick > 0)) {
                            newPanFilled += s.bucketFilled;
                            newRichDirtInBucketForAutoEmpty = 0;
                            newBucketFilled = 0;
                        }
                    }

                    // Sluice workers auto-clean moss → pan only once the moss is full
                    if (s.hasSluiceBox && sluiceOpPower > 0 && newMinersMossFilled >= panCap && newPanFilled < panCap) {
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
                    if (s.hasMetalDetector && detectorPower > 0 && !s.patchActive) {
                        const progressGain = (detectorPower * DETECTOR_PROGRESS_RATE) / 60;
                        // Roll a target if not started yet
                        if (newDetectTarget === 0) {
                            newDetectTarget = Math.floor(Math.random() * (DETECT_TARGET_MAX - DETECT_TARGET_MIN + 1)) + DETECT_TARGET_MIN;
                        }
                        newDetectProgress += progressGain;
                        if (newDetectProgress >= newDetectTarget) {
                            const baseCapacity = Math.floor(Math.random() * (PATCH_CAPACITY_MAX - PATCH_CAPACITY_MIN + 1)) + PATCH_CAPACITY_MIN;
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
                    if (prospectorPower > 0 && newPanFilled > 0) {
                        // Calculate extraction rate from employees (gear multiplies the bonus)
                        let extractionRate = BASE_EXTRACTION;
                        extractionRate += sluiceOpPower * SLUICE_EXTRACTION_RATE * s.sluiceGear;
                        extractionRate = Math.min(extractionRate, MAX_EXTRACTION_RATE);

                        // panRate is intentionally independent of extractionRate — sluice operators boost
                        // gold yield per unit consumed, not how fast dirt is consumed.
                        const panRate = (prospectorPower * PROSPECTOR_PAN_RATE * (1 + 0.2 * s.panSpeedUpgrades)) / 60;
                        const panConsumed = Math.min(newPanFilled, panRate);
                        // Paydirt (from sluice) yields more gold per unit than raw dirt
                        const paydirtMultiplier = s.hasSluiceBox ? PAYDIRT_YIELD_MULTIPLIER : 1;

                        newPanFilled -= panConsumed;
                        goldGained = panConsumed * extractionRate * paydirtMultiplier;
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

                    // Driver round-trip: load bars first, then flakes; deposit directly to gold balance
                    let driverLoadedFlakes = 0;
                    let driverLoadedBars = 0;
                    let newDriverCarryingFlakes = s.driverCarryingFlakes;
                    let newDriverCarryingBars = s.driverCarryingBars;
                    let driverDepositedGold = 0;
                    let newDriverTripTicks = s.driverTripTicks;

                    if (s.hasDriver) {
                        const tripDuration = getTravelDurationTicks(s.vehicleTier);
                        const capacity = getDriverCapacity(s.driverCapUpgrades);

                        if (newDriverTripTicks === 0) {
                            // Driver is idle — prioritize bars, fill remaining capacity with flakes
                            const availableBars = s.goldBars;
                            const availableFlakes = s.gold + goldGained;
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
                                // Arrived at town — bars at full value; flakes lose 15% haul fee
                                driverDepositedGold = newDriverCarryingBars + newDriverCarryingFlakes * (1 - FLAKES_HAUL_FEE);
                                if (s.devMode) devEvents.push(`[${s.tickCount}] Driver deposited ${driverDepositedGold.toFixed(2)}oz → gold (bars: ${newDriverCarryingBars.toFixed(2)}, flakes×0.85: ${(newDriverCarryingFlakes * (1 - FLAKES_HAUL_FEE)).toFixed(2)})`);
                                newDriverCarryingBars = 0;
                                newDriverCarryingFlakes = 0;
                            }
                            if (newDriverTripTicks >= tripDuration * 2) {
                                newDriverTripTicks = 0;
                            }
                        }
                    }

                    // Furnace: smelt tick and worker automation
                    let autoFurnaceLoad = 0;
                    let newFurnaceFilled = s.furnaceFilled;
                    let newFurnaceRunning = s.furnaceRunning;
                    let newFurnaceBars = s.furnaceBars;
                    let newGoldBars = s.goldBars;

                    if (s.hasFurnace) {
                        // Furnace worker automation: auto-load, auto-start, auto-collect
                        if (hasActiveFurnaceOp) {
                            // Auto-load: move gold flakes → furnaceFilled
                            const goldAvailable = s.gold + goldGained - driverLoadedFlakes;
                            if (goldAvailable > 0 && newFurnaceFilled < FURNACE_CAPACITY) {
                                const space = FURNACE_CAPACITY - newFurnaceFilled;
                                const autoTransfer = Math.min(goldAvailable, space);
                                newFurnaceFilled += autoTransfer;
                                autoFurnaceLoad = autoTransfer;
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

                    // Certifier automation (#125): auto-certify bars on a power-scaled cycle
                    let newGoldBarsCertified = s.goldBarsCertified;
                    let certFeeCharged = 0;
                    if (certifierPower > 0 && s.hasFurnace && newGoldBars >= 0.001) {
                        const certCycle = Math.max(30, Math.floor(120 / certifierPower));
                        if (s.tickCount % certCycle === 0 && s.gold >= CERT_FEE) {
                            certFeeCharged = CERT_FEE;
                            newGoldBarsCertified += newGoldBars;
                            newGoldBars = 0;
                        }
                    }

                    // ── NPC Arrival Triggers (#115) ───────────────────────────────────────
                    const newTotalGold = s.totalGoldExtracted + goldGained;
                    const newStoryNPCs = { ...s.storyNPCs };
                    const newNpcLevels = { ...s.npcLevels };

                    if (!newStoryNPCs.traderArrived && newTotalGold > 0) {
                        newStoryNPCs.traderArrived = true;
                        newNpcLevels.trader = 1;
                        npcArrivals.push('🏪 A wandering trader sets up camp near your claim...');
                    }
                    if (!newStoryNPCs.blacksmithArrived && newTotalGold > 0) {
                        newStoryNPCs.blacksmithArrived = true;
                        newNpcLevels.blacksmith = 1;
                        npcArrivals.push('🔨 A blacksmith has set up shop — tools and upgrades are available.');
                    }
                    if (!newStoryNPCs.tavernBuilt && newTotalGold >= 75) {
                        newStoryNPCs.tavernBuilt = true;
                        newNpcLevels.tavernKeeper = 1;
                        npcArrivals.push('🍺 Word spreads — a tavern keeper sets up where the workers gather.');
                    }
                    if (!newStoryNPCs.assayerArrived && s.hasFurnace) {
                        newStoryNPCs.assayerArrived = true;
                        newNpcLevels.assayer = 1;
                        npcArrivals.push('⚖️ An assayer has arrived — he can certify your gold bars.');
                    }
                    // ─────────────────────────────────────────────────────────────────────

                    // ── Employee XP Gain (#118) ───────────────────────────────────────────
                    const ROLE_DISPLAY: Record<Role, string> = {
                        miner: 'Miner', hauler: 'Hauler', prospector: 'Prospector',
                        sluiceOperator: 'Sluice Operator', furnaceOperator: 'Furnace Operator',
                        detectorOperator: 'Detector Operator', certifier: 'Certifier',
                    };
                    const newEmployees = s.employees.map(e => {
                        if (e.assignedRole === null) return e;
                        if (e.assignedRole === 'miner' && minersIdle) return e;
                        if (e.assignedRole === 'prospector' && prospectsIdle) return e;
                        if (e.assignedRole === 'certifier' && (s.npcLevels.assayer < 2 || !s.hasFurnace || s.goldBars < 0.001)) return e;
                        const role = e.assignedRole;
                        const oldXp = e.xpByRole[role] ?? 0;
                        const oldLevel = getEmployeeLevel(oldXp, e.rarity);
                        if (oldLevel >= EMPLOYEE_LEVEL_CAPS[e.rarity]) return e;
                        const newXp = oldXp + EMPLOYEE_XP_RATE;
                        const newLevel = getEmployeeLevel(newXp, e.rarity);
                        if (newLevel > oldLevel) {
                            levelUps.push(`${e.name} reached Level ${newLevel} as ${ROLE_DISPLAY[role]}!`);
                        }
                        return { ...e, xpByRole: { ...e.xpByRole, [role]: newXp } };
                    });
                    // ─────────────────────────────────────────────────────────────────────

                    return {
                        tickCount: s.tickCount + 1,
                        timePlayed: newTimePlayed,
                        employees: newEmployees,
                        bucketFilled: newBucketFilled,
                        panFilled: newPanFilled,
                        sluiceBoxFilled: newSluiceBoxFilled,
                        minersMossFilled: newMinersMossFilled,
                        mossLockedForFill: newMossLockedForFill,
                        richDirtInBucket: newRichDirtInBucket,
                        richDirtInSluice: newRichDirtInSluice,
                        detectProgress: newDetectProgress,
                        detectTarget: newDetectTarget,
                        patchActive: newPatchActive,
                        patchRemaining: newPatchRemaining,
                        patchCapacity: newPatchCapacity,
                        dirt: s.dirt + dirtChange,
                        paydirt: s.paydirt + paydirtChange,
                        gold: s.gold + goldGained - autoFurnaceLoad - driverLoadedFlakes + driverDepositedGold - certFeeCharged,
                        goldBars: Math.max(0, newGoldBars - driverLoadedBars),
                        goldBarsCertified: newGoldBarsCertified,
                        furnaceFilled: newFurnaceFilled,
                        furnaceRunning: newFurnaceRunning,
                        furnaceBars: newFurnaceBars,
                        driverCarryingFlakes: newDriverCarryingFlakes,
                        driverCarryingBars: newDriverCarryingBars,
                        driverCapUpgrades: s.driverCapUpgrades,
                        runGoldMined: s.runGoldMined + goldGained,
                        totalGoldExtracted: s.totalGoldExtracted + goldGained,
                        isTraveling: newIsTraveling,
                        travelProgress: newTravelProgress,
                        location: newLocation,
                        storyNPCs: newStoryNPCs,
                        npcLevels: newNpcLevels,
                        unlockedTown: s.unlockedTown || townJustUnlocked,
                        driverTripTicks: newDriverTripTicks,
                        devLogs: s.devMode && devEvents.length > 0
                            ? [...devEvents, ...s.devLogs].slice(0, 100)
                            : s.devLogs,
                    };
                });

                if (townJustUnlocked) {
                    get().addToast('🏘️ You arrived at Town for the first time!', 'info');
                }
                for (const msg of npcArrivals) {
                    get().addToast(msg, 'success');
                }
                for (const msg of levelUps) {
                    get().addToast(`⬆️ ${msg}`, 'success');
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
            employees: state.employees,
            roleSlots: state.roleSlots,
            postedJobs: state.postedJobs,
            storyNPCs: state.storyNPCs,
            seasonNumber: state.seasonNumber,
            npcsRetained: state.npcsRetained,
            draftPool: state.draftPool,
            draftPoolRefreshCost: state.draftPoolRefreshCost,
            carts: state.carts,
            hasSluiceBox: state.hasSluiceBox,
            hasFurnace: state.hasFurnace,
            scoopPower: state.scoopPower,
            sluicePower: state.sluicePower,
            panPower: state.panPower,
            sluiceGear: state.sluiceGear,
            furnaceGear: state.furnaceGear,
            unlockedPanning: state.unlockedPanning,
            unlockedTown: state.unlockedTown,
            runGoldMined: state.runGoldMined,
            npcLevels: state.npcLevels,
            pendingCommission: state.pendingCommission,
            bucketUpgrades: state.bucketUpgrades,
            panCapUpgrades: state.panCapUpgrades,
            panSpeedUpgrades: state.panSpeedUpgrades,
            vehicleTier: state.vehicleTier,
            hasDriver: state.hasDriver,
            timePlayed: state.timePlayed,
            darkMode: state.darkMode,
            lastSeenChangelogVersion: state.lastSeenChangelogVersion,
            totalGoldExtracted: state.totalGoldExtracted,
            richDirtInBucket: state.richDirtInBucket,
            richDirtInSluice: state.richDirtInSluice,
            hasMetalDetector: state.hasMetalDetector,
            hasMotherlode: state.hasMotherlode,
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
            goldBarsCertified: state.goldBarsCertified,
        }),
        migrate: (persisted, fromVersion) => {
            try {
                return migrateToLatest(persisted, fromVersion ?? undefined);
            } catch (e) {
                console.warn("Migration failed; using default save.", e);
                return defaultSaveV36();
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
            if (state.sluiceBoxFilled < 0) state.sluiceBoxFilled = 0;
            if (state.minersMossFilled < 0) state.minersMossFilled = 0;
            state.devMode = false;
            state.devLogs = [];
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