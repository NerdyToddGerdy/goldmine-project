// Central place to define what we persist and how to migrate between versions.

import { CHANGELOG } from '../data/changelog';

export const STORAGE_KEY = "goldmine:save";
export const SCHEMA_VERSION = 37 as const; // bump when persist shape changes

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type Role = 'miner' | 'hauler' | 'prospector' | 'sluiceOperator' | 'furnaceOperator' | 'detectorOperator' | 'certifier' | 'driller' | 'refiner';
export type NPCId = 'trader' | 'tavernKeeper' | 'assayer' | 'blacksmith' | 'mechanic';

export interface Employee {
    id: string;
    name: string;
    rarity: Rarity;
    xpByRole: Partial<Record<Role, number>>;
    assignedRole: Role | null;
}

export interface RoleSlots {
    miner: number;
    hauler: number;
    prospector: number;
    sluiceOperator: number;
    furnaceOperator: number;
    detectorOperator: number;
    certifier: number;
    driller: number;
    refiner: number;
}

export interface StoryNPCState {
    traderArrived: boolean;
    tavernBuilt: boolean;
    assayerArrived: boolean;
    blacksmithArrived: boolean;
    mechanicArrived?: boolean;  // v37+
}

let _empIdCounter = 0;
export function makeCommonEmployee(role: Role, name: string): Employee {
    return {
        id: `migrated-${role}-${++_empIdCounter}`,
        name,
        rarity: 'common',
        xpByRole: {},
        assignedRole: role,
    };
}

// v1: before you renamed dirtyGold -> paydirt
export type SaveV1 = {
    version?: 1;
    tickCount: number;
    timeScale: number;
    pannedGold: number;
    dirtyGold: number; // old field name
};

// v2: renamed dirtyGold to paydirt
export type SaveV2 = {
    version: 2;
    tickCount: number;
    timeScale: number;
    pannedGold: number;
    paydirt: number;
};

// v3: Full idle game with resources, upgrades, and locations
export type SaveV3 = {
    version: 3;
    tickCount: number;
    timeScale: number;
    location: 'mine' | 'town';
    dirt: number;
    paydirt: number;
    gold: number;
    money: number;
    shovels: number;
    pans: number;
    carts: number;
    scoopPower: number;
    panPower: number;
    unlockedPanning: boolean;
    unlockedTown: boolean;
    unlockedShop: boolean;
};

// v4: Added equipment (sluice box, magnetic separator, oven, furnace)
export type SaveV4 = {
    version: 4;
    tickCount: number;
    timeScale: number;
    location: 'mine' | 'town';
    dirt: number;
    paydirt: number;
    gold: number;
    money: number;
    shovels: number;
    pans: number;
    carts: number;
    hasSluiceBox: boolean;
    hasMagneticSeparator: boolean;
    hasOven: boolean;
    hasFurnace: boolean;
    scoopPower: number;
    panPower: number;
    unlockedPanning: boolean;
    unlockedTown: boolean;
    unlockedShop: boolean;
};

// v5: Added workers for equipment
export type SaveV5 = {
    version: 5;
    tickCount: number;
    timeScale: number;
    location: 'mine' | 'town';
    dirt: number;
    paydirt: number;
    gold: number;
    money: number;
    shovels: number;
    pans: number;
    carts: number;
    sluiceWorkers: number;
    separatorWorkers: number;
    ovenWorkers: number;
    furnaceWorkers: number;
    hasSluiceBox: boolean;
    hasMagneticSeparator: boolean;
    hasOven: boolean;
    hasFurnace: boolean;
    scoopPower: number;
    panPower: number;
    unlockedPanning: boolean;
    unlockedTown: boolean;
    unlockedShop: boolean;
};

// v6: Added equipment gear levels
export type SaveV6 = {
    version: 6;
    tickCount: number;
    timeScale: number;
    location: 'mine' | 'town';
    dirt: number;
    paydirt: number;
    gold: number;
    money: number;
    shovels: number;
    pans: number;
    carts: number;
    sluiceWorkers: number;
    separatorWorkers: number;
    ovenWorkers: number;
    furnaceWorkers: number;
    hasSluiceBox: boolean;
    hasMagneticSeparator: boolean;
    hasOven: boolean;
    hasFurnace: boolean;
    scoopPower: number;
    sluicePower: number;
    panPower: number;
    sluiceGear: number;
    separatorGear: number;
    ovenGear: number;
    furnaceGear: number;
    unlockedPanning: boolean;
    unlockedTown: boolean;
    unlockedShop: boolean;
};

// v7: Added banker workers and bank counter
export type SaveV7 = {
    version: 7;
    tickCount: number;
    timeScale: number;
    location: 'mine' | 'town';
    dirt: number;
    paydirt: number;
    gold: number;
    money: number;
    shovels: number;
    pans: number;
    carts: number;
    sluiceWorkers: number;
    separatorWorkers: number;
    ovenWorkers: number;
    furnaceWorkers: number;
    bankerWorkers: number;
    hasSluiceBox: boolean;
    hasMagneticSeparator: boolean;
    hasOven: boolean;
    hasFurnace: boolean;
    hasBankCounter: boolean;
    scoopPower: number;
    sluicePower: number;
    panPower: number;
    sluiceGear: number;
    separatorGear: number;
    ovenGear: number;
    furnaceGear: number;
    unlockedPanning: boolean;
    unlockedTown: boolean;
    unlockedShop: boolean;
};

// v8: Added bucket mechanic for manual scooping
export type SaveV8 = {
    version: 8;
    tickCount: number;
    timeScale: number;
    location: 'mine' | 'town';
    bucketFilled: number;
    dirt: number;
    paydirt: number;
    gold: number;
    money: number;
    shovels: number;
    pans: number;
    carts: number;
    sluiceWorkers: number;
    separatorWorkers: number;
    ovenWorkers: number;
    furnaceWorkers: number;
    bankerWorkers: number;
    hasSluiceBox: boolean;
    hasMagneticSeparator: boolean;
    hasOven: boolean;
    hasFurnace: boolean;
    hasBankCounter: boolean;
    scoopPower: number;
    sluicePower: number;
    panPower: number;
    sluiceGear: number;
    separatorGear: number;
    ovenGear: number;
    furnaceGear: number;
    unlockedPanning: boolean;
    unlockedTown: boolean;
    unlockedShop: boolean;
};

// v9: Added pan/sluice progress bar mechanic
export type SaveV9 = {
    version: 9;
    tickCount: number;
    timeScale: number;
    location: 'mine' | 'town';
    bucketFilled: number;
    panFilled: number;
    dirt: number;
    paydirt: number;
    gold: number;
    money: number;
    shovels: number;
    pans: number;
    carts: number;
    sluiceWorkers: number;
    separatorWorkers: number;
    ovenWorkers: number;
    furnaceWorkers: number;
    bankerWorkers: number;
    hasSluiceBox: boolean;
    hasMagneticSeparator: boolean;
    hasOven: boolean;
    hasFurnace: boolean;
    hasBankCounter: boolean;
    scoopPower: number;
    sluicePower: number;
    panPower: number;
    sluiceGear: number;
    separatorGear: number;
    ovenGear: number;
    furnaceGear: number;
    unlockedPanning: boolean;
    unlockedTown: boolean;
    unlockedShop: boolean;
};

