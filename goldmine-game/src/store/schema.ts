// Central place to define what we persist and how to migrate between versions.

export const STORAGE_KEY = "goldmine:save";
export const SCHEMA_VERSION = 15 as const; // bump when persist shape changes

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

// Adding latest type alias
export type LatestSave = SaveV15;

export function migrateToLatest(raw: unknown, fromVersion: number | undefined): LatestSave {
    // No data? return to clean by default
    if (!raw || typeof raw != "object") {
        return defaultSaveV15();
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

    // Already v15, ensure fields exist
    const s = raw as Partial<SaveV15>;
    return {
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
        dustBucketSize: s.dustBucketSize ?? 0,
        dustPanSpeed: s.dustPanSpeed ?? 0,
        dustPanCapacity: s.dustPanCapacity ?? 0,
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