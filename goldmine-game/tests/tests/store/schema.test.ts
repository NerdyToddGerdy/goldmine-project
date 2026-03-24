import { describe, it, expect } from "vitest";
import { migrateToLatest, defaultSaveV15 } from "../../../src/store/schema";

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
        expect(out.version).toBe(15);
        expect(out.tickCount).toBe(7);
        expect(out.timeScale).toBe(2);
        expect(out.gold).toBe(3);
        expect(out.paydirt).toBe(9);
    });

    it("handles empty input with defaults", () => {
        const out = migrateToLatest(undefined, undefined);
        expect(out).toEqual(defaultSaveV15());
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
        expect(out.version).toBe(15);
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
        expect(out.version).toBe(15);
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
        expect(out.version).toBe(15);
        expect(out.unlockedBanking).toBe(false);
        expect('hasBankCounter' in out).toBe(false);
        expect('unlockedShop' in out).toBe(false);
        expect(out.timePlayed).toBe(42);
        expect(out.darkMode).toBe(true);
    });
});