// v10: Added investment system
export type SaveV10 = {
    version: 10;
    tickCount: number;
    timeScale: number;
    location: 'mine' | 'town';
    bucketFilled: number;
    panFilled: number;
    dirt: number;
    paydirt: number;
    gold: number;
    money: number;
    investmentSafeBonds: number;
    investmentStocks: number;
    investmentHighRisk: number;
    lastRiskCheck: number;
    shovels: number;
    pans: number;
    carts: number;
    sluiceWorkers: number;
    separatorWorkers: number;
    ovenWorkers: number;
    furnaceWorkers: number;
    bankerWorkers: number;
    hasSluiceBox: boolean;
    hasMagneticSeparator: boolean;
    hasOven: boolean;
    hasFurnace: boolean;
    hasBankCounter: boolean;
    scoopPower: number;
    sluicePower: number;
    panPower: number;
    sluiceGear: number;
    separatorGear: number;
    ovenGear: number;
    furnaceGear: number;
    unlockedPanning: boolean;
    unlockedTown: boolean;
    unlockedShop: boolean;
};

// v11: Added timePlayed (ticks) and darkMode preference
export type SaveV11 = Omit<SaveV10, 'version'> & {
    version: 11;
    timePlayed: number; // total ticks played (divide by 60 for seconds)
    darkMode: boolean;
};

// v12: Removed dead fields hasBankCounter + unlockedShop; added unlockedBanking (Phase 2 gate)
export type SaveV12 = Omit<SaveV11, 'version' | 'hasBankCounter' | 'unlockedShop'> & {
    version: 12;
    unlockedBanking: boolean;
};

// v13: Added prestige system — legacyDust, runMoneyEarned, prestigeCount
export type SaveV13 = Omit<SaveV12, 'version'> & {
    version: 13;
    legacyDust: number;
    runMoneyEarned: number;
    prestigeCount: number;
};

// v14: Legacy Dust upgrade shop — permanent per-level upgrades
export type SaveV14 = Omit<SaveV13, 'version'> & {
    version: 14;
    dustScoopBoost: number; // 0-3: +10% bucket fill speed per level
    dustPanYield: number;   // 0-3: +10% gold extraction per level
    dustGoldValue: number;  // 0-3: +10% sell price per level
    dustHeadStart: number;  // 0-3: begin each run with bonus money
};

// v15: Larger Bucket, Faster Panning, Larger Pan dust upgrades
export type SaveV15 = Omit<SaveV14, 'version'> & {
    version: 15;
    dustBucketSize: number;   // 0-3: +5 bucket capacity per level
    dustPanSpeed: number;     // 0-3: +20% pan processing rate per level
    dustPanCapacity: number;  // 0-3: +10 pan capacity per level
};

// v16: Travel mechanic — vehicles and driver
export type SaveV16 = Omit<SaveV15, 'version'> & {
    version: 16;
    vehicleTier: number;  // 0=on foot, 1=mule cart, 2=steam wagon, 3=motor truck
    hasDriver: boolean;   // hired a driver to auto-sell gold
};

// v17: Money-purchasable gear upgrades (bucket, pan cap, pan speed)
export type SaveV17 = Omit<SaveV16, 'version'> & {
    version: 17;
    bucketUpgrades: number;  // 0-3, money-purchasable, resets on prestige
    panCapUpgrades: number;
    panSpeedUpgrades: number;
};

// v18: Randomized gold market price
export type SaveV18 = Omit<SaveV17, 'version'> & {
    version: 18;
    goldPrice: number;           // current $/oz market rate
    lastGoldPriceUpdate: number; // tickCount at last price update
};

// v19: Auto-empty bucket upgrade + What's New tracking
export type SaveV19 = Omit<SaveV18, 'version'> & {
    version: 19;
    hasAutoEmpty: boolean;              // purchased auto-empty bucket upgrade
    lastSeenChangelogVersion: string;   // last changelog version player acknowledged
};

export type SaveV20 = Omit<SaveV19, 'version'> & {
    version: 20;
    totalGoldExtracted: number;  // cumulative gold panned across all runs
    totalMoneyEarned: number;    // cumulative money received from all sales
    peakRunMoney: number;        // highest runMoneyEarned in a single run
};

export type SaveV21 = Omit<SaveV20, 'version'> & {
    version: 21;
    sluiceBoxFilled: number;   // dirt currently in the sluice box
    minersMossFilled: number;  // concentrated paydirt caught by the miner's moss
};

export type SaveV22 = Omit<SaveV21, 'version' | 'separatorWorkers' | 'hasMagneticSeparator' | 'separatorGear'> & { version: 22; };

export type SaveV23 = Omit<SaveV22, 'version'> & {
    version: 23;
    highYieldSpots: number;
    richDirtInBucket: number;
    richDirtInSluice: number;
    hasMetalDetector: boolean;
    detectorWorkers: number;
    hasMotherlode: boolean;
    dustDetectRate: number;
    dustSpotCap: number;
};

// v24: replaced highYieldSpots with progress-bar detection model (detectProgress/Target, patchActive/Remaining/Capacity)
export type SaveV24 = Omit<SaveV23, 'version' | 'highYieldSpots'> & {
    version: 24;
    detectProgress: number;   // current click progress toward finding a patch
    detectTarget: number;     // randomized target (0 = no search started yet)
    patchActive: boolean;     // true when a patch has been discovered and is ready to scoop
    patchRemaining: number;   // rich dirt units left in the active patch
    patchCapacity: number;    // total capacity when patch was discovered (for display)
};

// v25: furnace becomes active smelting stage — gold flakes → furnace → gold bars
export type SaveV25 = Omit<SaveV24, 'version'> & {
    version: 25;
    furnaceFilled: number;    // oz of gold flakes currently loaded in furnace
    furnaceRunning: boolean;  // switch state — smelting is active
    furnaceBars: number;      // bars produced inside furnace, not yet collected
    goldBars: number;         // bars in player's possession (sellable)
};

// v26: oven removed — hasOven, ovenWorkers, ovenGear stripped
export type SaveV26 = Omit<SaveV25, 'version' | 'hasOven' | 'ovenWorkers' | 'ovenGear'> & { version: 26; };

// v27: hasAutoEmpty replaced by haulers worker count
export type SaveV27 = Omit<SaveV26, 'version' | 'hasAutoEmpty'> & { version: 27; haulers: number; };

export type SaveV28 = Omit<SaveV27, 'version'> & {
    version: 28;
    driverCarryingFlakes: number;
    driverCarryingBars: number;
    driverCapUpgrades: number;
    vaultFlakes: number;
    vaultBars: number;
};

// v29: Employee-based workforce — replaces raw worker counts with Employee objects
export type SaveV29 = Omit<SaveV28, 'version' | 'shovels' | 'pans' | 'haulers' | 'sluiceWorkers' | 'furnaceWorkers' | 'bankerWorkers' | 'detectorWorkers'> & {
    version: 29;
    employees: Employee[];
    roleSlots: RoleSlots;
    storyNPCs: StoryNPCState;
    seasonNumber: number;
    npcsRetained: number;
    draftPool: Employee[];
    draftPoolRefreshCost: number;
};

// v30: Assayer certification — adds goldBarsCertified
export type SaveV30 = Omit<SaveV29, 'version'> & {
    version: 30;
    goldBarsCertified: number;
};

