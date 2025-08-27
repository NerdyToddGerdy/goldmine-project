// Central place to define what we persist and how to bigrate between versions.

export const STORAGE_KEY = "goldmine:save";
export const SCHEMA_VERSION = 2 as const; // bump when persist shape changes

// v1: before you renamed dirtyGold -> paydirt
export type SaveV1 = {
    version?: 1;
    tickCount: number;
    timeScale: number;
    pannedGold: number;
    dirtyGold: number; // old field name
};

// v2: current shape (paydirt)
export type SaveV2 = {
    version: 2;
    tickCount: number;
    timeScale: number;
    pannedGold: number;
    paydirt: number;
};

// Adding latest type alias
export type LatestSave = SaveV2;

export function migrateToLatest(raw: unknown, fromVersion: number | undefined): LatestSave {
    // No data? return to clean by default
    if (!raw || typeof raw != "object") {
        return defaultSaveV2();
    }

    // v1 -> v2: dirtyGold -> paydirt
    if (!fromVersion || fromVersion < 2) {
        const s = raw as Partial<SaveV1>;
        return {
            version: 2,
            tickCount: s.tickCount ?? 0,
            timeScale: s.timeScale ?? 1,
            pannedGold: s.pannedGold ?? 0,
            paydirt: s.dirtyGold ?? 0
        };
    }

    // Already v2, ensure fields exist
    const s = raw as Partial<SaveV2>;
    return {
        version: 2,
        tickCount: s.tickCount ?? 0,
        timeScale: s.timeScale ?? 0,
        pannedGold: s.pannedGold ?? 0,
        paydirt: s.paydirt ?? 0
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