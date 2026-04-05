import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    gameStore,
    FIXED_DT_MS,
    getTravelDurationTicks,
    SLUICE_CONVERSION_RATIO,
    PAYDIRT_YIELD_MULTIPLIER,
    SLUICE_DRAIN_RATE,
    makeCommonEmployee,
    FLAKES_HAUL_FEE,
} from '../src/store/gameStore';

beforeEach(() => {
    // Stub window/document so persist middleware and any direct calls don't throw
    vi.stubGlobal('localStorage', { removeItem: vi.fn(), getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() });
    vi.stubGlobal('window', { localStorage: (globalThis as Record<string, unknown>).localStorage });
    vi.stubGlobal('document', {
        documentElement: { classList: { add: vi.fn(), remove: vi.fn() } },
    });
    // hardResetSave wipes all state including timeScale, ensuring tests don't leak into each other.
    gameStore.getState().hardResetSave();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

/**
 * Run exactly N fixed ticks via stepSimulation.
 * Adding a 0.5-tick buffer avoids floating-point accumulation edge cases where
 * `FIXED_DT_MS * n - n * FIXED_DT_MS` ends up slightly negative, causing the
 * n-th tick to be skipped.
 */
function runTicks(n: number) {
    gameStore.getState().stepSimulation(FIXED_DT_MS * (n + 0.5));
}

// ─── stepSimulation accumulator ────────────────────────────────────────────────

describe('stepSimulation accumulator', () => {
    it('produces no ticks when timeScale is 0', () => {
        gameStore.getState().setTimeScale(0);
        runTicks(10);
        expect(gameStore.getState().tickCount).toBe(0);
    });

    it('scales tick count by timeScale = 2', () => {
        gameStore.getState().setTimeScale(2);
        // 1 real frame = 2 virtual ticks
        runTicks(1);
        expect(gameStore.getState().tickCount).toBe(2);
    });

    it('leftover accumulator carries across calls', () => {
        // 0.7 + 0.7 = 1.4 → 1 complete tick, 0.4 leftover
        gameStore.getState().stepSimulation(FIXED_DT_MS * 0.7);
        gameStore.getState().stepSimulation(FIXED_DT_MS * 0.7);
        expect(gameStore.getState().tickCount).toBe(1);
    });

    it('timePlayed increments by 1 per tick', () => {
        runTicks(5);
        expect(gameStore.getState().timePlayed).toBe(5);
    });
});

// ─── miner (shovel) bucket fill rate ──────────────────────────────────────────

describe('miner fill rate per tick', () => {
    it('1 shovel fills bucket at correct rate', () => {
        // dirtPerTick = (miningPower * MINER_DIRT_RATE) / 60 = (3.75 * 0.8) / 60 = 0.05
        gameStore.setState({ employees: [makeCommonEmployee('miner', 'Miner')], gold: 9999, bucketFilled: 0 });
        runTicks(1);
        // Allow for floating point; bucket should be very close to 0.05
        expect(gameStore.getState().bucketFilled).toBeCloseTo(0.05, 8);
    });

    it('two miners double the fill rate', () => {
        gameStore.setState({ employees: [makeCommonEmployee('miner', 'M1'), makeCommonEmployee('miner', 'M2')], gold: 9999, bucketFilled: 0 });
        runTicks(1);
        expect(gameStore.getState().bucketFilled).toBeCloseTo(0.10, 8);
    });

    it('miners stop filling when bucket is at capacity', () => {
        // bucketFilled = 10 (default bucketCap with no upgrades)
        gameStore.setState({ employees: [makeCommonEmployee('miner', 'M1'), makeCommonEmployee('miner', 'M2')], gold: 9999, bucketFilled: 10 });
        runTicks(1);
        // bucketFilled should still be 10 (not overflow); auto-empty won't fire because hasAutoEmpty=false and shovels are "idle" (bucket full)
        expect(gameStore.getState().bucketFilled).toBe(10);
    });
});

// ─── prospector (pan) gold production per tick ────────────────────────────────

describe('prospector production per tick', () => {
    it('1 pan produces correct gold with no upgrades', () => {
        // panRate = (3.75 * 0.4) / 60 = 0.025; goldGained = 0.025 * 0.2 * 1 = 0.005
        gameStore.setState({ employees: [makeCommonEmployee('prospector', 'Prospector')], panFilled: 10, gold: 0 });
        runTicks(1);
        expect(gameStore.getState().gold).toBeCloseTo(0.005, 8);
        expect(gameStore.getState().panFilled).toBeCloseTo(10 - 0.025, 6);
    });

    it('sluiceWorkers increase gold yield but do not speed up pan consumption', () => {
        // panRate = 0.025; extractionRate = 0.2 + 3.75*(4/150)*1 = 0.3
        // goldGained = 0.025 * 0.3 * PAYDIRT_YIELD_MULTIPLIER = 0.025 * 0.3 * 2.5 = 0.01875
        gameStore.setState({ employees: [makeCommonEmployee('prospector', 'Prospector'), makeCommonEmployee('sluiceOperator', 'Sluice')], hasSluiceBox: true, sluiceGear: 1, panFilled: 10, gold: 0 });
        runTicks(1);
        const expected = 0.025 * 0.3 * PAYDIRT_YIELD_MULTIPLIER;
        expect(gameStore.getState().gold).toBeCloseTo(expected, 8);
    });

    it('prospectors go idle when panFilled is 0 — no gold produced', () => {
        gameStore.setState({ employees: [makeCommonEmployee('prospector', 'Prospector')], panFilled: 0, gold: 0 });
        runTicks(1);
        expect(gameStore.getState().gold).toBe(0);
    });

    it('prospectors work on partial panFilled (< 1) — pan is consumed', () => {
        gameStore.setState({ employees: [makeCommonEmployee('prospector', 'Prospector')], panFilled: 0.5, gold: 0 });
        runTicks(1);
        // pan has dirt → some pan consumed
        expect(gameStore.getState().panFilled).toBeLessThan(0.5);
    });
});

// ─── auto-empty bucket logic ───────────────────────────────────────────────────

describe('auto-empty bucket', () => {
    it('does NOT auto-empty without haulers when no miners', () => {
        // No miners, no haulers → condition fails
        gameStore.setState({ bucketFilled: 10, panFilled: 0, employees: [] });
        runTicks(1);
        expect(gameStore.getState().panFilled).toBe(0);
        expect(gameStore.getState().bucketFilled).toBe(10);
    });

    it('auto-empties bucket when haulers > 0 even without miners', () => {
        // bucketFilled=10, panFilled=0, 1 hauler, no sluiceBox → empties to pan
        gameStore.setState({ bucketFilled: 10, panFilled: 0, employees: [makeCommonEmployee('hauler', 'Hauler')], hasSluiceBox: false, gold: 1 });
        runTicks(1);
        expect(gameStore.getState().panFilled).toBeCloseTo(10, 8);
        expect(gameStore.getState().bucketFilled).toBe(0);
    });

    it('sluiceBox routes bucket into sluiceBoxFilled (not panFilled) on auto-empty', () => {
        // With sluice box, auto-empty fills sluiceBoxFilled, not panFilled
        gameStore.setState({ bucketFilled: 10, panFilled: 0, sluiceBoxFilled: 0, employees: [makeCommonEmployee('hauler', 'Hauler')], hasSluiceBox: true, gold: 1 });
        runTicks(1);
        expect(gameStore.getState().bucketFilled).toBeCloseTo(0, 8);
        expect(gameStore.getState().sluiceBoxFilled).toBeCloseTo(10, 8);
        // Pan should NOT have received anything directly from the bucket
        expect(gameStore.getState().panFilled).toBeCloseTo(0, 1);
    });

    it('sluiceBox auto-empty adds to sluice when bucket fits in remaining space', () => {
        // sluiceBoxFilled=5, bucketFilled=10, panCap=20 → 5+10=15 ≤ 20 → empties
        gameStore.setState({ bucketFilled: 10, sluiceBoxFilled: 5, panFilled: 0, employees: [makeCommonEmployee('hauler', 'Hauler')], hasSluiceBox: true, gold: 1 });
        runTicks(1);
        expect(gameStore.getState().bucketFilled).toBeCloseTo(0, 5);
        // drain fires first (−0.05), then bucket adds: (5 − 0.05) + 10 = 14.95
        expect(gameStore.getState().sluiceBoxFilled).toBeCloseTo(14.95, 1);
    });

    it('sluiceBox auto-empty is blocked when bucket would overflow the sluice', () => {
        // sluiceBoxFilled=15, bucketFilled=10, panCap=20 → 15+10=25 > 20 → blocked
        gameStore.setState({ bucketFilled: 10, sluiceBoxFilled: 15, panFilled: 0, employees: [makeCommonEmployee('hauler', 'Hauler')], hasSluiceBox: true });
        runTicks(1);
        expect(gameStore.getState().bucketFilled).toBeCloseTo(10, 5); // unchanged
    });

    it('auto-empty is blocked when bucket would overflow pan (pan full, no sluice)', () => {
        // panFilled=20 (at panCap with no upgrades), bucket=10 → 20+10=30 > 20 → blocked
        gameStore.setState({ bucketFilled: 10, panFilled: 20, employees: [makeCommonEmployee('hauler', 'Hauler')], hasSluiceBox: false });
        runTicks(1);
        expect(gameStore.getState().panFilled).toBeCloseTo(20, 8);
        expect(gameStore.getState().bucketFilled).toBe(10);
    });

    it('auto-empty is blocked when bucket partially overflows pan (no sluice)', () => {
        // panFilled=15, bucketFilled=10, panCap=20 → 15+10=25 > 20 → blocked even though pan has space
        gameStore.setState({ bucketFilled: 10, panFilled: 15, employees: [makeCommonEmployee('hauler', 'Hauler')], hasSluiceBox: false });
        runTicks(1);
        expect(gameStore.getState().panFilled).toBeCloseTo(15, 8);
        expect(gameStore.getState().bucketFilled).toBe(10);
    });
});

// ─── sluice drain + miner's moss ──────────────────────────────────────────────

describe('sluice drain and miner\'s moss', () => {
    it('sluice box drains at SLUICE_DRAIN_RATE per second, filling moss via conversion ratio', () => {
        // Per tick: drain = SLUICE_DRAIN_RATE / 60; moss gain = drain * SLUICE_CONVERSION_RATIO
        gameStore.setState({ sluiceBoxFilled: 10, minersMossFilled: 0, panFilled: 0, hasSluiceBox: true });
        runTicks(1);
        const drainPerTick = SLUICE_DRAIN_RATE / 60;
        expect(gameStore.getState().sluiceBoxFilled).toBeCloseTo(10 - drainPerTick, 6);
        expect(gameStore.getState().minersMossFilled).toBeCloseTo(drainPerTick * SLUICE_CONVERSION_RATIO, 6);
    });

    it('sluice drain stops when moss is at capacity', () => {
        // Moss already full → no more draining
        gameStore.setState({ sluiceBoxFilled: 10, minersMossFilled: 20, panFilled: 0, hasSluiceBox: true });
        runTicks(1);
        expect(gameStore.getState().sluiceBoxFilled).toBeCloseTo(10, 6); // unchanged
        expect(gameStore.getState().minersMossFilled).toBeCloseTo(20, 6); // unchanged
    });

});

// ─── driver round-trip gold deposit ───────────────────────────────────────────

describe('driver gold deposit', () => {
    it('driver loads raw flakes and deposits at (1 - FLAKES_HAUL_FEE) on return', () => {
        const tripDuration = getTravelDurationTicks(1); // 8s * 60 = 480 ticks
        gameStore.setState({
            hasDriver: true, vehicleTier: 1, gold: 10, goldBars: 0,
            hasFurnace: false,
            driverTripTicks: 0,
            driverCarryingFlakes: 0, driverCarryingBars: 0, driverCapUpgrades: 0,
            employees: [],
        });
        runTicks(tripDuration);
        // Driver loads 10 flakes at tick 1 (gold→0), deposits 10*(1-0.15)=8.5 at tick tripDuration
        expect(gameStore.getState().gold).toBeCloseTo(10 * (1 - FLAKES_HAUL_FEE), 6);
        expect(gameStore.getState().driverCarryingFlakes).toBeCloseTo(0, 6);
    });

    it('driver prioritizes bars over flakes when loading (capacity=10)', () => {
        const tripDuration = getTravelDurationTicks(1);
        gameStore.setState({
            hasDriver: true, vehicleTier: 1, gold: 8, goldBars: 6,
            hasFurnace: true,
            driverTripTicks: 0,
            driverCarryingFlakes: 0, driverCarryingBars: 0, driverCapUpgrades: 0,
            employees: [],
        });
        runTicks(tripDuration);
        // capacity=10: 6 bars + 4 flakes loaded; gold was 8-4=4, bars 6-6=0
        // deposit: 6*1.0 + 4*(1-0.15) = 6 + 3.4 = 9.4 → gold = 4 + 9.4 = 13.4
        expect(gameStore.getState().goldBars).toBeCloseTo(0, 6);
        expect(gameStore.getState().gold).toBeCloseTo(4 + 6 + 4 * (1 - FLAKES_HAUL_FEE), 6);
        expect(gameStore.getState().driverCarryingBars).toBeCloseTo(0, 6);
    });

    it('driver delivers bars at full value (no fee)', () => {
        const tripDuration = getTravelDurationTicks(1);
        gameStore.setState({
            hasDriver: true, vehicleTier: 1, gold: 0, goldBars: 10,
            hasFurnace: true,
            driverTripTicks: 0,
            driverCarryingFlakes: 0, driverCarryingBars: 0, driverCapUpgrades: 0,
            employees: [],
        });
        runTicks(tripDuration);
        // capacity=10: 10 bars loaded; deposit = 10*1.0 = 10; gold = 0 + 10 = 10
        expect(gameStore.getState().gold).toBeCloseTo(10, 6);
        expect(gameStore.getState().goldBars).toBeCloseTo(0, 6);
    });

    it('driver does not deposit before trip duration completes', () => {
        const tripDuration = getTravelDurationTicks(1);
        gameStore.setState({
            hasDriver: true, vehicleTier: 1, gold: 10, goldBars: 0,
            hasFurnace: false,
            driverTripTicks: 0,
            driverCarryingFlakes: 0, driverCarryingBars: 0, driverCapUpgrades: 0,
            employees: [],
        });
        runTicks(tripDuration - 1);
        // Loaded at tick 1 (gold→0), deposit hasn't happened yet
        expect(gameStore.getState().gold).toBeCloseTo(0, 6);
    });

    it('driver only carries up to capacity (base 10 oz)', () => {
        const tripDuration = getTravelDurationTicks(1);
        gameStore.setState({
            hasDriver: true, vehicleTier: 1, gold: 25, goldBars: 0,
            hasFurnace: false,
            driverTripTicks: 0,
            driverCarryingFlakes: 0, driverCarryingBars: 0, driverCapUpgrades: 0,
            employees: [],
        });
        // After load tick: gold = 15 (25-10). After return: gold = 15+10 = 25
        runTicks(tripDuration - 1);
        expect(gameStore.getState().gold).toBeCloseTo(15, 6); // capacity 10 loaded
    });
});