// v31: Removed banking system (Banker NPC, investments, unlockedBanking, banker role)
export type SaveV31 = Omit<SaveV30,
    'version' | 'investmentSafeBonds' | 'investmentStocks' | 'investmentHighRisk' | 'lastRiskCheck' | 'unlockedBanking'
> & { version: 31 };

// v32: Commission system replaces Legacy Dust / prestige system
export type SaveV32 = Omit<SaveV31,
    'version' | 'legacyDust' | 'prestigeCount' | 'dustScoopBoost' | 'dustPanYield' | 'dustGoldValue' |
    'dustHeadStart' | 'dustBucketSize' | 'dustPanSpeed' | 'dustPanCapacity' | 'dustDetectRate' | 'dustSpotCap'
> & {
    version: 32;
    npcLevels: Record<NPCId, number>;
    pendingCommission: NPCId | null;
};

// v33: certifier role added to RoleSlots
export type SaveV33 = Omit<SaveV32, 'version'> & { version: 33 };

// v34: gold is the currency — remove money, market price, vault; rename runMoneyEarned→runGoldMined
export type SaveV34 = Omit<SaveV33,
    'version' | 'money' | 'goldPrice' | 'lastGoldPriceUpdate' |
    'totalMoneyEarned' | 'peakRunMoney' | 'runMoneyEarned' |
    'vaultFlakes' | 'vaultBars'
> & {
    version: 34;
    runGoldMined: number;  // gold extracted this season (replaces runMoneyEarned)
};

export type SaveV35 = Omit<SaveV34, 'version'> & {
    version: 35;
    postedJobs: Partial<Record<Role, boolean>>;
};

// v36: stats removed from Employee — now computed from xpByRole + rarity at runtime
export type SaveV36 = Omit<SaveV35, 'version'> & { version: 36; };

// v37: Mechanic NPC + Oil Field + fuel-powered machinery
export type SaveV37 = Omit<SaveV36, 'version' | 'location'> & {
    version: 37;
    location: 'mine' | 'town' | 'oilField';
    hasOilDerrick: boolean;
    hasExcavator: boolean;
    hasWashplant: boolean;
    crudeTank: number;
    fuelTank: number;
};

