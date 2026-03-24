// Central place to define what we persist and how to migrate between versions.

export const STORAGE_KEY = "goldmine:save";
export const SCHEMA_VERSION = 10 as const; // bump when persist shape changes

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

// Adding latest type alias
export type LatestSave = SaveV10;

export function migrateToLatest(raw: unknown, fromVersion: number | undefined): LatestSave {
    // No data? return to clean by default
    if (!raw || typeof raw != "object") {
        return defaultSaveV10();
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
        return {
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
        };
    }

    // v9 -> v10: add investment system
    if (fromVersion < 10) {
        const s = raw as Partial<SaveV9>;
        return {
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
        };
    }

    // Already v10, ensure fields exist
    const s = raw as Partial<SaveV10>;
    return {
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