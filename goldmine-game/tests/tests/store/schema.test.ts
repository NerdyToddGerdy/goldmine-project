import { describe, it, expect } from "vitest";
import { migrateToLatest, defaultSaveV12 } from "../../../src/store/schema";

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
        expect(out.version).toBe(12);
        expect(out.tickCount).toBe(7);
        expect(out.timeScale).toBe(2);
        expect(out.gold).toBe(3);
        expect(out.paydirt).toBe(9);
    });

    it("handles empty input with defaults", () => {
        const out = migrateToLatest(undefined, undefined);
        expect(out).toEqual(defaultSaveV12());
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
        expect(out.version).toBe(12);
        expect(out.unlockedBanking).toBe(false);
        expect('hasBankCounter' in out).toBe(false);
        expect('unlockedShop' in out).toBe(false);
        expect(out.timePlayed).toBe(42);
        expect(out.darkMode).toBe(true);
    });
});