export type LatestSave = SaveV37;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function migrateToLatest(raw: unknown, fromVersion: number | undefined): LatestSave {
    // No data? return to clean by default
    if (!raw || typeof raw != "object") {
        return defaultSaveV37();
    }

    // v1 -> v6: dirtyGold -> paydirt, add new fields
    if (!fromVersion || fromVersion < 2) {
        const s = raw as Partial<SaveV1>;
        return migrateToLatest({
            version: 6,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: 'mine',
            dirt: 0,
            paydirt: s.dirtyGold ?? 0,
            gold: s.pannedGold ?? 0,
            money: 0,
            shovels: 0,
            pans: 0,
            carts: 0,
            sluiceWorkers: 0,
            separatorWorkers: 0,
            ovenWorkers: 0,
            furnaceWorkers: 0,
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
            unlockedPanning: true,
            unlockedTown: false,
            unlockedShop: false,
        }, 6);
    }

    // v2 -> v6: add new game fields
    if (fromVersion < 3) {
        const s = raw as Partial<SaveV2>;
        return migrateToLatest({
            version: 6,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: 'mine',
            dirt: 0,
            paydirt: s.paydirt ?? 0,
            gold: s.pannedGold ?? 0,
            money: 0,
            shovels: 0,
            pans: 0,
            carts: 0,
            sluiceWorkers: 0,
            separatorWorkers: 0,
            ovenWorkers: 0,
            furnaceWorkers: 0,
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
            unlockedPanning: true,
            unlockedTown: false,
            unlockedShop: false,
        }, 6);
    }

    // v3 -> v6: add equipment and workers and gear
    if (fromVersion < 4) {
        const s = raw as Partial<SaveV3>;
        return migrateToLatest({
            version: 6,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: 0,
            separatorWorkers: 0,
            ovenWorkers: 0,
            furnaceWorkers: 0,
            hasSluiceBox: false,
            hasMagneticSeparator: false,
            hasOven: false,
            hasFurnace: false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: 1,
            panPower: s.panPower ?? 1,
            sluiceGear: 1,
            separatorGear: 1,
            ovenGear: 1,
            furnaceGear: 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedShop: s.unlockedShop ?? false,
        }, 6);
    }

    // v4 -> v6: add workers and gear
    if (fromVersion < 5) {
        const s = raw as Partial<SaveV4>;
        return migrateToLatest({
            version: 6,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: 0,
            separatorWorkers: 0,
            ovenWorkers: 0,
            furnaceWorkers: 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: 1,
            panPower: s.panPower ?? 1,
            sluiceGear: 1,
            separatorGear: 1,
            ovenGear: 1,
            furnaceGear: 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedShop: s.unlockedShop ?? false,
        }, 6);
    }

    // v5 -> v8: add gear levels, banker workers, and bucket
    if (fromVersion < 6) {
        const s = raw as Partial<SaveV5>;
        return migrateToLatest({
            version: 8,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            hasBankCounter: false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: 1,
            panPower: s.panPower ?? 1,
            sluiceGear: 1,
            separatorGear: 1,
            ovenGear: 1,
            furnaceGear: 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedShop: s.unlockedShop ?? false,
        }, 8);
    }

    // v6 -> v8: add banker workers, bank counter, and bucket
    if (fromVersion < 7) {
        const s = raw as Partial<SaveV6>;
        return migrateToLatest({
            version: 8,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            hasBankCounter: false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedShop: s.unlockedShop ?? false,
        }, 8);
    }

    // v7 -> v8: add bucket mechanic
    if (fromVersion < 8) {
        const s = raw as Partial<SaveV7>;
        return migrateToLatest({
            version: 8,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            hasBankCounter: s.hasBankCounter ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedShop: s.unlockedShop ?? false,
        }, 8);
    }

    // v8 -> v9: add pan/sluice progress bar mechanic
    if (fromVersion < 9) {
        const s = raw as Partial<SaveV8>;
        return migrateToLatest({
            version: 10,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: 0,
            investmentStocks: 0,
            investmentHighRisk: 0,
            lastRiskCheck: 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            hasBankCounter: s.hasBankCounter ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedShop: s.unlockedShop ?? false,
        }, 10);
    }

    // v9 -> v10: add investment system
    if (fromVersion < 10) {
        const s = raw as Partial<SaveV9>;
        return migrateToLatest({
            version: 10,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: s.panFilled ?? 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: 0,
            investmentStocks: 0,
            investmentHighRisk: 0,
            lastRiskCheck: 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            hasBankCounter: s.hasBankCounter ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedShop: s.unlockedShop ?? false,
        }, 10);
    }

    // v10 -> v11: add timePlayed and darkMode
    if (fromVersion < 11) {
        const s = raw as Partial<SaveV10>;
        return migrateToLatest({
            version: 11,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: s.panFilled ?? 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: s.investmentSafeBonds ?? 0,
            investmentStocks: s.investmentStocks ?? 0,
            investmentHighRisk: s.investmentHighRisk ?? 0,
            lastRiskCheck: s.lastRiskCheck ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            hasBankCounter: s.hasBankCounter ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedShop: s.unlockedShop ?? false,
            timePlayed: 0,
            darkMode: false,
        }, 11);
    }

    if (fromVersion < 12) {
        // v11 → v12: drop hasBankCounter + unlockedShop, add unlockedBanking
        const s = raw as Partial<SaveV11>;
        return migrateToLatest({
            version: 12,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: s.panFilled ?? 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: s.investmentSafeBonds ?? 0,
            investmentStocks: s.investmentStocks ?? 0,
            investmentHighRisk: s.investmentHighRisk ?? 0,
            lastRiskCheck: s.lastRiskCheck ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedBanking: false,
            timePlayed: s.timePlayed ?? 0,
            darkMode: s.darkMode ?? false,
        }, 12);
    }

    if (fromVersion < 13) {
        // v12 → v13: add prestige fields
        const s = raw as Partial<SaveV12>;
        return migrateToLatest({
            version: 13,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: s.panFilled ?? 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: s.investmentSafeBonds ?? 0,
            investmentStocks: s.investmentStocks ?? 0,
            investmentHighRisk: s.investmentHighRisk ?? 0,
            lastRiskCheck: s.lastRiskCheck ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedBanking: s.unlockedBanking ?? false,
            timePlayed: s.timePlayed ?? 0,
            darkMode: s.darkMode ?? false,
            legacyDust: 0,
            runMoneyEarned: 0,
            prestigeCount: 0,
        }, 13);
    }

    if (fromVersion < 14) {
        // v13 → v14: add Legacy Dust upgrade shop fields
        const s = raw as Partial<SaveV13>;
        return migrateToLatest({
            version: 14,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: s.panFilled ?? 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: s.investmentSafeBonds ?? 0,
            investmentStocks: s.investmentStocks ?? 0,
            investmentHighRisk: s.investmentHighRisk ?? 0,
            lastRiskCheck: s.lastRiskCheck ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedBanking: s.unlockedBanking ?? false,
            timePlayed: s.timePlayed ?? 0,
            darkMode: s.darkMode ?? false,
            legacyDust: s.legacyDust ?? 0,
            runMoneyEarned: s.runMoneyEarned ?? 0,
            prestigeCount: s.prestigeCount ?? 0,
            dustScoopBoost: 0,
            dustPanYield: 0,
            dustGoldValue: 0,
            dustHeadStart: 0,
        }, 14);
    }

    if (fromVersion < 15) {
        // v14 → v15: add Larger Bucket, Faster Panning, Larger Pan dust upgrades
        const s = raw as Partial<SaveV14>;
        return migrateToLatest({
            version: 15,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: s.panFilled ?? 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: s.investmentSafeBonds ?? 0,
            investmentStocks: s.investmentStocks ?? 0,
            investmentHighRisk: s.investmentHighRisk ?? 0,
            lastRiskCheck: s.lastRiskCheck ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedBanking: s.unlockedBanking ?? false,
            timePlayed: s.timePlayed ?? 0,
            darkMode: s.darkMode ?? false,
            legacyDust: s.legacyDust ?? 0,
            runMoneyEarned: s.runMoneyEarned ?? 0,
            prestigeCount: s.prestigeCount ?? 0,
            dustScoopBoost: s.dustScoopBoost ?? 0,
            dustPanYield: s.dustPanYield ?? 0,
            dustGoldValue: s.dustGoldValue ?? 0,
            dustHeadStart: s.dustHeadStart ?? 0,
            dustBucketSize: 0,
            dustPanSpeed: 0,
            dustPanCapacity: 0,
        }, 15);
    }

    if (fromVersion < 16) {
        // v15 → v16: add travel mechanic fields
        const s = raw as Partial<SaveV15>;
        return migrateToLatest({
            version: 16,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: s.panFilled ?? 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: s.investmentSafeBonds ?? 0,
            investmentStocks: s.investmentStocks ?? 0,
            investmentHighRisk: s.investmentHighRisk ?? 0,
            lastRiskCheck: s.lastRiskCheck ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedBanking: s.unlockedBanking ?? false,
            timePlayed: s.timePlayed ?? 0,
            darkMode: s.darkMode ?? false,
            legacyDust: s.legacyDust ?? 0,
            runMoneyEarned: s.runMoneyEarned ?? 0,
            prestigeCount: s.prestigeCount ?? 0,
            dustScoopBoost: s.dustScoopBoost ?? 0,
            dustPanYield: s.dustPanYield ?? 0,
            dustGoldValue: s.dustGoldValue ?? 0,
            dustHeadStart: s.dustHeadStart ?? 0,
            dustBucketSize: s.dustBucketSize ?? 0,
            dustPanSpeed: s.dustPanSpeed ?? 0,
            dustPanCapacity: s.dustPanCapacity ?? 0,
            vehicleTier: 0,
            hasDriver: false,
        }, 16);
    }

    if (fromVersion < 17) {
        // v16 → v17: add money-purchasable gear upgrade fields
        const s = raw as Partial<SaveV16>;
        return migrateToLatest({
            version: 17,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            location: s.location ?? 'mine',
            bucketFilled: s.bucketFilled ?? 0,
            panFilled: s.panFilled ?? 0,
            dirt: s.dirt ?? 0,
            paydirt: s.paydirt ?? 0,
            gold: s.gold ?? 0,
            money: s.money ?? 0,
            investmentSafeBonds: s.investmentSafeBonds ?? 0,
            investmentStocks: s.investmentStocks ?? 0,
            investmentHighRisk: s.investmentHighRisk ?? 0,
            lastRiskCheck: s.lastRiskCheck ?? 0,
            shovels: s.shovels ?? 0,
            pans: s.pans ?? 0,
            carts: s.carts ?? 0,
            sluiceWorkers: s.sluiceWorkers ?? 0,
            separatorWorkers: s.separatorWorkers ?? 0,
            ovenWorkers: s.ovenWorkers ?? 0,
            furnaceWorkers: s.furnaceWorkers ?? 0,
            bankerWorkers: s.bankerWorkers ?? 0,
            hasSluiceBox: s.hasSluiceBox ?? false,
            hasMagneticSeparator: s.hasMagneticSeparator ?? false,
            hasOven: s.hasOven ?? false,
            hasFurnace: s.hasFurnace ?? false,
            scoopPower: s.scoopPower ?? 1,
            sluicePower: s.sluicePower ?? 1,
            panPower: s.panPower ?? 1,
            sluiceGear: s.sluiceGear ?? 1,
            separatorGear: s.separatorGear ?? 1,
            ovenGear: s.ovenGear ?? 1,
            furnaceGear: s.furnaceGear ?? 1,
            unlockedPanning: s.unlockedPanning ?? false,
            unlockedTown: s.unlockedTown ?? false,
            unlockedBanking: s.unlockedBanking ?? false,
            timePlayed: s.timePlayed ?? 0,
            darkMode: s.darkMode ?? false,
            legacyDust: s.legacyDust ?? 0,
            runMoneyEarned: s.runMoneyEarned ?? 0,
            prestigeCount: s.prestigeCount ?? 0,
            dustScoopBoost: s.dustScoopBoost ?? 0,
            dustPanYield: s.dustPanYield ?? 0,
            dustGoldValue: s.dustGoldValue ?? 0,
            dustHeadStart: s.dustHeadStart ?? 0,
            dustBucketSize: s.dustBucketSize ?? 0,
            dustPanSpeed: s.dustPanSpeed ?? 0,
            dustPanCapacity: s.dustPanCapacity ?? 0,
            vehicleTier: s.vehicleTier ?? 0,
            hasDriver: s.hasDriver ?? false,
            bucketUpgrades: 0,
            panCapUpgrades: 0,
            panSpeedUpgrades: 0,
        }, 17);
    }

    if (fromVersion < 18) {
        // v17 → v18: add gold market price fields
        const s = raw as Partial<SaveV17>;
        return migrateToLatest({
            ...s,
            version: 18,
            goldPrice: 1.0,
            lastGoldPriceUpdate: 0,
        }, 18);
    }

    if (fromVersion < 19) {
        // v18 → v19: add auto-empty upgrade + changelog version tracking
        const s = raw as SaveV18;
        return migrateToLatest({
            ...s,
            version: 19,
            hasAutoEmpty: false,
            lastSeenChangelogVersion: 'v0.18',
        }, 19);
    }

    if (fromVersion < 20) {
        // v19 → v20: add lifetime stats counters
        const s = raw as SaveV19;
        return migrateToLatest({
            ...s,
            version: 20,
            totalGoldExtracted: 0,
            totalMoneyEarned: 0,
            peakRunMoney: s.runMoneyEarned ?? 0,
        }, 20);
    }

    if (fromVersion < 21) {
        // v20 → v21: add sluice box drain state + miner's moss
        const s = raw as SaveV20;
        return migrateToLatest({
            ...s,
            version: 21,
            sluiceBoxFilled: 0,
            minersMossFilled: 0,
        }, 21);
    }

    if (fromVersion < 22) {
        const s = raw as SaveV21;
        const { separatorWorkers: _sw, hasMagneticSeparator: _hms, separatorGear: _sg, ...rest } = s;
        return migrateToLatest({ ...rest, version: 22 }, 22);
    }

    if (fromVersion < 23) {
        const s = raw as SaveV22;
        return migrateToLatest({ ...s, version: 23, highYieldSpots: 0, richDirtInBucket: 0, richDirtInSluice: 0, hasMetalDetector: false, detectorWorkers: 0, hasMotherlode: false, dustDetectRate: 0, dustSpotCap: 0 }, 23);
    }

    if (fromVersion < 24) {
        const s = raw as SaveV23;
        const { highYieldSpots: _hy, ...rest } = s;
        return migrateToLatest({ ...rest, version: 24, detectProgress: 0, detectTarget: 0, patchActive: false, patchRemaining: 0, patchCapacity: 0 }, 24);
    }

    if (fromVersion < 25) {
        const s = raw as SaveV24;
        return migrateToLatest({ ...s, version: 25, furnaceFilled: 0, furnaceRunning: false, furnaceBars: 0, goldBars: 0 }, 25);
    }

    if (fromVersion < 26) {
        const s = raw as SaveV25;
        const { hasOven: _ho, ovenWorkers: _ow, ovenGear: _og, ...rest } = s;
        return migrateToLatest({ ...rest, version: 26 }, 26);
    }

    if (fromVersion < 27) {
        const s = raw as SaveV26;
        const { hasAutoEmpty: _ha, ...rest } = s;
        // Preserve: if they had auto-empty purchased, give them 1 hauler
        const haulers = (_ha ?? false) ? 1 : 0;
        return migrateToLatest({ ...rest, version: 27, haulers }, 27);
    }

    if (fromVersion < 28) {
        const s = raw as SaveV27;
        return migrateToLatest({
            ...s,
            version: 28,
            driverCarryingFlakes: 0,
            driverCarryingBars: 0,
            driverCapUpgrades: 0,
            vaultFlakes: 0,
            vaultBars: 0,
        }, 28);
    }

    if (fromVersion < 29) {
        const s = raw as SaveV28;
        _empIdCounter = 0; // reset counter for deterministic migration
        const MIGRATED_NAMES: Partial<Record<string, string[]>> = {
            miner: ['Zeb','Clem','Huck','Walt','Roy','Ned','Ike','Cal','Otis','Silas'],
            prospector: ['Mae','Fern','Ora','Nell','Ida','Ada','Bea','Cora','Flo','Hattie'],
            hauler: ['Buck','Gus','Abe','Dan','Eli','Finn','Hans','Jed','Kurt','Lars'],
            sluiceOperator: ['Tom','Jim','Sam','Bob','Pat','Al','Fred','Vern','Wes','Yul'],
            furnaceOperator: ['Bruno','Felix','Otto','Hugo','Arno','Ernst','Fritz','Hans2','Klaus','Lutz'],
            detectorOperator: ['Arlo','Boyd','Clyde','Dewey','Ezra','Grant','Heath','Ivan','Jesse','Knox'],
        };
        const getNames = (role: Role) => MIGRATED_NAMES[role] ?? [];

        const makeEmployees = (role: Role, count: number): Employee[] =>
            Array.from({ length: count }, (_, i) => makeCommonEmployee(role, getNames(role)[i] ?? `Worker ${i + 1}`));

        const employees: Employee[] = [
            ...makeEmployees('miner', s.shovels ?? 0),
            ...makeEmployees('prospector', s.pans ?? 0),
            ...makeEmployees('hauler', s.haulers ?? 0),
            ...makeEmployees('sluiceOperator', s.sluiceWorkers ?? 0),
            ...makeEmployees('furnaceOperator', s.furnaceWorkers ?? 0),
            ...makeEmployees('detectorOperator', s.detectorWorkers ?? 0),
        ];

        const totalWorkers = (s.shovels ?? 0) + (s.pans ?? 0) + (s.haulers ?? 0) +
            (s.sluiceWorkers ?? 0) + (s.furnaceWorkers ?? 0) + (s.detectorWorkers ?? 0);

        const { shovels: _sh, pans: _pa, haulers: _ha, sluiceWorkers: _sw,
                furnaceWorkers: _fw, bankerWorkers: _bw, detectorWorkers: _dw, ...rest } = s;

        return migrateToLatest({
            ...rest,
            version: 29,
            employees,
            roleSlots: {
                miner: Math.max(5, s.shovels ?? 0),
                hauler: Math.max(3, s.haulers ?? 0),
                prospector: Math.max(5, s.pans ?? 0),
                sluiceOperator: Math.max(3, s.sluiceWorkers ?? 0),
                furnaceOperator: Math.max(2, s.furnaceWorkers ?? 0),
                detectorOperator: Math.max(2, s.detectorWorkers ?? 0),
                certifier: 1,
            },
            storyNPCs: totalWorkers > 0
                ? { traderArrived: true, tavernBuilt: true, assayerArrived: true, blacksmithArrived: true }
                : { traderArrived: false, tavernBuilt: false, assayerArrived: false, blacksmithArrived: false },
            seasonNumber: (s as { prestigeCount?: number }).prestigeCount ?? 1,
            npcsRetained: 0,
            draftPool: [],
            draftPoolRefreshCost: 10,
        }, 29);
    }

    if (fromVersion < 30) {
        const s = raw as SaveV29;
        // Backfill assayer/blacksmith for saves predating the NPC trigger fixes:
        // assayer unlocks when you have a furnace; blacksmith when trader has arrived.
        const { bankerArrived: _ba, ...npcsWithoutBanker } = s.storyNPCs as typeof s.storyNPCs & { bankerArrived?: boolean };
        const fixedNPCs = {
            ...npcsWithoutBanker,
            assayerArrived: (s.storyNPCs as any).assayerArrived || s.hasFurnace,
            blacksmithArrived: (s.storyNPCs as any).blacksmithArrived || (s.storyNPCs as any).traderArrived,
        };
        return migrateToLatest({ ...s, version: 30, goldBarsCertified: 0, storyNPCs: fixedNPCs }, 30);
    }

    if (fromVersion < 31) {
        const s = raw as SaveV30;
        const { bankerArrived: _ba, ...npcsWithoutBanker } = (s.storyNPCs as any);
        const { banker: _br, ...roleSlots } = (s.roleSlots as any);
        // Strip investment fields
        const { investmentSafeBonds: _isb, investmentStocks: _is, investmentHighRisk: _ihr, lastRiskCheck: _lrc,
                unlockedBanking: _ub, ...rest } = s as any;
        // Strip banker employees
        const employees = ((s as any).employees ?? []).filter((e: any) => e.assignedRole !== 'banker').map((e: any) => {
            if (e.xpByRole && 'banker' in e.xpByRole) {
                const { banker: _bxp, ...xpByRole } = e.xpByRole;
                return { ...e, xpByRole };
            }
            return e;
        });
        return migrateToLatest({
            ...rest,
            version: 31,
            storyNPCs: npcsWithoutBanker,
            roleSlots,
            employees,
        }, 31);
    }

    if (fromVersion < 32) {
        // v31 → v32: replace Legacy Dust / prestige system with NPC commission system
        const s = raw as Partial<SaveV31>;
        const {
            legacyDust: _ld, prestigeCount: _pc, dustScoopBoost: _dsb, dustPanYield: _dpy,
            dustGoldValue: _dgv, dustHeadStart: _dhs, dustBucketSize: _dbs, dustPanSpeed: _dps,
            dustPanCapacity: _dpc, dustDetectRate: _ddr, dustSpotCap: _dsc,
            ...rest
        } = s as any;
        const npcs = s.storyNPCs ?? { traderArrived: false, tavernBuilt: false, assayerArrived: false, blacksmithArrived: false };
        const npcLevels: Record<NPCId, number> = {
            trader: npcs.traderArrived ? 1 : 0,
            tavernKeeper: npcs.tavernBuilt ? 1 : 0,
            assayer: npcs.assayerArrived ? 1 : 0,
            blacksmith: npcs.blacksmithArrived ? 1 : 0,
            mechanic: 0,
        };
        return migrateToLatest({
            ...rest,
            version: 32,
            npcLevels,
            pendingCommission: null,
        }, 32);
    }

    if (fromVersion < 33) {
        // v32 → v33: certifier role added to roleSlots
        const s = raw as Partial<SaveV32>;
        const existingSlots = s.roleSlots ?? {};
        return migrateToLatest({
            ...s,
            version: 33,
            roleSlots: { ...existingSlots, certifier: (existingSlots as any).certifier ?? 1 },
        }, 33);
    }

    if (fromVersion < 34) {
        // v33 → v34: gold is the currency — strip money/market/vault; rename runMoneyEarned→runGoldMined
        const s = raw as Partial<SaveV33>;
        const { money: _m, goldPrice: _gp, lastGoldPriceUpdate: _lgpu,
                totalMoneyEarned: _tme, peakRunMoney: _prm,
                vaultFlakes: _vf, vaultBars: _vb, runMoneyEarned: _rme, ...rest } = s as any;
        return migrateToLatest({ ...rest, version: 34, runGoldMined: 0 }, 34);
    }

    if (fromVersion === 34) {
        // v34 → v35: add postedJobs; auto-post for equipment already owned
        const s = raw as Partial<SaveV34>;
        return migrateToLatest({
            ...s,
            version: 35,
            postedJobs: {
                sluiceOperator:   s.hasSluiceBox      ?? false,
                furnaceOperator:  s.hasFurnace         ?? false,
                detectorOperator: s.hasMetalDetector   ?? false,
            },
        }, 35);
    }

    if (fromVersion === 35) {
        // v35 → v36: stats removed from Employee — strip from all employee objects
        const s = raw as Partial<SaveV35>;
        const stripStats = (e: any) => { const { stats: _s, ...rest } = e; return rest; };
        return migrateToLatest({
            ...s,
            version: 36,
            employees: (s.employees ?? []).map(stripStats),
            draftPool: (s.draftPool ?? []).map(stripStats),
        }, 36);
    }

    if (fromVersion === 36) {
        // v36 → v37: Mechanic NPC + Oil Field + fuel-powered machinery
        const s = raw as Partial<SaveV36>;
        return migrateToLatest({
            ...s,
            version: 37,
            hasOilDerrick: false,
            hasExcavator: false,
            hasWashplant: false,
            crudeTank: 0,
            fuelTank: 0,
        }, 37);
    }

    // Already v37, ensure fields exist
    const s = raw as Partial<SaveV37>;
    const storyNPCs = s.storyNPCs ?? { traderArrived: false, tavernBuilt: false, assayerArrived: false, blacksmithArrived: false };
    const defaultNpcLevels: Record<NPCId, number> = {
        trader: storyNPCs.traderArrived ? 1 : 0,
        tavernKeeper: storyNPCs.tavernBuilt ? 1 : 0,
        assayer: storyNPCs.assayerArrived ? 1 : 0,
        blacksmith: storyNPCs.blacksmithArrived ? 1 : 0,
        mechanic: storyNPCs.mechanicArrived ? 1 : 0,
    };
    return {
        version: 37,
        tickCount: s.tickCount ?? 0,
        timeScale: s.timeScale ?? 1,
        location: s.location ?? 'mine',
        bucketFilled: s.bucketFilled ?? 0,
        panFilled: s.panFilled ?? 0,
        dirt: s.dirt ?? 0,
        paydirt: s.paydirt ?? 0,
        gold: s.gold ?? 0,
        carts: s.carts ?? 0,
        hasSluiceBox: s.hasSluiceBox ?? false,
        hasFurnace: s.hasFurnace ?? false,
        scoopPower: s.scoopPower ?? 1,
        sluicePower: s.sluicePower ?? 1,
        panPower: s.panPower ?? 1,
        sluiceGear: s.sluiceGear ?? 1,
        furnaceGear: s.furnaceGear ?? 1,
        unlockedPanning: s.unlockedPanning ?? false,
        unlockedTown: s.unlockedTown ?? false,
        timePlayed: s.timePlayed ?? 0,
        darkMode: s.darkMode ?? false,
        runGoldMined: s.runGoldMined ?? 0,
        vehicleTier: s.vehicleTier ?? 0,
        hasDriver: s.hasDriver ?? false,
        bucketUpgrades: s.bucketUpgrades ?? 0,
        panCapUpgrades: s.panCapUpgrades ?? 0,
        panSpeedUpgrades: s.panSpeedUpgrades ?? 0,
        lastSeenChangelogVersion: s.lastSeenChangelogVersion ?? CHANGELOG[0].version,
        totalGoldExtracted: s.totalGoldExtracted ?? 0,
        sluiceBoxFilled: s.sluiceBoxFilled ?? 0,
        minersMossFilled: s.minersMossFilled ?? 0,
        richDirtInBucket: s.richDirtInBucket ?? 0,
        richDirtInSluice: s.richDirtInSluice ?? 0,
        hasMetalDetector: s.hasMetalDetector ?? false,
        hasMotherlode: s.hasMotherlode ?? false,
        detectProgress: s.detectProgress ?? 0,
        detectTarget: s.detectTarget ?? 0,
        patchActive: s.patchActive ?? false,
        patchRemaining: s.patchRemaining ?? 0,
        patchCapacity: s.patchCapacity ?? 0,
        furnaceFilled: s.furnaceFilled ?? 0,
        furnaceRunning: s.furnaceRunning ?? false,
        furnaceBars: s.furnaceBars ?? 0,
        goldBars: s.goldBars ?? 0,
        goldBarsCertified: s.goldBarsCertified ?? 0,
        driverCarryingFlakes: s.driverCarryingFlakes ?? 0,
        driverCarryingBars: s.driverCarryingBars ?? 0,
        driverCapUpgrades: s.driverCapUpgrades ?? 0,
        employees: s.employees ?? [],
        roleSlots: {
            miner: s.roleSlots?.miner ?? 1,
            hauler: s.roleSlots?.hauler ?? 1,
            prospector: s.roleSlots?.prospector ?? 1,
            sluiceOperator: s.roleSlots?.sluiceOperator ?? 1,
            furnaceOperator: s.roleSlots?.furnaceOperator ?? 1,
            detectorOperator: s.roleSlots?.detectorOperator ?? 1,
            certifier: s.roleSlots?.certifier ?? 1,
            driller: s.roleSlots?.driller ?? 1,
            refiner: s.roleSlots?.refiner ?? 1,
        },
        storyNPCs,
        seasonNumber: s.seasonNumber ?? 1,
        npcsRetained: s.npcsRetained ?? 0,
        draftPool: s.draftPool ?? [],
        draftPoolRefreshCost: s.draftPoolRefreshCost ?? 10,
        npcLevels: s.npcLevels ?? defaultNpcLevels,
        pendingCommission: s.pendingCommission ?? null,
        postedJobs: s.postedJobs ?? {},
        hasOilDerrick: s.hasOilDerrick ?? false,
        hasExcavator: s.hasExcavator ?? false,
        hasWashplant: s.hasWashplant ?? false,
        crudeTank: s.crudeTank ?? 0,
        fuelTank: s.fuelTank ?? 0,
    };
}

