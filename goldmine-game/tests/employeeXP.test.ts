import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    gameStore,
    getEmployeeLevel,
    computeEmployeeStats,
    STAT_BASE,
    EMPLOYEE_LEVEL_CAPS,
    EMPLOYEE_XP_RATE,
    FIXED_DT_MS,
    generateEmployee,
} from '../src/store/gameStore';
import type { Rarity } from '../src/store/schema';

beforeEach(() => {
    vi.stubGlobal('localStorage', { removeItem: vi.fn(), getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() });
    vi.stubGlobal('window', { localStorage: (globalThis as Record<string, unknown>).localStorage });
    vi.stubGlobal('document', { documentElement: { classList: { add: vi.fn(), remove: vi.fn() } } });
    gameStore.getState().hardResetSave();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// ─── getEmployeeLevel ─────────────────────────────────────────────────────────

describe('getEmployeeLevel', () => {
    it('returns 0 for 0 XP', () => {
        expect(getEmployeeLevel(0, 'common')).toBe(0);
    });

    it('level 1 requires 10 XP', () => {
        expect(getEmployeeLevel(9, 'common')).toBe(0);
        expect(getEmployeeLevel(10, 'common')).toBe(1);
    });

    it('level 2 requires 40 XP', () => {
        expect(getEmployeeLevel(39, 'common')).toBe(1);
        expect(getEmployeeLevel(40, 'common')).toBe(2);
    });

    it('uses floor(sqrt(xp/10)) formula', () => {
        // level = floor(sqrt(xp/10))
        // level 3: floor(sqrt(90/10)) = floor(3) = 3 → needs xp=90
        expect(getEmployeeLevel(90, 'common')).toBe(3);
        expect(getEmployeeLevel(89, 'common')).toBe(2);
    });
});

// ─── EMPLOYEE_LEVEL_CAPS ──────────────────────────────────────────────────────

describe('EMPLOYEE_LEVEL_CAPS', () => {
    const expected: Record<Rarity, number> = {
        common: 10, uncommon: 15, rare: 20, epic: 25, legendary: 30,
    };

    for (const [rarity, cap] of Object.entries(expected) as [Rarity, number][]) {
        it(`${rarity} cap is ${cap}`, () => {
            expect(EMPLOYEE_LEVEL_CAPS[rarity]).toBe(cap);
        });
    }
});

describe('getEmployeeLevel cap enforcement', () => {
    it('never exceeds the rarity cap', () => {
        const highXp = 999_999;
        expect(getEmployeeLevel(highXp, 'common')).toBe(10);
        expect(getEmployeeLevel(highXp, 'uncommon')).toBe(15);
        expect(getEmployeeLevel(highXp, 'rare')).toBe(20);
        expect(getEmployeeLevel(highXp, 'epic')).toBe(25);
        expect(getEmployeeLevel(highXp, 'legendary')).toBe(30);
    });

    it('level exactly at cap is allowed', () => {
        // Common cap = 10; xp for level 10 = 10^2 * 10 = 1000
        expect(getEmployeeLevel(1000, 'common')).toBe(10);
        // xp above that is still capped at 10
        expect(getEmployeeLevel(1001, 'common')).toBe(10);
    });
});

// ─── XP gain per tick ─────────────────────────────────────────────────────────

describe('XP gain in _fixedTick', () => {
    it('assigned miner gains 1 XP per tick when bucket has space', () => {
        const emp = generateEmployee();
        emp.assignedRole = 'miner';
        emp.xpByRole = {};
        gameStore.setState({
            employees: [emp],
            gold: 9999,
            bucketFilled: 0,
        });

        gameStore.getState().stepSimulation(FIXED_DT_MS);

        const updated = gameStore.getState().employees[0];
        expect(updated.xpByRole['miner']).toBeCloseTo(EMPLOYEE_XP_RATE, 6);
    });

    it('idle miner (bucket full) does not gain XP', () => {
        const emp = generateEmployee();
        emp.assignedRole = 'miner';
        emp.xpByRole = {};
        const bucketCap = 10; // BUCKET_CAPACITY default
        gameStore.setState({
            employees: [emp],
            gold: 9999,
            bucketFilled: bucketCap, // bucket full → miners idle
            dustBucketSize: 0,
            bucketUpgrades: 0,
        });

        gameStore.getState().stepSimulation(FIXED_DT_MS);

        const updated = gameStore.getState().employees[0];
        expect(updated.xpByRole['miner'] ?? 0).toBe(0);
    });

    it('unassigned employee does not gain XP', () => {
        const emp = generateEmployee();
        emp.assignedRole = null;
        emp.xpByRole = {};
        gameStore.setState({ employees: [emp], gold: 9999 });

        gameStore.getState().stepSimulation(FIXED_DT_MS);

        const updated = gameStore.getState().employees[0];
        expect(Object.keys(updated.xpByRole)).toHaveLength(0);
    });

    it('XP does not exceed level cap for common (10 → xp=1000)', () => {
        const emp = generateEmployee();
        emp.rarity = 'common';
        emp.assignedRole = 'miner';
        // XP for level 10 (cap) = 10^2 * 10 = 1000; set to cap already
        emp.xpByRole = { miner: 1000 };
        gameStore.setState({ employees: [emp], gold: 9999, bucketFilled: 0 });

        gameStore.getState().stepSimulation(FIXED_DT_MS);

        const updated = gameStore.getState().employees[0];
        // should not gain XP past cap
        expect(updated.xpByRole['miner']).toBe(1000);
    });
});

// ─── XP preserved on reassignment ─────────────────────────────────────────────

describe('XP preserved on role reassignment', () => {
    it('unassigning does not clear XP', () => {
        const emp = generateEmployee();
        emp.assignedRole = 'miner';
        emp.xpByRole = { miner: 50 };
        gameStore.setState({ employees: [emp] });

        gameStore.getState().unassignEmployee(emp.id);

        const updated = gameStore.getState().employees[0];
        expect(updated.assignedRole).toBeNull();
        expect(updated.xpByRole['miner']).toBe(50);
    });

    it('assigning to a new role starts at 0 for that role, old XP preserved', () => {
        const emp = generateEmployee();
        emp.assignedRole = null;
        emp.xpByRole = { miner: 50 };
        gameStore.setState({
            employees: [emp],
            roleSlots: { miner: 5, hauler: 3, prospector: 5, sluiceOperator: 3, furnaceOperator: 2, detectorOperator: 2 },
        });

        gameStore.getState().assignEmployee(emp.id, 'hauler');

        const updated = gameStore.getState().employees[0];
        expect(updated.assignedRole).toBe('hauler');
        expect(updated.xpByRole['miner']).toBe(50);
        expect(updated.xpByRole['hauler'] ?? 0).toBe(0);
    });
});

// ─── computeEmployeeStats ─────────────────────────────────────────────────────

describe('computeEmployeeStats', () => {
    it('fresh common employee has all stats at 1', () => {
        const emp = generateEmployee();
        emp.rarity = 'common';
        emp.xpByRole = {};
        const stats = computeEmployeeStats(emp);
        expect(stats.brawn).toBe(STAT_BASE['common']);
        expect(stats.dexterity).toBe(STAT_BASE['common']);
        expect(stats.technical).toBe(STAT_BASE['common']);
        expect(stats.hustle).toBe(STAT_BASE['common']);
    });

    it('common miner at level 5 has brawn=6, hustle=2', () => {
        const emp = generateEmployee();
        emp.rarity = 'common';
        // XP for level 5 = 5^2 * 10 = 250
        emp.xpByRole = { miner: 250 };
        const stats = computeEmployeeStats(emp);
        expect(stats.brawn).toBe(1 + 5);     // base 1 + level 5
        expect(stats.hustle).toBe(1 + 1);    // base 1 + floor(5/5)=1
        expect(stats.dexterity).toBe(1);     // no prospector XP
        expect(stats.technical).toBe(1);     // no tech-role XP
    });

    it('rare starts at base 3', () => {
        const emp = generateEmployee();
        emp.rarity = 'rare';
        emp.xpByRole = {};
        const stats = computeEmployeeStats(emp);
        expect(stats.brawn).toBe(3);
        expect(stats.hustle).toBe(3);
    });

    it('hustle grows from total levels across all roles', () => {
        const emp = generateEmployee();
        emp.rarity = 'common';
        // L3 miner (xp=90) + L2 prospector (xp=40) = 5 total levels → +1 hustle
        emp.xpByRole = { miner: 90, prospector: 40 };
        const stats = computeEmployeeStats(emp);
        expect(stats.hustle).toBe(1 + 1); // base + floor(5/5)
    });
});
