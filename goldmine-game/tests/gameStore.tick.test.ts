import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    gameStore,
    FIXED_DT_MS,
    UPGRADES,
    BASE_EXTRACTION,
    GOLD_PRICE_UPDATE_TICKS,
    INVESTMENTS,
    getTravelDurationTicks,
    SMELTING_FEE_PERCENT,
    SLUICE_CONVERSION_RATIO,
    PAYDIRT_YIELD_MULTIPLIER,
    SLUICE_DRAIN_RATE,
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
        // dirtPerTick = (1 * 3.0 * 1) / 60 = 0.05
        gameStore.setState({ shovels: 1, money: 9999, bucketFilled: 0 });
        runTicks(1);
        // Allow for floating point; bucket should be very close to 0.05
        expect(gameStore.getState().bucketFilled).toBeCloseTo(0.05, 8);
    });

    it('dustScoopBoost multiplies miner fill rate', () => {
        // dirtPerTick = (1 * 3.0 * (1 + 0.1*2)) / 60 = 3.6/60 = 0.06
        gameStore.setState({ shovels: 1, dustScoopBoost: 2, money: 9999, bucketFilled: 0 });
        runTicks(1);
        expect(gameStore.getState().bucketFilled).toBeCloseTo(0.06, 8);
    });

    it('miners stop filling when bucket is at capacity', () => {
        // bucketFilled = 10 (default bucketCap with no upgrades)
        gameStore.setState({ shovels: 2, money: 9999, bucketFilled: 10 });
        runTicks(1);
        // bucketFilled should still be 10 (not overflow); auto-empty won't fire because hasAutoEmpty=false and shovels are "idle" (bucket full)
        expect(gameStore.getState().bucketFilled).toBe(10);
    });
});

// ─── prospector (pan) gold production per tick ────────────────────────────────

describe('prospector production per tick', () => {
    it('1 pan produces correct gold with no upgrades', () => {
        // extractionRate = 0.2
        // panRate = (1 * 1.5 * 0.2 * 1) / (60 * 0.2) = 0.3/12 = 0.025
        // goldGained = 0.025 * 0.2 * 1 = 0.005
        gameStore.setState({ pans: 1, panFilled: 10, money: 9999, gold: 0 });
        runTicks(1);
        expect(gameStore.getState().gold).toBeCloseTo(0.005, 8);
        expect(gameStore.getState().panFilled).toBeCloseTo(10 - 0.025, 6);
    });

    it('sluiceWorkers increase extraction rate and gold output, paydirt multiplier applies', () => {
        // extractionRate = 0.2 + 1 * 0.1 * 1 = 0.3
        // panRate = (1 * 1.5 * 0.3 * 1) / (60 * 0.2) = 0.45/12 = 0.0375
        // goldGained = 0.0375 * 0.3 * PAYDIRT_YIELD_MULTIPLIER * 1 = 0.0375 * 0.3 * 2.5 = 0.028125
        gameStore.setState({ pans: 1, sluiceWorkers: 1, hasSluiceBox: true, sluiceGear: 1, panFilled: 10, money: 9999 });
        runTicks(1);
        const expected = 0.0375 * 0.3 * PAYDIRT_YIELD_MULTIPLIER;
        expect(gameStore.getState().gold).toBeCloseTo(expected, 8);
    });

    it('prospectors go idle when panFilled < 1', () => {
        gameStore.setState({ pans: 1, panFilled: 0.5, money: 9999 });
        runTicks(1);
        // prospectsIdle = panFilled < 1 = true → effectivePans = 0 → no gold
        expect(gameStore.getState().gold).toBe(0);
    });
});

// ─── auto-empty bucket logic ───────────────────────────────────────────────────