export function defaultSaveV31(): SaveV31 {
    return {
        version: 31,
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
        timePlayed: 0,
        darkMode: false,
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
        dustDetectRate: 0,
        dustSpotCap: 0,
        vehicleTier: 0,
        hasDriver: false,
        bucketUpgrades: 0,
        panCapUpgrades: 0,
        panSpeedUpgrades: 0,
        goldPrice: 1.0,
        lastGoldPriceUpdate: 0,
        lastSeenChangelogVersion: 'v1.16',
        totalGoldExtracted: 0,
        totalMoneyEarned: 0,
        peakRunMoney: 0,
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
        vaultFlakes: 0,
        vaultBars: 0,
        goldBarsCertified: 0,
        employees: [],
        roleSlots: { miner: 1, hauler: 1, prospector: 1, sluiceOperator: 1, furnaceOperator: 1, detectorOperator: 1, certifier: 1, driller: 1, refiner: 1 },
        storyNPCs: { traderArrived: false, tavernBuilt: false, assayerArrived: false, blacksmithArrived: false },
        seasonNumber: 1,
        npcsRetained: 0,
        draftPool: [],
        draftPoolRefreshCost: 10,
    };
}

export function defaultSaveV32(): SaveV32 {
    return {
        version: 32,
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
        timePlayed: 0,
        darkMode: false,
        runMoneyEarned: 0,
        vehicleTier: 0,
        hasDriver: false,
        bucketUpgrades: 0,
        panCapUpgrades: 0,
        panSpeedUpgrades: 0,
        goldPrice: 1.0,
        lastGoldPriceUpdate: 0,
        lastSeenChangelogVersion: 'v1.18',
        totalGoldExtracted: 0,
        totalMoneyEarned: 0,
        peakRunMoney: 0,
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
        vaultFlakes: 0,
        vaultBars: 0,
        goldBarsCertified: 0,
        employees: [],
        roleSlots: { miner: 5, hauler: 1, prospector: 5, sluiceOperator: 3, furnaceOperator: 2, detectorOperator: 2, certifier: 1, driller: 1, refiner: 1 },
        storyNPCs: { traderArrived: false, tavernBuilt: false, assayerArrived: false, blacksmithArrived: false },
        seasonNumber: 1,
        npcsRetained: 0,
        draftPool: [],
        draftPoolRefreshCost: 10,
        npcLevels: { trader: 0, tavernKeeper: 0, assayer: 0, blacksmith: 0, mechanic: 0 },
        pendingCommission: null,
    };
}

