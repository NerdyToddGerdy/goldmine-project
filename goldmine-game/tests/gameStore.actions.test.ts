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
    getUpgradeCost,
    getEffectivePanClickAmount,
    MAX_GEAR_UPGRADE_LEVEL,
    BUCKET_UPGRADE_COSTS,
    WITHDRAWAL_PENALTY,
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
    it('does nothing when panFilled < 1', () => {
        gameStore.setState({ panFilled: 0.5 });
        gameStore.getState().panForGold();
        expect(gameStore.getState().gold).toBe(0);
        expect(gameStore.getState().panFilled).toBe(0.5);
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
        gameStore.setState({ gold: 5, goldInPocket: 0 });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBe(0);
        expect(gameStore.getState().gold).toBe(5);
    });

    it('sells up to goldInPocket with smelting fee', () => {
        // gold=10, goldInPocket=3, goldPrice=1.0, no furnace
        // baseValue=3, fee=3*0.15=0.45, finalValue=2.55
        gameStore.setState({ gold: 10, goldInPocket: 3, goldPrice: 1.0, hasFurnace: false, dustGoldValue: 0 });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBeCloseTo(2.55, 8);
        expect(gameStore.getState().gold).toBeCloseTo(7, 8);
        expect(gameStore.getState().goldInPocket).toBe(0);
    });

    it('waives smelting fee with hasFurnace', () => {
        gameStore.setState({ gold: 5, goldInPocket: 5, goldPrice: 1.0, hasFurnace: true, dustGoldValue: 0 });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBeCloseTo(5.0, 8);
    });

    it('applies dustGoldValue sell multiplier', () => {
        // dustGoldValue=2 → multiplier = 1 + 0.1*2 = 1.2 → finalValue = 5 * 1.2 = 6.0
        gameStore.setState({ gold: 5, goldInPocket: 5, goldPrice: 1.0, hasFurnace: true, dustGoldValue: 2 });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBeCloseTo(6.0, 8);
    });

    it('applies goldPrice multiplier', () => {
        gameStore.setState({ gold: 4, goldInPocket: 4, goldPrice: 1.5, hasFurnace: true, dustGoldValue: 0 });
        gameStore.getState().sellGold();
        expect(gameStore.getState().money).toBeCloseTo(6.0, 8);
    });

    it('updates runMoneyEarned, totalMoneyEarned, and peakRunMoney', () => {
        gameStore.setState({ gold: 5, goldInPocket: 5, goldPrice: 1.0, hasFurnace: true, dustGoldValue: 0, peakRunMoney: 0 });
        gameStore.getState().sellGold();
        const { runMoneyEarned, totalMoneyEarned, peakRunMoney } = gameStore.getState();
        expect(runMoneyEarned).toBeCloseTo(5, 8);
        expect(totalMoneyEarned).toBeCloseTo(5, 8);
        expect(peakRunMoney).toBeCloseTo(5, 8);
    });
});

// ─── reset (soft) ─────────────────────────────────────────────────────────────

describe('reset', () => {
    it('clears run resources and workers', () => {
        gameStore.setState({ gold: 5, money: 100, shovels: 3, hasSluiceBox: true, sluiceWorkers: 2 });
        gameStore.getState().reset();
        const s = gameStore.getState();
        expect(s.gold).toBe(0);
        expect(s.money).toBe(0); // dustHeadStart=0 → $0 head start
        expect(s.shovels).toBe(0);
        expect(s.hasSluiceBox).toBe(false);
        expect(s.sluiceWorkers).toBe(0);
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
        gameStore.setState({ gold: 5, money: 100, shovels: 3, hasSluiceBox: true });
        gameStore.getState().prestige();
        const s = gameStore.getState();
        expect(s.gold).toBe(0);
        expect(s.money).toBe(0); // dustHeadStart=0
        expect(s.shovels).toBe(0);
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

// ─── buyUpgrade — workers ─────────────────────────────────────────────────────

describe('buyUpgrade workers', () => {
    it('shovel deducts cost and increments shovels', () => {
        const cost = getUpgradeCost('shovel', 0); // Math.floor(10 * 1.15^0) = 10
        gameStore.setState({ money: 100 });
        const result = gameStore.getState().buyUpgrade('shovel');
        expect(result).toBe(true);
        expect(gameStore.getState().shovels).toBe(1);
        expect(gameStore.getState().money).toBeCloseTo(100 - cost, 8);
    });

    it('shovel cost scales exponentially', () => {
        gameStore.setState({ money: 9999 });
        const c0 = getUpgradeCost('shovel', 0);
        const c1 = getUpgradeCost('shovel', 1);
        const c2 = getUpgradeCost('shovel', 2);
        expect(c0).toBe(10);
        expect(c1).toBe(11); // floor(10 * 1.15) = 11
        expect(c2).toBe(13); // floor(10 * 1.15^2) = floor(13.225) = 13
        gameStore.getState().buyUpgrade('shovel');
        gameStore.getState().buyUpgrade('shovel');
        gameStore.getState().buyUpgrade('shovel');
        expect(gameStore.getState().shovels).toBe(3);
        expect(gameStore.getState().money).toBeCloseTo(9999 - c0 - c1 - c2, 8);
    });

    it('sluiceWorker requires hasSluiceBox', () => {
        gameStore.setState({ money: 1000, hasSluiceBox: false });
        expect(gameStore.getState().buyUpgrade('sluiceWorker')).toBe(false);
        expect(gameStore.getState().sluiceWorkers).toBe(0);
    });

    it('sluiceWorker succeeds when hasSluiceBox', () => {
        gameStore.setState({ money: 1000, hasSluiceBox: true });
        expect(gameStore.getState().buyUpgrade('sluiceWorker')).toBe(true);
        expect(gameStore.getState().sluiceWorkers).toBe(1);
    });

    it('ovenWorker requires hasOven', () => {
        gameStore.setState({ money: 9999, hasOven: false });
        expect(gameStore.getState().buyUpgrade('ovenWorker')).toBe(false);
    });

    it('furnaceWorker requires hasFurnace', () => {
        gameStore.setState({ money: 9999, hasFurnace: false });
        expect(gameStore.getState().buyUpgrade('furnaceWorker')).toBe(false);
    });
});

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

    it('autoEmpty sets hasAutoEmpty and deducts cost', () => {
        gameStore.setState({ money: 200 });
        expect(gameStore.getState().buyUpgrade('autoEmpty')).toBe(true);
        expect(gameStore.getState().hasAutoEmpty).toBe(true);
        expect(gameStore.getState().money).toBeCloseTo(200 - EQUIPMENT.autoEmpty.cost, 8);
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

// ─── fireWorker ───────────────────────────────────────────────────────────────

describe('fireWorker', () => {
    it('decrements shovel count and returns true', () => {
        gameStore.setState({ shovels: 3 });
        expect(gameStore.getState().fireWorker('shovel')).toBe(true);
        expect(gameStore.getState().shovels).toBe(2);
    });

    it('returns false when count is already 0', () => {
        gameStore.setState({ shovels: 0 });
        expect(gameStore.getState().fireWorker('shovel')).toBe(false);
    });

    it('works for all worker types', () => {
        gameStore.setState({ pans: 2, sluiceWorkers: 1, ovenWorkers: 1, furnaceWorkers: 1, bankerWorkers: 1 });
        for (const type of ['pan', 'sluiceWorker', 'ovenWorker', 'furnaceWorker', 'bankerWorker']) {
            expect(gameStore.getState().fireWorker(type)).toBe(true);
        }
    });
});

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
        expect(parsed.version).toBe(22);
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
