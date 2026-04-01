import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    gameStore,
    FIXED_DT_MS,
    UPGRADES,
    EQUIPMENT,
    VEHICLE_TIERS,
    DRIVER_COST,
    BASE_EXTRACTION,
    SMELTING_FEE_PERCENT,
    DUST_HEAD_START_AMOUNTS,
    getEffectivePanClickAmount,
    MAX_GEAR_UPGRADE_LEVEL,
    BUCKET_UPGRADE_COSTS,
    WITHDRAWAL_PENALTY,
    DETECT_PROGRESS_PER_CLICK,
    DETECT_TARGET_MIN,
    DETECT_TARGET_MAX,
    PATCH_CAPACITY_MIN,
    PATCH_CAPACITY_MAX,
    FURNACE_CAPACITY,
    makeCommonEmployee,
} from '../src/store/gameStore';

// Stub browser globals so actions that call window/document don't throw
beforeEach(() => {
    vi.stubGlobal('localStorage', { removeItem: vi.fn(), getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() });
    vi.stubGlobal('window', { localStorage: (globalThis as Record<string, unknown>).localStorage });
    vi.stubGlobal('document', {
        documentElement: { classList: { add: vi.fn(), remove: vi.fn() } },
    });
    // hardResetSave wipes ALL state including permanent dust upgrades and lifetime stats,
    // ensuring tests don't leak state into each other.
    gameStore.getState().hardResetSave();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// ─── panForGold ───────────────────────────────────────────────────────────────

describe('panForGold', () => {
    it('does nothing when panFilled is 0', () => {
        gameStore.setState({ panFilled: 0 });
        gameStore.getState().panForGold();
        expect(gameStore.getState().gold).toBe(0);
        expect(gameStore.getState().panFilled).toBe(0);
    });

    it('pans partial amounts (panFilled < 1) yielding proportional gold', () => {
        // panFilled=0.5, panClickAmount=1 → materialUsed=0.5, gold=0.5*1*0.2=0.1
        gameStore.setState({ panFilled: 0.5 });
        gameStore.getState().panForGold();
        expect(gameStore.getState().gold).toBeCloseTo(0.1, 10);
        expect(gameStore.getState().panFilled).toBeCloseTo(0, 10);
    });

    it('produces gold and reduces panFilled at base extraction rate', () => {
        // panFilled=10, no boosts → materialUsed=1, extractionRate=0.2, gold=1*1*0.2*1=0.2
        gameStore.setState({ panFilled: 10 });
        gameStore.getState().panForGold();
        const { gold, panFilled } = gameStore.getState();
        expect(gold).toBeCloseTo(0.2, 10);
        expect(panFilled).toBeCloseTo(9, 10);
    });

    it('dustPanYield increases gold output', () => {
        // dustPanYield=2 → multiplier = 1 + 0.1*2 = 1.2 → gold = 0.2 * 1.2 = 0.24
        gameStore.setState({ panFilled: 10, dustPanYield: 2 });
        gameStore.getState().panForGold();
        expect(gameStore.getState().gold).toBeCloseTo(0.24, 10);
    });

    it('panSpeedUpgrades increases material consumed per click', () => {
        // panSpeedUpgrades=2 → clickAmount = 1 + 0.5*2 = 2 → gold = 2*0.2 = 0.4
        gameStore.setState({ panFilled: 10, panSpeedUpgrades: 2 });
        gameStore.getState().panForGold();
        expect(gameStore.getState().panFilled).toBeCloseTo(8, 10);
        expect(gameStore.getState().gold).toBeCloseTo(0.4, 10);
    });

    it('increments totalGoldExtracted by the amount panned', () => {
        gameStore.setState({ panFilled: 10, totalGoldExtracted: 5 });
        gameStore.getState().panForGold();
        const { totalGoldExtracted, gold } = gameStore.getState();
        expect(totalGoldExtracted).toBeCloseTo(5 + gold, 10);
    });

    it('adds a floating number for gold', () => {
        gameStore.setState({ panFilled: 10 });
        gameStore.getState().panForGold();
        const { floatingNumbers, gold } = gameStore.getState();
        expect(floatingNumbers).toHaveLength(1);
        expect(floatingNumbers[0].resource).toBe('gold');
        expect(floatingNumbers[0].amount).toBeCloseTo(gold, 10);
    });
});

// ─── sellGold ─────────────────────────────────────────────────────────────────

describe('sellGold', () => {
    it('does nothing when goldInPocket is 0', () => {
        gameStore.setState({ gold: 5, goldInPocket: 0, hasFurnace: false });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBe(0);
        expect(gameStore.getState().gold).toBe(5);
    });

    it('sells up to goldInPocket with smelting fee (no furnace)', () => {
        // gold=10, goldInPocket=3, goldPrice=1.0, fee=15% → 3*0.85=2.55
        gameStore.setState({ gold: 10, goldInPocket: 3, goldPrice: 1.0, hasFurnace: false, dustGoldValue: 0 });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBeCloseTo(2.55, 8);
        expect(gameStore.getState().gold).toBeCloseTo(7, 8);
        expect(gameStore.getState().goldInPocket).toBe(0);
    });

    it('sells goldBars up to goldInPocket at bar premium (hasFurnace)', () => {
        // goldBars=5, goldInPocket=5, goldPrice=1.0, barMultiplier=1.2 → 5*1.2=6.0
        gameStore.setState({ goldBars: 5, goldInPocket: 5, goldPrice: 1.0, hasFurnace: true, dustGoldValue: 0 });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBeCloseTo(6.0, 8);
        expect(gameStore.getState().goldBars).toBeCloseTo(0, 8);
    });

    it('does nothing when goldInPocket=0 with hasFurnace', () => {
        gameStore.setState({ goldBars: 5, goldInPocket: 0, hasFurnace: true });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBe(0);
    });

    it('applies dustGoldValue sell multiplier with furnace', () => {
        // dustGoldValue=2 → multiplier=1.2 → finalValue = 5*1.0*1.2*1.2 = 7.2
        gameStore.setState({ goldBars: 5, goldInPocket: 5, goldPrice: 1.0, hasFurnace: true, dustGoldValue: 2 });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBeCloseTo(7.2, 8);
    });

    it('updates runMoneyEarned, totalMoneyEarned, and peakRunMoney', () => {
        gameStore.setState({ goldBars: 5, goldInPocket: 5, goldPrice: 1.0, hasFurnace: true, dustGoldValue: 0, peakRunMoney: 0 });
        gameStore.getState().sellGold();
        const { runMoneyEarned, totalMoneyEarned, peakRunMoney } = gameStore.getState();
        // 5 bars * 1.0 * 1.2 bar multiplier = 6.0
        expect(runMoneyEarned).toBeCloseTo(6.0, 8);
        expect(totalMoneyEarned).toBeCloseTo(6.0, 8);
        expect(peakRunMoney).toBeCloseTo(6.0, 8);
    });
});

// ─── loadFurnace ──────────────────────────────────────────────────────────────

describe('loadFurnace', () => {
    it('does nothing without hasFurnace', () => {
        gameStore.setState({ gold: 5, hasFurnace: false });
        gameStore.getState().loadFurnace();
        expect(gameStore.getState().furnaceFilled).toBe(0);
        expect(gameStore.getState().gold).toBe(5);
    });

    it('does nothing when no gold', () => {
        gameStore.setState({ gold: 0, hasFurnace: true });
        gameStore.getState().loadFurnace();
        expect(gameStore.getState().furnaceFilled).toBe(0);
    });

    it('transfers gold into furnace up to capacity', () => {
        gameStore.setState({ gold: 5, hasFurnace: true, furnaceFilled: 0 });
        gameStore.getState().loadFurnace();
        const s = gameStore.getState();
        expect(s.furnaceFilled).toBeCloseTo(5, 8);
        expect(s.gold).toBeCloseTo(0, 8);
    });

    it('caps at FURNACE_CAPACITY', () => {
        // gold=20, furnaceFilled=0, FURNACE_CAPACITY=10 → transfer=10
        gameStore.setState({ gold: 20, hasFurnace: true, furnaceFilled: 0 });
        gameStore.getState().loadFurnace();
        const s = gameStore.getState();
        expect(s.furnaceFilled).toBe(10);
        expect(s.gold).toBeCloseTo(10, 8);
    });

    it('does nothing when furnace already full', () => {
        gameStore.setState({ gold: 5, hasFurnace: true, furnaceFilled: 10 });
        gameStore.getState().loadFurnace();
        expect(gameStore.getState().furnaceFilled).toBe(10);
        expect(gameStore.getState().gold).toBe(5);
    });
});

// ─── toggleFurnace ────────────────────────────────────────────────────────────

describe('toggleFurnace', () => {
    it('does nothing without hasFurnace', () => {
        gameStore.setState({ hasFurnace: false, furnaceFilled: 5, furnaceRunning: false });
        gameStore.getState().toggleFurnace();
        expect(gameStore.getState().furnaceRunning).toBe(false);
    });

    it('does nothing if furnace is empty', () => {
        gameStore.setState({ hasFurnace: true, furnaceFilled: 0, furnaceRunning: false });
        gameStore.getState().toggleFurnace();
        expect(gameStore.getState().furnaceRunning).toBe(false);
    });

    it('turns on when furnace has content', () => {
        gameStore.setState({ hasFurnace: true, furnaceFilled: 5, furnaceRunning: false });
        gameStore.getState().toggleFurnace();
        expect(gameStore.getState().furnaceRunning).toBe(true);
    });

    it('turns off when already running', () => {
        gameStore.setState({ hasFurnace: true, furnaceFilled: 5, furnaceRunning: true });
        gameStore.getState().toggleFurnace();
        expect(gameStore.getState().furnaceRunning).toBe(false);
    });
});

// ─── collectBars ──────────────────────────────────────────────────────────────

describe('collectBars', () => {
    it('does nothing when furnaceBars is 0', () => {
        gameStore.setState({ furnaceBars: 0, goldBars: 0 });
        gameStore.getState().collectBars();
        expect(gameStore.getState().goldBars).toBe(0);
    });

    it('moves furnaceBars to goldBars and resets furnaceBars', () => {
        gameStore.setState({ furnaceBars: 3.5, goldBars: 1.0 });
        gameStore.getState().collectBars();
        const s = gameStore.getState();
        expect(s.goldBars).toBeCloseTo(4.5, 8);
        expect(s.furnaceBars).toBe(0);
    });
});

// ─── reset (soft) ─────────────────────────────────────────────────────────────

describe('reset', () => {
    it('clears run resources and employees', () => {
        gameStore.setState({ gold: 5, money: 100, employees: [makeCommonEmployee('miner', 'M1')], hasSluiceBox: true });
        gameStore.getState().reset();
        const s = gameStore.getState();
        expect(s.gold).toBe(0);
        expect(s.money).toBe(0); // dustHeadStart=0 → $0 head start
        expect(s.employees).toEqual([]);
        expect(s.hasSluiceBox).toBe(false);
    });

    it('seeds money from dustHeadStart', () => {
        // dustHeadStart=2 → DUST_HEAD_START_AMOUNTS[2] = $75
        gameStore.setState({ dustHeadStart: 2 });
        gameStore.getState().reset();
        expect(gameStore.getState().money).toBe(DUST_HEAD_START_AMOUNTS[2]);
    });

    it('preserves timePlayed and darkMode', () => {
        gameStore.setState({ timePlayed: 9000, darkMode: true });
        gameStore.getState().reset();
        expect(gameStore.getState().timePlayed).toBe(9000);
        expect(gameStore.getState().darkMode).toBe(true);
    });

    it('preserves legacyDust, prestigeCount, and dust upgrades', () => {
        gameStore.setState({ legacyDust: 50, prestigeCount: 3, dustScoopBoost: 2, dustPanYield: 1 });
        gameStore.getState().reset();
        const s = gameStore.getState();
        expect(s.legacyDust).toBe(50);
        expect(s.prestigeCount).toBe(3);
        expect(s.dustScoopBoost).toBe(2);
        expect(s.dustPanYield).toBe(1);
    });

    it('resets vehicleTier and hasDriver', () => {
        gameStore.setState({ vehicleTier: 2, hasDriver: true });
        gameStore.getState().reset();
        expect(gameStore.getState().vehicleTier).toBe(0);
        expect(gameStore.getState().hasDriver).toBe(false);
    });
});

// ─── hardResetSave ────────────────────────────────────────────────────────────

describe('hardResetSave', () => {
    it('wipes all run, prestige, and dust state', () => {
        gameStore.setState({ legacyDust: 50, prestigeCount: 2, gold: 5, dustScoopBoost: 3, money: 100 });
        gameStore.getState().hardResetSave();
        const s = gameStore.getState();
        expect(s.legacyDust).toBe(0);
        expect(s.prestigeCount).toBe(0);
        expect(s.gold).toBe(0);
        expect(s.dustScoopBoost).toBe(0);
        expect(s.money).toBe(0);
    });

    it('resets timeScale to 1', () => {
        gameStore.getState().setTimeScale(3);
        gameStore.getState().hardResetSave();
        expect(gameStore.getState().timeScale).toBe(1);
    });

    it('calls localStorage.removeItem', () => {
        const removeSpy = vi.fn();
        vi.stubGlobal('localStorage', { removeItem: removeSpy, getItem: vi.fn(), setItem: vi.fn() });
        vi.stubGlobal('window', { localStorage: (globalThis as Record<string, unknown>).localStorage });
        gameStore.getState().hardResetSave();
        expect(removeSpy).toHaveBeenCalled();
    });
});

// ─── prestige ─────────────────────────────────────────────────────────────────

describe('prestige', () => {
    it('awards floor(sqrt(runMoneyEarned)) legacy dust', () => {
        gameStore.setState({ runMoneyEarned: 100, legacyDust: 5 });
        gameStore.getState().prestige();
        // sqrt(100) = 10, floor = 10, total = 5 + 10 = 15
        expect(gameStore.getState().legacyDust).toBe(15);
    });

    it('resets run fields to zero', () => {
        gameStore.setState({ gold: 5, money: 100, employees: [makeCommonEmployee('miner', 'M1')], hasSluiceBox: true });
        gameStore.getState().prestige();
        const s = gameStore.getState();
        expect(s.gold).toBe(0);
        expect(s.money).toBe(0); // dustHeadStart=0
        expect(s.employees).toEqual([]);
        expect(s.hasSluiceBox).toBe(false);
    });

    it('sets unlockedBanking to true', () => {
        gameStore.getState().prestige();
        expect(gameStore.getState().unlockedBanking).toBe(true);
    });

    it('increments prestigeCount', () => {
        gameStore.setState({ prestigeCount: 1 });
        gameStore.getState().prestige();
        expect(gameStore.getState().prestigeCount).toBe(2);
    });

    it('preserves dust upgrades', () => {
        gameStore.setState({ dustScoopBoost: 2, dustPanYield: 1, dustBucketSize: 3 });
        gameStore.getState().prestige();
        const s = gameStore.getState();
        expect(s.dustScoopBoost).toBe(2);
        expect(s.dustPanYield).toBe(1);
        expect(s.dustBucketSize).toBe(3);
    });

    it('updates peakRunMoney if run money exceeds it', () => {
        gameStore.setState({ runMoneyEarned: 500, peakRunMoney: 200 });
        gameStore.getState().prestige();
        expect(gameStore.getState().peakRunMoney).toBe(500);
    });

    it('resets money gear upgrades', () => {
        gameStore.setState({ bucketUpgrades: 2, panCapUpgrades: 1, panSpeedUpgrades: 3 });
        gameStore.getState().prestige();
        const s = gameStore.getState();
        expect(s.bucketUpgrades).toBe(0);
        expect(s.panCapUpgrades).toBe(0);
        expect(s.panSpeedUpgrades).toBe(0);
    });
});

// ─── addFloatingNumber ────────────────────────────────────────────────────────

describe('addFloatingNumber', () => {
    it('adds an entry to floatingNumbers', () => {
        gameStore.getState().addFloatingNumber('gold', 3.5);
        const { floatingNumbers } = gameStore.getState();
        expect(floatingNumbers).toHaveLength(1);
        expect(floatingNumbers[0].resource).toBe('gold');
        expect(floatingNumbers[0].amount).toBe(3.5);
    });

    it('removes entry after 1200ms', () => {
        vi.useFakeTimers();
        gameStore.getState().addFloatingNumber('money', 10);
        expect(gameStore.getState().floatingNumbers).toHaveLength(1);
        vi.advanceTimersByTime(1200);
        expect(gameStore.getState().floatingNumbers).toHaveLength(0);
        vi.useRealTimers();
    });
});

// ─── depositInvestment / withdrawInvestment ───────────────────────────────────

describe('investments', () => {
    it('depositInvestment deducts money and increases investment', () => {
        gameStore.setState({ money: 100 });
        const result = gameStore.getState().depositInvestment('safeBonds', 40);
        expect(result).toBe(true);
        expect(gameStore.getState().money).toBeCloseTo(60, 8);
        expect(gameStore.getState().investmentSafeBonds).toBe(40);
    });

    it('depositInvestment returns false when insufficient money', () => {
        gameStore.setState({ money: 10 });
        const result = gameStore.getState().depositInvestment('stocks', 50);
        expect(result).toBe(false);
        expect(gameStore.getState().money).toBe(10);
    });

    it('depositInvestment returns false for amount <= 0', () => {
        gameStore.setState({ money: 100 });
        expect(gameStore.getState().depositInvestment('highRisk', 0)).toBe(false);
    });

    it('withdrawInvestment returns money minus 5% penalty', () => {
        gameStore.setState({ investmentStocks: 100, money: 0 });
        const result = gameStore.getState().withdrawInvestment('stocks', 100);
        expect(result).toBe(true);
        expect(gameStore.getState().money).toBeCloseTo(100 * (1 - WITHDRAWAL_PENALTY), 8);
        expect(gameStore.getState().investmentStocks).toBe(0);
    });

    it('withdrawInvestment returns false when investment < amount', () => {
        gameStore.setState({ investmentSafeBonds: 10 });
        expect(gameStore.getState().withdrawInvestment('safeBonds', 50)).toBe(false);
    });
});

// Worker hiring (shovel, pan, sluiceWorker, furnaceWorker, etc.) was moved to
// Hiring Hall (#113). Those buyUpgrade branches are removed — no tests needed here.

// ─── buyUpgrade — equipment ───────────────────────────────────────────────────

describe('buyUpgrade equipment', () => {
    it('sluiceBox sets hasSluiceBox and deducts cost', () => {
        gameStore.setState({ money: 500 });
        expect(gameStore.getState().buyUpgrade('sluiceBox')).toBe(true);
        expect(gameStore.getState().hasSluiceBox).toBe(true);
        expect(gameStore.getState().money).toBeCloseTo(500 - EQUIPMENT.sluiceBox.cost, 8);
    });

    it('sluiceBox purchase is idempotent', () => {
        gameStore.setState({ money: 9999, hasSluiceBox: true });
        expect(gameStore.getState().buyUpgrade('sluiceBox')).toBe(false);
        expect(gameStore.getState().money).toBe(9999);
    });

    it('bucketUpgrade is capped at MAX_GEAR_UPGRADE_LEVEL', () => {
        gameStore.setState({ money: 9999, bucketUpgrades: MAX_GEAR_UPGRADE_LEVEL });
        expect(gameStore.getState().buyUpgrade('bucketUpgrade')).toBe(false);
    });

    it('panCapUpgrade is capped at MAX_GEAR_UPGRADE_LEVEL', () => {
        gameStore.setState({ money: 9999, panCapUpgrades: MAX_GEAR_UPGRADE_LEVEL });
        expect(gameStore.getState().buyUpgrade('panCapUpgrade')).toBe(false);
    });
});

// fireWorker removed — role assignment handled by #114.

// ─── buyVehicle / buyDriver ───────────────────────────────────────────────────

describe('buyVehicle and buyDriver', () => {
    it('buyVehicle tier 1 succeeds with sufficient money', () => {
        const cost = VEHICLE_TIERS[1].cost; // 150
        gameStore.setState({ money: 300, vehicleTier: 0 });
        expect(gameStore.getState().buyVehicle(1)).toBe(true);
        expect(gameStore.getState().vehicleTier).toBe(1);
        expect(gameStore.getState().money).toBeCloseTo(300 - cost, 8);
    });

    it('buyVehicle requires purchasing in order', () => {
        gameStore.setState({ money: 9999, vehicleTier: 0 });
        expect(gameStore.getState().buyVehicle(2)).toBe(false);
        expect(gameStore.getState().vehicleTier).toBe(0);
    });

    it('buyDriver requires vehicleTier >= 2', () => {
        gameStore.setState({ money: 9999, vehicleTier: 1, hasDriver: false });
        expect(gameStore.getState().buyDriver()).toBe(false);
    });

    it('buyDriver succeeds with vehicleTier >= 2 and sufficient money', () => {
        gameStore.setState({ money: 9999, vehicleTier: 2, hasDriver: false });
        expect(gameStore.getState().buyDriver()).toBe(true);
        expect(gameStore.getState().hasDriver).toBe(true);
        expect(gameStore.getState().money).toBeCloseTo(9999 - DRIVER_COST, 8);
    });
});

// ─── exportSave / importSave ──────────────────────────────────────────────────

describe('exportSave and importSave', () => {
    it('exportSave returns valid JSON with current schema version', () => {
        const json = gameStore.getState().exportSave();
        const parsed = JSON.parse(json);
        expect(parsed.version).toBe(29);
    });

    it('exportSave round-trips through importSave', () => {
        gameStore.setState({ money: 42, gold: 7, prestigeCount: 3 });
        const json = gameStore.getState().exportSave();
        gameStore.getState().reset();
        gameStore.getState().importSave(json);
        const s = gameStore.getState();
        expect(s.money).toBe(42);
        expect(s.gold).toBe(7);
        expect(s.prestigeCount).toBe(3);
    });

    it('importSave with v1 payload migrates correctly', () => {
        const v1 = JSON.stringify({ version: 1, dirtyGold: 5, pannedGold: 2, tickCount: 10, timeScale: 1 });
        gameStore.getState().importSave(v1);
        const s = gameStore.getState();
        expect(s.paydirt).toBe(5);
        expect(s.gold).toBe(2);
    });
});

// ─── emptyBucket (direct pan path) ────────────────────────────────────────────

describe('emptyBucket — direct pan path (no sluice)', () => {
    it('empties bucket into pan when entire bucket fits exactly', () => {
        // panFilled=10, bucketFilled=10, panCap=20 → 10+10=20 ≤ 20 → allowed
        gameStore.setState({ bucketFilled: 10, panFilled: 10, hasSluiceBox: false, unlockedPanning: true });
        gameStore.getState().emptyBucket();
        expect(gameStore.getState().panFilled).toBe(20);
        expect(gameStore.getState().bucketFilled).toBe(0);
    });

    it('empties bucket into pan when pan has more than enough room', () => {
        gameStore.setState({ bucketFilled: 5, panFilled: 0, hasSluiceBox: false, unlockedPanning: true });
        gameStore.getState().emptyBucket();
        expect(gameStore.getState().panFilled).toBe(5);
        expect(gameStore.getState().bucketFilled).toBe(0);
    });

    it('blocks empty bucket when bucket would overflow pan', () => {
        // panFilled=15, bucketFilled=10, panCap=20 → 15+10=25 > 20 → blocked
        gameStore.setState({ bucketFilled: 10, panFilled: 15, hasSluiceBox: false, unlockedPanning: true });
        gameStore.getState().emptyBucket();
        expect(gameStore.getState().panFilled).toBe(15); // unchanged
        expect(gameStore.getState().bucketFilled).toBe(10); // unchanged
    });

    it('blocks empty bucket when pan is full', () => {
        gameStore.setState({ bucketFilled: 5, panFilled: 20, hasSluiceBox: false, unlockedPanning: true });
        gameStore.getState().emptyBucket();
        expect(gameStore.getState().panFilled).toBe(20);
        expect(gameStore.getState().bucketFilled).toBe(5);
    });

    it('does nothing when bucket is empty', () => {
        gameStore.setState({ bucketFilled: 0, panFilled: 5, hasSluiceBox: false });
        gameStore.getState().emptyBucket();
        expect(gameStore.getState().panFilled).toBe(5);
    });

    it('transfers richDirtInBucket to richDirtInSluice when emptying to sluice', () => {
        gameStore.setState({ bucketFilled: 5, richDirtInBucket: 3, hasSluiceBox: true, sluiceBoxFilled: 0, unlockedPanning: true });
        gameStore.getState().emptyBucket();
        expect(gameStore.getState().sluiceBoxFilled).toBe(5);
        expect(gameStore.getState().richDirtInSluice).toBe(3);
        expect(gameStore.getState().richDirtInBucket).toBe(0);
        expect(gameStore.getState().bucketFilled).toBe(0);
    });

    it('resets richDirtInBucket to 0 when emptying to pan (no sluice)', () => {
        gameStore.setState({ bucketFilled: 5, richDirtInBucket: 2, hasSluiceBox: false, panFilled: 0, unlockedPanning: true });
        gameStore.getState().emptyBucket();
        expect(gameStore.getState().panFilled).toBe(5);
        expect(gameStore.getState().richDirtInBucket).toBe(0);
    });
});

// ─── detectPatch ──────────────────────────────────────────────────────────────

describe('detectPatch', () => {
    it('does nothing without a metal detector', () => {
        gameStore.setState({ hasMetalDetector: false, detectProgress: 0, detectTarget: 0 });
        gameStore.getState().detectPatch();
        expect(gameStore.getState().detectProgress).toBe(0);
        expect(gameStore.getState().patchActive).toBe(false);
    });

    it('does nothing when a patch is already active', () => {
        gameStore.setState({ hasMetalDetector: true, patchActive: true, detectProgress: 0, detectTarget: 5 });
        gameStore.getState().detectPatch();
        expect(gameStore.getState().detectProgress).toBe(0); // unchanged
    });

    it('rolls a random detectTarget on first click and advances progress', () => {
        gameStore.setState({ hasMetalDetector: true, patchActive: false, detectProgress: 0, detectTarget: 0, dustDetectRate: 0, hasMotherlode: false });
        gameStore.getState().detectPatch();
        const { detectTarget, detectProgress } = gameStore.getState();
        expect(detectTarget).toBeGreaterThanOrEqual(DETECT_TARGET_MIN);
        expect(detectTarget).toBeLessThanOrEqual(DETECT_TARGET_MAX);
        expect(detectProgress).toBeCloseTo(DETECT_PROGRESS_PER_CLICK, 5);
    });

    it('dustDetectRate increases progress per click', () => {
        gameStore.setState({ hasMetalDetector: true, patchActive: false, detectProgress: 0, detectTarget: 100, dustDetectRate: 2, hasMotherlode: false });
        gameStore.getState().detectPatch();
        expect(gameStore.getState().detectProgress).toBeCloseTo(DETECT_PROGRESS_PER_CLICK + 2, 5);
    });

    it('discovers a patch when progress reaches target', () => {
        // Set target to 1 so a single click completes the search
        gameStore.setState({ hasMetalDetector: true, patchActive: false, detectProgress: 0, detectTarget: 1, dustDetectRate: 0, dustSpotCap: 0, hasMotherlode: false });
        gameStore.getState().detectPatch();
        const { patchActive, patchRemaining, patchCapacity, detectProgress, detectTarget } = gameStore.getState();
        expect(patchActive).toBe(true);
        expect(patchRemaining).toBeGreaterThanOrEqual(PATCH_CAPACITY_MIN);
        expect(patchRemaining).toBeLessThanOrEqual(PATCH_CAPACITY_MAX);
        expect(patchCapacity).toBe(patchRemaining);
        expect(detectProgress).toBe(0);
        expect(detectTarget).toBe(0);
    });
});

// ─── scoopDirt with active patch ─────────────────────────────────────────────

describe('scoopDirt with active patch', () => {
    it('scoops rich dirt and decrements patchRemaining when patch is active', () => {
        gameStore.setState({ patchActive: true, patchRemaining: 10, patchCapacity: 10, bucketFilled: 0, richDirtInBucket: 0, scoopPower: 1, dustScoopBoost: 0 });
        gameStore.getState().scoopDirt();
        const { patchRemaining, patchActive, richDirtInBucket, bucketFilled } = gameStore.getState();
        expect(bucketFilled).toBeCloseTo(1, 5);
        expect(richDirtInBucket).toBeCloseTo(1, 5);
        expect(patchRemaining).toBeCloseTo(9, 5);
        expect(patchActive).toBe(true);
    });

    it('deactivates patch when patchRemaining reaches 0', () => {
        gameStore.setState({ patchActive: true, patchRemaining: 0.5, patchCapacity: 10, bucketFilled: 0, richDirtInBucket: 0, scoopPower: 1, dustScoopBoost: 0 });
        gameStore.getState().scoopDirt();
        expect(gameStore.getState().patchActive).toBe(false);
        expect(gameStore.getState().patchRemaining).toBe(0);
    });

    it('scoops normal dirt when patch is not active', () => {
        gameStore.setState({ patchActive: false, patchRemaining: 0, bucketFilled: 0, richDirtInBucket: 0, scoopPower: 1, dustScoopBoost: 0 });
        gameStore.getState().scoopDirt();
        expect(gameStore.getState().richDirtInBucket).toBe(0);
        expect(gameStore.getState().bucketFilled).toBeCloseTo(1, 5);
    });
});