export function defaultSaveV33(): SaveV33 {
    return { ...defaultSaveV32(), version: 33 };
}

export function defaultSaveV34(): SaveV34 {
    const { money: _m, goldPrice: _gp, lastGoldPriceUpdate: _lgpu,
            totalMoneyEarned: _tme, peakRunMoney: _prm,
            vaultFlakes: _vf, vaultBars: _vb, runMoneyEarned: _rme, ...rest } = defaultSaveV33();
    return { ...rest, version: 34, runGoldMined: 0 };
}

export function defaultSaveV35(): SaveV35 {
    return { ...defaultSaveV34(), version: 35, postedJobs: {} };
}

export function defaultSaveV36(): SaveV36 {
    return { ...defaultSaveV35(), version: 36 };
}

export function defaultSaveV37(): SaveV37 {
    return {
        ...defaultSaveV36(),
        version: 37,
        hasOilDerrick: false,
        hasExcavator: false,
        hasWashplant: false,
        crudeTank: 0,
        fuelTank: 0,
    };
}

export function defaultSaveV2(): SaveV2 {
    return {
        version: 2,
        tickCount: 0,
        timeScale: 1,
        pannedGold: 0,
        paydirt: 0
    };
}

export function defaultSaveV3(): SaveV3 {
    return {
        version: 3,
        tickCount: 0,
        timeScale: 1,
        location: 'mine',
        dirt: 0,
        paydirt: 0,
        gold: 0,
        money: 0,
        shovels: 0,
        pans: 0,
        carts: 0,
        scoopPower: 1,
        panPower: 1,
        unlockedPanning: false,
        unlockedTown: false,
        unlockedShop: false,
    };
}

