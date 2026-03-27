import { describe, it, expect } from "vitest";
import { migrateToLatest, defaultSaveV27 } from "../../../src/store/schema";

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
        expect(out.version).toBe(27);
        expect(out.tickCount).toBe(7);
        expect(out.timeScale).toBe(2);
        expect(out.gold).toBe(3);
        expect(out.paydirt).toBe(9);
    });

    it("handles empty input with defaults", () => {
        const out = migrateToLatest(undefined, undefined);
        expect(out).toEqual(defaultSaveV27());
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
        expect(out.version).toBe(27);
        expect(out.legacyDust).toBe(0);
        expect(out.runMoneyEarned).toBe(0);
        expect(out.prestigeCount).toBe(0);
        expect(out.dustScoopBoost).toBe(0);
        expect(out.dustPanYield).toBe(0);
        expect(out.dustGoldValue).toBe(0);
        expect(out.dustHeadStart).toBe(0);
        expect(out.dustBucketSize).toBe(0);
        expect(out.dustPanSpeed).toBe(0);
        expect(out.dustPanCapacity).toBe(0);
        expect(out.unlockedBanking).toBe(true);
        expect(out.timePlayed).toBe(100);
        expect(out.totalGoldExtracted).toBe(0);
        expect(out.totalMoneyEarned).toBe(0);
        expect(out.peakRunMoney).toBe(0);
    });

    it("migrates v14 adding bucketSize, panSpeed, panCapacity dust upgrades", () => {
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
        expect(out.version).toBe(27);
        expect(out.dustScoopBoost).toBe(2); // preserved
        expect(out.dustPanYield).toBe(1);   // preserved
        expect(out.dustBucketSize).toBe(0); // new field defaults to 0
        expect(out.dustPanSpeed).toBe(0);
        expect(out.dustPanCapacity).toBe(0);
        expect(out.legacyDust).toBe(10);    // preserved
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
        expect(out.version).toBe(27);
        expect(out.unlockedBanking).toBe(false);
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
        expect(out.version).toBe(27);
        expect(out.vehicleTier).toBe(0);       // new field defaults to 0
        expect(out.hasDriver).toBe(false);     // new field defaults to false
        expect(out.dustBucketSize).toBe(1);    // preserved
        expect(out.dustPanCapacity).toBe(2);   // preserved
        expect(out.legacyDust).toBe(5);        // preserved
        expect(out.bucketUpgrades).toBe(0);    // v17 field defaults to 0
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
        expect(out.version).toBe(27);
        expect(out.bucketUpgrades).toBe(0);    // new field defaults to 0
        expect(out.panCapUpgrades).toBe(0);
        expect(out.panSpeedUpgrades).toBe(0);
        expect(out.vehicleTier).toBe(1);       // preserved
        expect(out.shovels).toBe(2);           // preserved
        expect(out.money).toBe(50);            // preserved
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
        expect(out.version).toBe(27);
        expect(out.goldPrice).toBe(1.0);           // new field defaults to 1.0
        expect(out.lastGoldPriceUpdate).toBe(0);   // new field defaults to 0
        expect(out.bucketUpgrades).toBe(1);        // preserved
        expect(out.panSpeedUpgrades).toBe(2);      // preserved
        expect(out.money).toBe(100);               // preserved
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
        expect(out.version).toBe(27);
        expect(out.haulers).toBe(0);                                 // no haulers by default
        expect(out.lastSeenChangelogVersion).toBe('v0.18');          // existing players see new popup
        expect(out.money).toBe(200);                                 // preserved
        expect(out.legacyDust).toBe(3);                             // preserved
        expect(out.goldPrice).toBe(1.2);                            // preserved
        expect(out.totalGoldExtracted).toBe(0);                     // new v20 field
        expect(out.totalMoneyEarned).toBe(0);                       // new v20 field
        expect(out.peakRunMoney).toBe(500);                         // seeded from runMoneyEarned
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
        expect(out.version).toBe(27);
        expect(out.location).toBe('town');
        expect(out.dirt).toBe(3);
        expect(out.paydirt).toBe(7);
        expect(out.gold).toBe(1);
        expect(out.money).toBe(50);
        expect(out.shovels).toBe(2);
        expect(out.scoopPower).toBe(2);
        expect(out.sluiceWorkers).toBe(0);
        expect(out.hasSluiceBox).toBe(false);
        expect(out.sluiceGear).toBe(1);
        expect(out.bankerWorkers).toBe(0);
        expect(out.panFilled).toBe(0);
        expect(out.investmentSafeBonds).toBe(0);
        expect(out.unlockedBanking).toBe(false);
        expect(out.legacyDust).toBe(0);
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
        expect(out.version).toBe(27);
        expect(out.hasSluiceBox).toBe(true);
        expect(out.sluiceWorkers).toBe(0);
        expect(out.sluicePower).toBe(1);
        expect(out.sluiceGear).toBe(1);
        expect(out.bankerWorkers).toBe(0);
        expect(out.bucketFilled).toBe(0);
        expect(out.panFilled).toBe(0);
        expect(out.investmentHighRisk).toBe(0);
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
        expect(out.version).toBe(27);
        expect(out.sluiceWorkers).toBe(2);
        expect(out.bankerWorkers).toBe(0);
        expect(out.sluicePower).toBe(1);
        expect(out.sluiceGear).toBe(1);
        expect(out.bucketFilled).toBe(0);
        expect(out.panFilled).toBe(0);
    });

    it("migrates v6 preserving gear levels and adding banker/bucket", () => {
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
        expect(out.version).toBe(27);
        expect(out.sluicePower).toBe(2);
        expect(out.sluiceGear).toBe(3);
        expect(out.bankerWorkers).toBe(0);
        expect(out.bucketFilled).toBe(0);
        expect(out.panFilled).toBe(0);
    });

    it("migrates v7 preserving bankerWorkers and adding bucket/investments", () => {
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
        expect(out.version).toBe(27);
        expect(out.bankerWorkers).toBe(3);
        expect(out.bucketFilled).toBe(0);
        expect(out.panFilled).toBe(0);
        expect(out.investmentSafeBonds).toBe(0);
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
        expect(out.version).toBe(27);
        expect(out.bucketFilled).toBe(5);
        expect(out.panFilled).toBe(0);
        expect(out.investmentSafeBonds).toBe(0);
        expect(out.investmentStocks).toBe(0);
        expect(out.investmentHighRisk).toBe(0);
        expect(out.lastRiskCheck).toBe(0);
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
        expect(out.version).toBe(27);
        expect(out.panFilled).toBe(8);
        expect(out.bucketFilled).toBe(3);
        expect(out.money).toBe(75);
        expect(out.investmentSafeBonds).toBe(0);
        expect(out.investmentStocks).toBe(0);
        expect(out.investmentHighRisk).toBe(0);
        expect('hasBankCounter' in out).toBe(false);
    });

    it("migrates v13 preserving prestige fields and zeroing dust upgrade fields", () => {
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
        expect(out.version).toBe(27);
        expect(out.legacyDust).toBe(8);
        expect(out.runMoneyEarned).toBe(300);
        expect(out.prestigeCount).toBe(2);
        expect(out.dustScoopBoost).toBe(0);
        expect(out.dustPanYield).toBe(0);
        expect(out.dustGoldValue).toBe(0);
        expect(out.dustHeadStart).toBe(0);
        expect(out.dustBucketSize).toBe(0);
        expect(out.dustPanSpeed).toBe(0);
        expect(out.dustPanCapacity).toBe(0);
        expect(out.vehicleTier).toBe(0);
        expect(out.hasDriver).toBe(false);
    });
});