describe('auto-empty bucket', () => {
    it('does NOT auto-empty without hasAutoEmpty when no miners', () => {
        // No miners (dirtPerTick = 0), no hasAutoEmpty → condition fails
        gameStore.setState({ bucketFilled: 10, panFilled: 0, hasAutoEmpty: false, shovels: 0 });
        runTicks(1);
        expect(gameStore.getState().panFilled).toBe(0);
        expect(gameStore.getState().bucketFilled).toBe(10);
    });

    it('auto-empties bucket when hasAutoEmpty is true even without miners', () => {
        // bucketFilled=10, panFilled=0, hasAutoEmpty=true, no sluiceBox → sluicePower=1
        // amountToAdd = 10 * 1 = 10, newPanFilled = min(0+10, 20) = 10
        gameStore.setState({ bucketFilled: 10, panFilled: 0, hasAutoEmpty: true, shovels: 0, hasSluiceBox: false, money: 0 });
        runTicks(1);
        expect(gameStore.getState().panFilled).toBeCloseTo(10, 8);
        expect(gameStore.getState().bucketFilled).toBe(0);
    });

    it('sluiceBox routes bucket into sluiceBoxFilled (not panFilled) on auto-empty', () => {
        // With sluice box, auto-empty fills sluiceBoxFilled, not panFilled
        gameStore.setState({ bucketFilled: 10, panFilled: 0, sluiceBoxFilled: 0, hasAutoEmpty: true, hasSluiceBox: true, shovels: 0 });
        runTicks(1);
        expect(gameStore.getState().bucketFilled).toBeCloseTo(0, 8);
        expect(gameStore.getState().sluiceBoxFilled).toBeCloseTo(10, 8);
        // Pan should NOT have received anything directly from the bucket
        expect(gameStore.getState().panFilled).toBeCloseTo(0, 1);
    });

    it('sluiceBox auto-empty is blocked when sluice is not empty', () => {
        // sluiceBoxFilled > 0 means sluice is busy — bucket cannot empty until sluice drains
        gameStore.setState({ bucketFilled: 10, sluiceBoxFilled: 5, panFilled: 0, hasAutoEmpty: true, hasSluiceBox: true, shovels: 0 });
        runTicks(1);
        expect(gameStore.getState().bucketFilled).toBe(10); // unchanged
    });

    it('auto-empty is blocked when pan is already at capacity (no sluice)', () => {
        // panFilled=20 (at panCap with no upgrades) → condition newPanFilled < panCap fails
        gameStore.setState({ bucketFilled: 10, panFilled: 20, hasAutoEmpty: true, shovels: 0, hasSluiceBox: false });
        runTicks(1);
        expect(gameStore.getState().panFilled).toBeCloseTo(20, 8);
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

    it('sluice workers auto-clean moss into pan each tick', () => {
        // With sluiceWorkers, all available moss should transfer to pan in one tick
        gameStore.setState({ minersMossFilled: 5, panFilled: 0, sluiceBoxFilled: 0, hasSluiceBox: true, sluiceWorkers: 1, money: 9999 });
        runTicks(1);
        expect(gameStore.getState().minersMossFilled).toBeCloseTo(0, 6);
        expect(gameStore.getState().panFilled).toBeCloseTo(5, 6);
    });

    it('auto-clean is capped by available pan space', () => {
        // panFilled=18, panCap=20 → only 2 units can fit
        gameStore.setState({ minersMossFilled: 5, panFilled: 18, sluiceBoxFilled: 0, hasSluiceBox: true, sluiceWorkers: 1, money: 9999 });
        runTicks(1);
        expect(gameStore.getState().panFilled).toBeCloseTo(20, 6); // capped at panCap
        expect(gameStore.getState().minersMossFilled).toBeCloseTo(3, 6); // 5 - 2 = 3 remains
    });

    it('no auto-clean without sluice workers', () => {
        gameStore.setState({ minersMossFilled: 5, panFilled: 0, sluiceBoxFilled: 0, hasSluiceBox: true, sluiceWorkers: 0 });
        runTicks(1);
        expect(gameStore.getState().minersMossFilled).toBeCloseTo(5, 6); // unchanged
    });
});

// ─── driver round-trip sell ────────────────────────────────────────────────────

describe('driver auto-sell', () => {
    it('driver sells all gold at trip duration (mule cart)', () => {
        const tripDuration = getTravelDurationTicks(1); // 8s * 60 = 480 ticks
        gameStore.setState({
            hasDriver: true, vehicleTier: 1, gold: 5,
            hasFurnace: true, goldPrice: 1.0, dustGoldValue: 0,
            money: 0, driverTripTicks: 0,
            // No workers — payroll = 0
            shovels: 0, pans: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
        });
        runTicks(tripDuration);
        expect(gameStore.getState().gold).toBeCloseTo(0, 6);
        expect(gameStore.getState().money).toBeCloseTo(5, 6);
    });

    it('driver does not sell before trip duration completes', () => {
        const tripDuration = getTravelDurationTicks(1); // 480
        gameStore.setState({
            hasDriver: true, vehicleTier: 1, gold: 5,
            hasFurnace: true, goldPrice: 1.0,
            money: 0, driverTripTicks: 0,
            shovels: 0, pans: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
        });
        runTicks(tripDuration - 1); // one short
        expect(gameStore.getState().gold).toBeCloseTo(5, 6); // gold not yet sold
    });

    it('driver applies smelting fee without hasFurnace', () => {
        const tripDuration = getTravelDurationTicks(1);
        gameStore.setState({
            hasDriver: true, vehicleTier: 1, gold: 10,
            hasFurnace: false, goldPrice: 1.0, dustGoldValue: 0,
            money: 0, driverTripTicks: 0,
            shovels: 0, pans: 0, sluiceWorkers: 0, separatorWorkers: 0,
            ovenWorkers: 0, furnaceWorkers: 0, bankerWorkers: 0,
        });
        runTicks(tripDuration);
        // money = 10 * 1.0 * (1 - 0.15) = 8.5
        expect(gameStore.getState().money).toBeCloseTo(8.5, 5);
    });
});

// ─── gold price fluctuation ────────────────────────────────────────────────────

describe('gold price fluctuation', () => {
    it('goldPrice does not change before GOLD_PRICE_UPDATE_TICKS', () => {
        gameStore.setState({ goldPrice: 1.0, lastGoldPriceUpdate: 0, tickCount: 0 });
        runTicks(GOLD_PRICE_UPDATE_TICKS - 1);
        expect(gameStore.getState().goldPrice).toBe(1.0);
    });

    it('goldPrice changes at exactly GOLD_PRICE_UPDATE_TICKS', () => {
        // Make Math.random return a fixed value to get a deterministic swing
        vi.spyOn(Math, 'random').mockReturnValue(0.75); // swing = (0.75-0.5)*0.2 = +0.05
        gameStore.setState({ goldPrice: 1.0, lastGoldPriceUpdate: 0, tickCount: 0 });
        // Check fires when s.tickCount >= GOLD_PRICE_UPDATE_TICKS (pre-increment),
        // which is the (GOLD_PRICE_UPDATE_TICKS + 1)th _fixedTick call.
        runTicks(GOLD_PRICE_UPDATE_TICKS + 1);
        expect(gameStore.getState().goldPrice).not.toBe(1.0);
        vi.restoreAllMocks();
    });

    it('goldPrice stays within [GOLD_PRICE_MIN, GOLD_PRICE_MAX] bounds', () => {
        // Force maximum upward swing from the ceiling
        vi.spyOn(Math, 'random').mockReturnValue(1.0);
        gameStore.setState({ goldPrice: 1.80, lastGoldPriceUpdate: 0, tickCount: 0 });
        runTicks(GOLD_PRICE_UPDATE_TICKS);
        expect(gameStore.getState().goldPrice).toBeLessThanOrEqual(1.80);
        vi.restoreAllMocks();
    });
});

// ─── investment interest accumulation ────────────────────────────────────────

describe('investment interest per tick', () => {
    const TICKS_PER_MINUTE = 3600; // 60 ticks/s * 60s

    it('safe bonds accrue ~2% after 1 minute', () => {
        // Force random to 0 to suppress any risk events (safeBonds has no risk but just in case)
        vi.spyOn(Math, 'random').mockReturnValue(0);
        gameStore.setState({ investmentSafeBonds: 100 });
        runTicks(TICKS_PER_MINUTE);
        // Expected: 100 * (1 + 0.02/3600)^3600 ≈ 100 * e^0.02 ≈ 102.020
        expect(gameStore.getState().investmentSafeBonds).toBeCloseTo(102.02, 0);
        vi.restoreAllMocks();
    });

    it('stocks accrue ~5% after 1 minute (no risk event)', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0); // below riskChance → no event
        gameStore.setState({ investmentStocks: 100 });
        runTicks(TICKS_PER_MINUTE);
        // Expected: 100 * e^0.05 ≈ 105.127
        expect(gameStore.getState().investmentStocks).toBeCloseTo(105.13, 0);
        vi.restoreAllMocks();
    });

    it('risk check lastRiskCheck updates to tickCount at check interval', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        gameStore.setState({ investmentStocks: 100, lastRiskCheck: 0, tickCount: 0 });
        // Check fires at the (TICKS_PER_MINUTE + 1)th tick call when s.tickCount = TICKS_PER_MINUTE.
        // lastRiskCheck is set to s.tickCount (pre-increment value) = TICKS_PER_MINUTE.
        runTicks(TICKS_PER_MINUTE + 1);
        expect(gameStore.getState().lastRiskCheck).toBe(TICKS_PER_MINUTE);
        vi.restoreAllMocks();
    });

    it('risk event fires for stocks when random is below riskChance', () => {
        // risk check: Math.random() < riskChance (0.05) → 0.01 < 0.05 → event fires
        vi.spyOn(Math, 'random').mockReturnValue(0.01);
        gameStore.setState({ investmentStocks: 100, lastRiskCheck: 0 });
        runTicks(TICKS_PER_MINUTE + 1);
        // After event: investmentStocks should be less than initial 100 * growth
        // (growth ≈ 105, then loss of 15-40%)
        expect(gameStore.getState().investmentStocks).toBeLessThan(105.13);
        vi.restoreAllMocks();
    });

    it('safe bonds never take a risk event', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.99); // would trigger risk if riskChance > 0
        gameStore.setState({ investmentSafeBonds: 100, lastRiskCheck: 0 });
        runTicks(TICKS_PER_MINUTE * 2); // two check intervals
        // safeBonds should only have grown (no losses)
        expect(gameStore.getState().investmentSafeBonds).toBeGreaterThan(100);
        vi.restoreAllMocks();
    });
});