export function defaultSaveV4(): SaveV4 {
    return {
        version: 4,
        tickCount: 0,
        timeScale: 1,
        location: 'mine',
        dirt: 0,
        paydirt: 0,
        gold: 0,
        money: 0,
        shovels: 0,
        pans: 0,
        carts: 0,
        hasSluiceBox: false,
        hasMagneticSeparator: false,
        hasOven: false,
        hasFurnace: false,
        scoopPower: 1,
        panPower: 1,
        unlockedPanning: false,
        unlockedTown: false,
        unlockedShop: false,
    };
}

export function defaultSaveV5(): SaveV5 {
    return {
        version: 5,
        tickCount: 0,
        timeScale: 1,
        location: 'mine',
        dirt: 0,
        paydirt: 0,
        gold: 0,
        money: 0,
        shovels: 0,
        pans: 0,
        carts: 0,
        sluiceWorkers: 0,
        separatorWorkers: 0,
        ovenWorkers: 0,
        furnaceWorkers: 0,
        hasSluiceBox: false,
        hasMagneticSeparator: false,
        hasOven: false,
        hasFurnace: false,
        scoopPower: 1,
        panPower: 1,
        unlockedPanning: false,
        unlockedTown: false,
        unlockedShop: false,
    };
}

export function defaultSaveV6(): SaveV6 {
    return {
        version: 6,
        tickCount: 0,
        timeScale: 1,
        location: 'mine',
        dirt: 0,
        paydirt: 0,
        gold: 0,
        money: 0,
        shovels: 0,
        pans: 0,
        carts: 0,
        sluiceWorkers: 0,
        separatorWorkers: 0,
        ovenWorkers: 0,
        furnaceWorkers: 0,
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
        unlockedShop: false,
    };
}

