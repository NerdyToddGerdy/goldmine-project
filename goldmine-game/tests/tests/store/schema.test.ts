import { describe, it, expect } from "vitest";
import { migrateToLatest, defaultSaveV2 } from "../../../src/store/schema";

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
        expect(out.version).toBe(2);
        expect(out.tickCount).toBe(7);
        expect(out.timeScale).toBe(2);
        expect(out.pannedGold).toBe(3);
        expect(out.paydirt).toBe(9);
    });

    it("handles empty input with defaults", () => {
        const out = migrateToLatest(undefined, undefined);
        expect(out).toEqual(defaultSaveV2());
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
});


