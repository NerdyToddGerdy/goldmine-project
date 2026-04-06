import { describe, it, expect } from "vitest";
import { migrateToLatest, defaultSaveV28, defaultSaveV36 } from "../../../src/store/schema";

describe("migrateToLatest", () => {
    it("migrates v1 dirtyGold -> paydirt", () => {
        const v1 = {
            version: 1,
            tickCount: 7,
            timeScale: 2,
            pannedGold: 3,
            dirtyGold: 9,
        };
        const out = migrateToLatest(v1, 1);
        expect(out.version).toBe(36);
        expect(out.tickCount).toBe(7);
        expect(out.timeScale).toBe(2);
        expect(out.gold).toBe(3);
        expect(out.paydirt).toBe(9);
    });

    it("handles empty input with defaults", () => {
        const out = migrateToLatest(undefined, undefined);
        expect(out).toEqual(defaultSaveV36());
    });

    it("passes through v2 shape filling defaults", () => {
        const v2 = {
            version: 2,
            tickCount: 1,
            timeScale: 1,
            pannedGold: 0,
            paydirt: 5,
        }
        const out = migrateToLatest(v2, 2);
        expect(out.paydirt).toBe(5);
    });

    it("migrates v12 adding prestige fields", () => {
        const v12 = {
            version: 12,
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
            unlockedPanning: true,
            unlockedTown: true,
            unlockedBanking: true,
            timePlayed: 100,
            darkMode: false,
        };
        const out = migrateToLatest(v12, 12);
        expect(out.version).toBe(36);
        expect('legacyDust' in out).toBe(false);
        expect('prestigeCount' in out).toBe(false);
        expect('dustScoopBoost' in out).toBe(false);
        expect('dustPanYield' in out).toBe(false);
        expect('unlockedBanking' in out).toBe(false);
        expect(out.timePlayed).toBe(100);
        expect(out.totalGoldExtracted).toBe(0);
        expect(out.npcLevels).toBeDefined();
        expect(out.pendingCommission).toBeNull();
    });

    it("migrates v14 — dust fields stripped in v32", () => {
        const v14 = { version: 14, tickCount: 0, timeScale: 1, location: 'mine',
            bucketFilled: 0, panFilled: 0, dirt: 0, paydirt: 0, gold: 0, money: 0,
            investmentSafeBonds: 0, investmentStocks: 0, investmentHighRisk: 0, lastRiskCheck: 0,
            shovels: 0, pans: 0, carts: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
            hasSluiceBox: false, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            scoopPower: 1, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: false, unlockedTown: false, unlockedBanking: false,
            timePlayed: 0, darkMode: false,
            legacyDust: 10, runMoneyEarned: 0, prestigeCount: 1,
            dustScoopBoost: 2, dustPanYield: 1, dustGoldValue: 0, dustHeadStart: 1,
        };
        const out = migrateToLatest(v14, 14);
        expect(out.version).toBe(36);
        expect('dustScoopBoost' in out).toBe(false);
        expect('legacyDust' in out).toBe(false);
        expect(out.npcLevels).toBeDefined();
        expect(out.pendingCommission).toBeNull();
    });

    it("migrates v11 dropping hasBankCounter and unlockedShop, adding unlockedBanking", () => {
        const v11 = {
            version: 11,
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
            hasBankCounter: true, // dead field, should be dropped
            scoopPower: 1,
            sluicePower: 1,
            panPower: 1,
            sluiceGear: 1,
            separatorGear: 1,
            ovenGear: 1,
            furnaceGear: 1,
            unlockedPanning: true,
            unlockedTown: true,
            unlockedShop: true, // dead field, should be dropped
            timePlayed: 42,
            darkMode: true,
        };
        const out = migrateToLatest(v11, 11);
        expect(out.version).toBe(36);
        expect('unlockedBanking' in out).toBe(false);
        expect('hasBankCounter' in out).toBe(false);
        expect('unlockedShop' in out).toBe(false);
        expect(out.timePlayed).toBe(42);
        expect(out.darkMode).toBe(true);
    });

    it("migrates v15 adding vehicleTier and hasDriver", () => {
        const v15 = {
            version: 15, tickCount: 0, timeScale: 1, location: 'mine',
            bucketFilled: 0, panFilled: 0, dirt: 0, paydirt: 0, gold: 0, money: 0,
            investmentSafeBonds: 0, investmentStocks: 0, investmentHighRisk: 0, lastRiskCheck: 0,
            shovels: 0, pans: 0, carts: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
            hasSluiceBox: false, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            scoopPower: 1, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: false, unlockedTown: false, unlockedBanking: false,
            timePlayed: 0, darkMode: false,
            legacyDust: 5, runMoneyEarned: 0, prestigeCount: 1,
            dustScoopBoost: 2, dustPanYield: 1, dustGoldValue: 0, dustHeadStart: 1,
            dustBucketSize: 1, dustPanSpeed: 0, dustPanCapacity: 2,
        };
        const out = migrateToLatest(v15, 15);
        expect(out.version).toBe(36);
        expect(out.vehicleTier).toBe(0);              // new field defaults to 0
        expect(out.hasDriver).toBe(false);            // new field defaults to false
        expect('dustBucketSize' in out).toBe(false);  // stripped in v32
        expect('dustPanCapacity' in out).toBe(false); // stripped in v32
        expect('legacyDust' in out).toBe(false);      // stripped in v32
        expect(out.bucketUpgrades).toBe(0);           // v17 field defaults to 0
        expect(out.panCapUpgrades).toBe(0);
        expect(out.panSpeedUpgrades).toBe(0);
    });

    it("migrates v16 adding bucketUpgrades, panCapUpgrades, panSpeedUpgrades", () => {
        const v16 = {
            version: 16, tickCount: 0, timeScale: 1, location: 'mine',
            bucketFilled: 0, panFilled: 0, dirt: 0, paydirt: 0, gold: 0, money: 50,
            investmentSafeBonds: 0, investmentStocks: 0, investmentHighRisk: 0, lastRiskCheck: 0,
            shovels: 2, pans: 1, carts: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
            hasSluiceBox: true, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            scoopPower: 2, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: true, unlockedTown: true, unlockedBanking: false,
            timePlayed: 0, darkMode: false,
            legacyDust: 0, runMoneyEarned: 100, prestigeCount: 0,
            dustScoopBoost: 0, dustPanYield: 0, dustGoldValue: 0, dustHeadStart: 0,
            dustBucketSize: 0, dustPanSpeed: 0, dustPanCapacity: 0,
            vehicleTier: 1, hasDriver: false,
        };
        const out = migrateToLatest(v16, 16);
        expect(out.version).toBe(36);
        expect(out.bucketUpgrades).toBe(0);    // new field defaults to 0
        expect(out.panCapUpgrades).toBe(0);
        expect(out.panSpeedUpgrades).toBe(0);
        expect(out.vehicleTier).toBe(1);       // preserved
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'miner').length).toBe(2); // shovels→employees
    });

    it("migrates v17 adding goldPrice and lastGoldPriceUpdate", () => {
        const v17 = {
            version: 17, tickCount: 0, timeScale: 1, location: 'mine',
            bucketFilled: 0, panFilled: 0, dirt: 0, paydirt: 0, gold: 0, money: 100,
            investmentSafeBonds: 0, investmentStocks: 0, investmentHighRisk: 0, lastRiskCheck: 0,
            shovels: 1, pans: 0, carts: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
            hasSluiceBox: false, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            scoopPower: 1, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: true, unlockedTown: true, unlockedBanking: false,
            timePlayed: 0, darkMode: false,
            legacyDust: 0, runMoneyEarned: 0, prestigeCount: 0,
            dustScoopBoost: 0, dustPanYield: 0, dustGoldValue: 0, dustHeadStart: 0,
            dustBucketSize: 0, dustPanSpeed: 0, dustPanCapacity: 0,
            bucketUpgrades: 1, panCapUpgrades: 0, panSpeedUpgrades: 2,
            vehicleTier: 0, hasDriver: false,
        };
        const out = migrateToLatest(v17, 17);
        expect(out.version).toBe(36);
        expect(out.bucketUpgrades).toBe(1);        // preserved
        expect(out.panSpeedUpgrades).toBe(2);      // preserved
    });

    it("migrates v18 adding haulers and lastSeenChangelogVersion", () => {
        const v18 = {
            version: 18, tickCount: 0, timeScale: 1, location: 'mine',
            bucketFilled: 0, panFilled: 0, dirt: 0, paydirt: 0, gold: 0, money: 200,
            investmentSafeBonds: 0, investmentStocks: 0, investmentHighRisk: 0, lastRiskCheck: 0,
            shovels: 2, pans: 1, carts: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
            hasSluiceBox: true, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            scoopPower: 1, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: true, unlockedTown: true, unlockedBanking: false,
            timePlayed: 500, darkMode: false,
            legacyDust: 3, runMoneyEarned: 500, prestigeCount: 1,
            dustScoopBoost: 1, dustPanYield: 0, dustGoldValue: 0, dustHeadStart: 0,
            dustBucketSize: 0, dustPanSpeed: 0, dustPanCapacity: 0,
            bucketUpgrades: 0, panCapUpgrades: 0, panSpeedUpgrades: 0,
            vehicleTier: 1, hasDriver: false,
            goldPrice: 1.2, lastGoldPriceUpdate: 100,
        };
        const out = migrateToLatest(v18, 18);
        expect(out.version).toBe(36);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'hauler').length).toBe(0); // haulers→employees
        expect(out.lastSeenChangelogVersion).toBe('v0.18');          // existing players see new popup
        expect('legacyDust' in out).toBe(false);                     // stripped in v32
        expect(out.totalGoldExtracted).toBe(0);                     // new v20 field
    });

    it("migrates v3 adding equipment, workers, and gear (all zeroed/defaulted)", () => {
        const v3 = {
            version: 3,
            tickCount: 5, timeScale: 1, location: 'town',
            dirt: 3, paydirt: 7, gold: 1, money: 50,
            shovels: 2, pans: 1, carts: 0,
            scoopPower: 2, panPower: 1,
            unlockedPanning: true, unlockedTown: true, unlockedShop: false,
        };
        const out = migrateToLatest(v3, 3);
        expect(out.version).toBe(36);
        expect(out.location).toBe('town');
        expect(out.dirt).toBe(3);
        expect(out.paydirt).toBe(7);
        expect(out.gold).toBe(1);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'miner').length).toBe(2);
        expect(out.scoopPower).toBe(2);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'sluiceOperator').length).toBe(0);
        expect(out.hasSluiceBox).toBe(false);
        expect(out.sluiceGear).toBe(1);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'banker').length).toBe(0);
        expect(out.panFilled).toBe(0);
        expect('investmentSafeBonds' in out).toBe(false);
        expect('unlockedBanking' in out).toBe(false);
        expect('legacyDust' in out).toBe(false);
        expect('unlockedShop' in out).toBe(false);
        expect('hasBankCounter' in out).toBe(false);
    });

    it("migrates v4 preserving equipment flags, zeroing workers, adding gear defaults", () => {
        const v4 = {
            version: 4,
            tickCount: 0, timeScale: 1, location: 'mine',
            dirt: 0, paydirt: 2, gold: 0, money: 200,
            shovels: 1, pans: 0, carts: 0,
            hasSluiceBox: true, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            scoopPower: 1, panPower: 1,
            unlockedPanning: true, unlockedTown: false, unlockedShop: true,
        };
        const out = migrateToLatest(v4, 4);
        expect(out.version).toBe(36);
        expect(out.hasSluiceBox).toBe(true);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'sluiceOperator').length).toBe(0);
        expect(out.sluicePower).toBe(1);
        expect(out.sluiceGear).toBe(1);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'banker').length).toBe(0);
        expect(out.bucketFilled).toBe(0);
        expect(out.panFilled).toBe(0);
        expect('investmentHighRisk' in out).toBe(false);
        expect('unlockedShop' in out).toBe(false);
    });

    it("migrates v5 preserving worker counts and adding gear defaults", () => {
        const v5 = {
            version: 5,
            tickCount: 0, timeScale: 1, location: 'mine',
            dirt: 0, paydirt: 0, gold: 0, money: 0,
            shovels: 1, pans: 1, carts: 0,
            sluiceWorkers: 2, separatorWorkers: 0, ovenWorkers: 1, furnaceWorkers: 0,
            hasSluiceBox: true, hasMagneticSeparator: false, hasOven: true, hasFurnace: false,
            scoopPower: 1, panPower: 1,
            unlockedPanning: true, unlockedTown: true, unlockedShop: false,
        };
        const out = migrateToLatest(v5, 5);
        expect(out.version).toBe(36);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'sluiceOperator').length).toBe(2);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'banker').length).toBe(0);
        expect(out.sluicePower).toBe(1);
        expect(out.sluiceGear).toBe(1);
        expect(out.bucketFilled).toBe(0);
        expect(out.panFilled).toBe(0);
    });

    it("migrates v6 preserving gear levels (banker workers dropped in v31)", () => {
        const v6 = {
            version: 6,
            tickCount: 10, timeScale: 1, location: 'mine',
            dirt: 0, paydirt: 0, gold: 0, money: 0,
            shovels: 0, pans: 0, carts: 0,
            sluiceWorkers: 1, separatorWorkers: 0, ovenWorkers: 0, furnaceWorkers: 0,
            hasSluiceBox: true, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            scoopPower: 1, sluicePower: 2, panPower: 1,
            sluiceGear: 3, separatorGear: 1, ovenGear: 2, furnaceGear: 1,
            unlockedPanning: true, unlockedTown: false, unlockedShop: false,
        };
        const out = migrateToLatest(v6, 6);
        expect(out.version).toBe(36);
        expect(out.sluicePower).toBe(2);
        expect(out.sluiceGear).toBe(3);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'banker').length).toBe(0);
        expect(out.bucketFilled).toBe(0);
        expect(out.panFilled).toBe(0);
    });

    it("migrates v7 with bankerWorkers (bankers stripped in v31)", () => {
        const v7 = {
            version: 7,
            tickCount: 0, timeScale: 1, location: 'mine',
            dirt: 0, paydirt: 0, gold: 0, money: 0,
            shovels: 0, pans: 0, carts: 0,
            sluiceWorkers: 0, separatorWorkers: 0, ovenWorkers: 0, furnaceWorkers: 0,
            bankerWorkers: 3,
            hasSluiceBox: false, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            hasBankCounter: true,
            scoopPower: 1, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: true, unlockedTown: true, unlockedShop: false,
        };
        const out = migrateToLatest(v7, 7);
        expect(out.version).toBe(36);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'banker').length).toBe(0);
        expect(out.bucketFilled).toBe(0);
        expect(out.panFilled).toBe(0);
        expect('investmentSafeBonds' in out).toBe(false);
        expect('hasBankCounter' in out).toBe(false);
    });

    it("migrates v8 adding panFilled and investment fields", () => {
        const v8 = {
            version: 8,
            tickCount: 0, timeScale: 1, location: 'mine',
            bucketFilled: 5,
            dirt: 0, paydirt: 0, gold: 0, money: 0,
            shovels: 0, pans: 0, carts: 0,
            sluiceWorkers: 0, separatorWorkers: 0, ovenWorkers: 0, furnaceWorkers: 0,
            bankerWorkers: 0,
            hasSluiceBox: false, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            hasBankCounter: false,
            scoopPower: 1, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: false, unlockedTown: false, unlockedShop: false,
        };
        const out = migrateToLatest(v8, 8);
        expect(out.version).toBe(36);
        expect(out.bucketFilled).toBe(5);
        expect(out.panFilled).toBe(0);
        expect('investmentSafeBonds' in out).toBe(false);
        expect('investmentStocks' in out).toBe(false);
        expect('investmentHighRisk' in out).toBe(false);
        expect('lastRiskCheck' in out).toBe(false);
        expect(out.timePlayed).toBe(0);
        expect(out.darkMode).toBe(false);
    });

    it("migrates v9 preserving panFilled and adding investments", () => {
        const v9 = {
            version: 9,
            tickCount: 0, timeScale: 1, location: 'mine',
            bucketFilled: 3, panFilled: 8,
            dirt: 0, paydirt: 0, gold: 0, money: 75,
            shovels: 0, pans: 0, carts: 0,
            sluiceWorkers: 0, separatorWorkers: 0, ovenWorkers: 0, furnaceWorkers: 0,
            bankerWorkers: 0,
            hasSluiceBox: false, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            hasBankCounter: true,
            scoopPower: 1, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: false, unlockedTown: false, unlockedShop: false,
        };
        const out = migrateToLatest(v9, 9);
        expect(out.version).toBe(36);
        expect(out.panFilled).toBe(8);
        expect(out.bucketFilled).toBe(3);
        expect('investmentSafeBonds' in out).toBe(false);
        expect('investmentStocks' in out).toBe(false);
        expect('investmentHighRisk' in out).toBe(false);
        expect('hasBankCounter' in out).toBe(false);
    });

    it("migrates v13 — dust/prestige fields stripped in v32", () => {
        const v13 = {
            version: 13,
            tickCount: 0, timeScale: 1, location: 'mine',
            bucketFilled: 0, panFilled: 0, dirt: 0, paydirt: 0, gold: 0, money: 0,
            investmentSafeBonds: 0, investmentStocks: 0, investmentHighRisk: 0, lastRiskCheck: 0,
            shovels: 0, pans: 0, carts: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
            hasSluiceBox: false, hasMagneticSeparator: false, hasOven: false, hasFurnace: false,
            scoopPower: 1, sluicePower: 1, panPower: 1,
            sluiceGear: 1, separatorGear: 1, ovenGear: 1, furnaceGear: 1,
            unlockedPanning: false, unlockedTown: false, unlockedBanking: false,
            timePlayed: 0, darkMode: false,
            legacyDust: 8, runMoneyEarned: 300, prestigeCount: 2,
        };
        const out = migrateToLatest(v13, 13);
        expect(out.version).toBe(36);
        expect('legacyDust' in out).toBe(false);    // stripped in v32
        expect('prestigeCount' in out).toBe(false); // stripped in v32
        expect('dustScoopBoost' in out).toBe(false);
        expect('dustPanYield' in out).toBe(false);
        expect('dustGoldValue' in out).toBe(false);
        expect('dustHeadStart' in out).toBe(false);
        expect('dustBucketSize' in out).toBe(false);
        expect('dustPanSpeed' in out).toBe(false);
        expect('dustPanCapacity' in out).toBe(false);
        expect(out.vehicleTier).toBe(0);            // new field defaults to 0
        expect(out.hasDriver).toBe(false);          // new field defaults to false
        expect(out.npcLevels).toBeDefined();
        expect(out.pendingCommission).toBeNull();
    });

    it("migrates v27 → v28 adding split driver carrier and vault fields defaulted to zero", () => {
        const v27 = { ...defaultSaveV28(), version: 27, haulers: 2 };
        // Remove v28-only fields to simulate a real v27 save
        const { driverCarryingFlakes: _dcf, driverCarryingBars: _dcb,
                driverCapUpgrades: _dca, vaultFlakes: _vf, vaultBars: _vb, ...v27clean } = v27 as ReturnType<typeof defaultSaveV28>;
        const out = migrateToLatest({ ...v27clean, version: 27 }, 27);
        expect(out.version).toBe(36);
        expect(out.driverCarryingFlakes).toBe(0);
        expect(out.driverCarryingBars).toBe(0);
        expect(out.driverCapUpgrades).toBe(0);
        expect(out.employees.filter((e: {assignedRole: string}) => e.assignedRole === 'hauler').length).toBe(2); // haulers→employees
    });

    it("migrates v28 → v29 → v30 → v31 converting worker counts to employees (bankers stripped)", () => {
        const v28 = { ...defaultSaveV28(), shovels: 2, pans: 1, sluiceWorkers: 1, furnaceWorkers: 0, bankerWorkers: 1, haulers: 1, detectorWorkers: 0 };
        const out = migrateToLatest(v28, 28);
        expect(out.version).toBe(36);
        expect(out.employees).toBeDefined();
        expect(Array.isArray(out.employees)).toBe(true);
        // 2 miners + 1 prospector + 1 sluice op + 1 hauler = 5 employees (banker stripped in v31)
        expect(out.employees.length).toBe(5);
        const minerCount = out.employees.filter((e) => e.assignedRole === 'miner').length;
        const prospectorCount = out.employees.filter((e) => e.assignedRole === 'prospector').length;
        expect(minerCount).toBe(2);
        expect(prospectorCount).toBe(1);
        // Old fields should not be present
        expect('shovels' in out).toBe(false);
        expect('pans' in out).toBe(false);
    });
});