export function defaultSaveV7(): SaveV7 {
    return {
        version: 7,
        tickCount: 0,
        timeScale: 1,
        location: 'mine',
        dirt: 0,
        paydirt: 0,
        gold: 0,
        money: 0,
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
    };
}

export function defaultSaveV8(): SaveV8 {
    return {
        version: 8,
        tickCount: 0,
        timeScale: 1,
        location: 'mine',
        bucketFilled: 0,
        dirt: 0,
        paydirt: 0,
        gold: 0,
        money: 0,
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
    };
}

export function defaultSaveV9(): SaveV9 {
    return {
        version: 9,
        tickCount: 0,
        timeScale: 1,
        location: 'mine',
        bucketFilled: 0,
        panFilled: 0,
        dirt: 0,
        paydirt: 0,
        gold: 0,
        money: 0,
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
    };
}

export function defaultSaveV10(): SaveV10 {
    return {
        version: 10,
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
    };
}

export function defaultSaveV11(): SaveV11 {
    return {
        ...defaultSaveV10(),
        version: 11,
        timePlayed: 0,
        darkMode: false,
    };
}

export function defaultSaveV12(): SaveV12 {
    const { hasBankCounter: _hbc, unlockedShop: _us, version: _v, ...rest } = defaultSaveV11();
    return {
        ...rest,
        version: 12,
        unlockedBanking: false,
    };
}

export function defaultSaveV13(): SaveV13 {
    const { version: _v, ...rest } = defaultSaveV12();
    return {
        ...rest,
        version: 13,
        legacyDust: 0,
        runMoneyEarned: 0,
        prestigeCount: 0,
    };
}

export function defaultSaveV14(): SaveV14 {
    const { version: _v, ...rest } = defaultSaveV13();
    return {
        ...rest,
        version: 14,
        dustScoopBoost: 0,
        dustPanYield: 0,
        dustGoldValue: 0,
        dustHeadStart: 0,
    };
}

export function defaultSaveV15(): SaveV15 {
    const { version: _v, ...rest } = defaultSaveV14();
    return {
        ...rest,
        version: 15,
        dustBucketSize: 0,
        dustPanSpeed: 0,
        dustPanCapacity: 0,
    };
}

export function defaultSaveV16(): SaveV16 {
    const { version: _v, ...rest } = defaultSaveV15();
    return {
        ...rest,
        version: 16,
        vehicleTier: 0,
        hasDriver: false,
    };
}

export function defaultSaveV17(): SaveV17 {
    const { version: _v, ...rest } = defaultSaveV16();
    return {
        ...rest,
        version: 17,
        bucketUpgrades: 0,
        panCapUpgrades: 0,
        panSpeedUpgrades: 0,
    };
}

export function defaultSaveV18(): SaveV18 {
    const { version: _v, ...rest } = defaultSaveV17();
    return {
        ...rest,
        version: 18,
        goldPrice: 1.0,
        lastGoldPriceUpdate: 0,
    };
}

export function defaultSaveV19(): SaveV19 {
    const { version: _v, ...rest } = defaultSaveV18();
    return {
        ...rest,
        version: 19,
        hasAutoEmpty: false,
        lastSeenChangelogVersion: CHANGELOG[0].version,
    };
}

export function defaultSaveV20(): SaveV20 {
    const { version: _v, ...rest } = defaultSaveV19();
    return {
        ...rest,
        version: 20,
        totalGoldExtracted: 0,
        totalMoneyEarned: 0,
        peakRunMoney: 0,
    };
}

export function defaultSaveV21(): SaveV21 {
    const { version: _v, ...rest } = defaultSaveV20();
    return {
        ...rest,
        version: 21,
        sluiceBoxFilled: 0,
        minersMossFilled: 0,
    };
}

export function defaultSaveV22(): SaveV22 {
    const { version: _v, separatorWorkers: _sw, hasMagneticSeparator: _hms, separatorGear: _sg, ...rest } = defaultSaveV21();
    return { ...rest, version: 22 };
}

export function defaultSaveV23(): SaveV23 {
    return { ...defaultSaveV22(), version: 23, highYieldSpots: 0, richDirtInBucket: 0, richDirtInSluice: 0, hasMetalDetector: false, detectorWorkers: 0, hasMotherlode: false, dustDetectRate: 0, dustSpotCap: 0 };
}

export function defaultSaveV24(): SaveV24 {
    const { highYieldSpots: _hy, version: _v, ...rest } = defaultSaveV23();
    return { ...rest, version: 24, detectProgress: 0, detectTarget: 0, patchActive: false, patchRemaining: 0, patchCapacity: 0 };
}

export function defaultSaveV25(): SaveV25 {
    const { version: _v, ...rest } = defaultSaveV24();
    return { ...rest, version: 25, furnaceFilled: 0, furnaceRunning: false, furnaceBars: 0, goldBars: 0 };
}

export function defaultSaveV26(): SaveV26 {
    const { version: _v, hasOven: _ho, ovenWorkers: _ow, ovenGear: _og, ...rest } = defaultSaveV25();
    return { ...rest, version: 26 };
}

export function defaultSaveV27(): SaveV27 {
    const { version: _v, hasAutoEmpty: _ha, ...rest } = defaultSaveV26();
    return { ...rest, version: 27, haulers: 0 };
}

export function defaultSaveV28(): SaveV28 {
    const { version: _v, ...rest } = defaultSaveV27();
    return {
        ...rest,
        version: 28,
        driverCarryingFlakes: 0,
        driverCarryingBars: 0,
        driverCapUpgrades: 0,
        vaultFlakes: 0,
        vaultBars: 0,
    };
}

// ─── NPC Commission System ────────────────────────────────────────────────────

export const NPC_COMMISSION_BASE: Record<NPCId, number> = {
    trader: 500,
    tavernKeeper: 750,
    assayer: 1000,
    blacksmith: 600,
    mechanic: 800,
};

export function getCommissionCost(npcId: NPCId, currentLevel: number): number {
    return Math.floor(NPC_COMMISSION_BASE[npcId] * Math.pow(1.5, Math.max(0, currentLevel - 1)));
}

export function getCommissionOptions(storyNPCs: StoryNPCState, npcLevels: Record<NPCId, number>): NPCId[] {
    const arrived: NPCId[] = [];
    if (storyNPCs.traderArrived) arrived.push('trader');
    if (storyNPCs.tavernBuilt) arrived.push('tavernKeeper');
    if (storyNPCs.assayerArrived) arrived.push('assayer');
    if (storyNPCs.blacksmithArrived) arrived.push('blacksmith');
    if (storyNPCs.mechanicArrived) arrived.push('mechanic');
    // Sort by current level ascending, take up to 3
    return arrived
        .sort((a, b) => (npcLevels[a] ?? 0) - (npcLevels[b] ?? 0))
        .slice(0, 3);
}

