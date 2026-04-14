import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    gameStore,
    generateEmployee,
    HIRE_COSTS,
    getHireCost,
} from '../src/store/gameStore';
import type { Employee } from '../src/store/schema';

beforeEach(() => {
    vi.stubGlobal('localStorage', { removeItem: vi.fn(), getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() });
    vi.stubGlobal('window', { localStorage: (globalThis as Record<string, unknown>).localStorage });
    vi.stubGlobal('document', { documentElement: { classList: { add: vi.fn(), remove: vi.fn() } } });
    gameStore.getState().hardResetSave();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

// ─── generateEmployee ─────────────────────────────────────────────────────────

describe('generateEmployee', () => {
    it('returns an employee with valid rarity, no stats field, fresh xpByRole', () => {
        const emp = generateEmployee();
        expect(['common', 'uncommon', 'rare', 'epic', 'legendary']).toContain(emp.rarity);
        expect('stats' in emp).toBe(false);
        expect(emp.xpByRole).toEqual({});
        expect(emp.assignedRole).toBeNull();
        expect(emp.id).toBeTruthy();
    });

    it('generates unique IDs', () => {
        const ids = new Set(Array.from({ length: 20 }, () => generateEmployee().id));
        expect(ids.size).toBe(20);
    });
});

// ─── getHireCost ─────────────────────────────────────────────────────────────

describe('getHireCost', () => {
    it('returns the correct cost for each rarity', () => {
        for (const rarity of ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const) {
            const emp: Employee = { id: 'x', name: 'Test', rarity, xpByRole: {}, assignedRole: null };
            expect(getHireCost(emp)).toBe(HIRE_COSTS[rarity]);
        }
    });
});

// ─── refreshDraftPool ─────────────────────────────────────────────────────────

describe('refreshDraftPool', () => {
    it('populates pool for free when pool is empty', () => {
        gameStore.setState({ draftPool: [], gold: 0, npcLevels: { trader: 0, tavernKeeper: 2, assayer: 0, blacksmith: 0 } });
        const result = gameStore.getState().refreshDraftPool();
        expect(result).toBe(true);
        expect(gameStore.getState().draftPool).toHaveLength(4);
        expect(gameStore.getState().gold).toBe(0); // free
    });

    it('deducts cost when pool is not empty', () => {
        // put one employee in draft pool so it's non-empty
        const emp = generateEmployee();
        gameStore.setState({ draftPool: [emp], gold: 100, draftPoolRefreshCost: 10, npcLevels: { trader: 0, tavernKeeper: 2, assayer: 0, blacksmith: 0 } });
        gameStore.getState().refreshDraftPool();
        expect(gameStore.getState().gold).toBe(90);
        expect(gameStore.getState().draftPool).toHaveLength(4);
    });

    it('returns false and does not charge when insufficient funds', () => {
        const emp = generateEmployee();
        gameStore.setState({ draftPool: [emp], gold: 5, draftPoolRefreshCost: 10 });
        const result = gameStore.getState().refreshDraftPool();
        expect(result).toBe(false);
        expect(gameStore.getState().draftPool).toHaveLength(1);
        expect(gameStore.getState().gold).toBe(5);
    });
});

// ─── hireEmployee ─────────────────────────────────────────────────────────────

describe('hireEmployee', () => {
    it('moves employee from draftPool to employees and deducts cost', () => {
        const emp = generateEmployee();
        emp.rarity = 'common'; // ensure known cost
        const cost = HIRE_COSTS.common;
        gameStore.setState({ draftPool: [emp], employees: [], gold: cost + 50 });

        const result = gameStore.getState().hireEmployee(emp.id);

        expect(result).toBe(true);
        expect(gameStore.getState().draftPool).toHaveLength(0);
        expect(gameStore.getState().employees).toHaveLength(1);
        expect(gameStore.getState().employees[0].id).toBe(emp.id);
        expect(gameStore.getState().gold).toBe(50);
    });

    it('returns false when insufficient funds', () => {
        const emp = generateEmployee();
        emp.rarity = 'common';
        gameStore.setState({ draftPool: [emp], employees: [], gold: 0 });

        const result = gameStore.getState().hireEmployee(emp.id);

        expect(result).toBe(false);
        expect(gameStore.getState().draftPool).toHaveLength(1);
        expect(gameStore.getState().employees).toHaveLength(0);
    });

    it('returns false when employeeId not in draftPool', () => {
        gameStore.setState({ draftPool: [], employees: [], money: 999 });
        const result = gameStore.getState().hireEmployee('nonexistent');
        expect(result).toBe(false);
    });
});

// ─── dismissEmployee ──────────────────────────────────────────────────────────

describe('dismissEmployee', () => {
    it('removes employee from employees array', () => {
        const emp = generateEmployee();
        gameStore.setState({ employees: [emp] });

        gameStore.getState().dismissEmployee(emp.id);

        expect(gameStore.getState().employees).toHaveLength(0);
    });

    it('does nothing for unknown id', () => {
        const emp = generateEmployee();
        gameStore.setState({ employees: [emp] });

        gameStore.getState().dismissEmployee('unknown');

        expect(gameStore.getState().employees).toHaveLength(1);
    });
});

// ─── assignEmployee ───────────────────────────────────────────────────────────

describe('assignEmployee', () => {
    it('assigns an unassigned employee to a role', () => {
        const emp = generateEmployee();
        emp.assignedRole = null;
        gameStore.setState({ employees: [emp], roleSlots: { miner: 1, hauler: 1, prospector: 1, sluiceOperator: 1, furnaceOperator: 1, detectorOperator: 1, certifier: 1, driller: 1, refiner: 1 } });

        const result = gameStore.getState().assignEmployee(emp.id, 'miner');

        expect(result).toBe(true);
        expect(gameStore.getState().employees[0].assignedRole).toBe('miner');
    });

    it('returns false when employee is already assigned', () => {
        const emp = generateEmployee();
        emp.assignedRole = 'hauler';
        gameStore.setState({ employees: [emp], roleSlots: { miner: 1, hauler: 1, prospector: 1, sluiceOperator: 1, furnaceOperator: 1, detectorOperator: 1, certifier: 1, driller: 1, refiner: 1 } });

        const result = gameStore.getState().assignEmployee(emp.id, 'miner');

        expect(result).toBe(false);
    });

    it('returns false when role slots are full', () => {
        // Fill all 1 miner slot
        const emp1 = { ...generateEmployee(), id: 'e1', assignedRole: 'miner' as const };
        const emp2 = { ...generateEmployee(), id: 'e2', assignedRole: null };
        gameStore.setState({
            employees: [emp1, emp2],
            roleSlots: { miner: 1, hauler: 1, prospector: 1, sluiceOperator: 1, furnaceOperator: 1, detectorOperator: 1, certifier: 1, driller: 1, refiner: 1 },
        });

        const result = gameStore.getState().assignEmployee('e2', 'miner');

        expect(result).toBe(false);
    });
});

// ─── unassignEmployee ─────────────────────────────────────────────────────────

describe('unassignEmployee', () => {
    it('clears assignedRole to null', () => {
        const emp = generateEmployee();
        emp.assignedRole = 'miner';
        gameStore.setState({ employees: [emp] });

        gameStore.getState().unassignEmployee(emp.id);

        expect(gameStore.getState().employees[0].assignedRole).toBeNull();
    });
});

// ─── buyRoleSlot ──────────────────────────────────────────────────────────────

import { ROLE_SLOT_COSTS, DEFAULT_ROLE_SLOTS } from '../src/store/gameStore';

describe('buyRoleSlot', () => {
    it('returns false when insufficient gold', () => {
        const cost = ROLE_SLOT_COSTS.miner[0]; // first slot upgrade cost
        gameStore.setState({ gold: cost - 1 });
        expect(gameStore.getState().buyRoleSlot('miner')).toBe(false);
        expect(gameStore.getState().roleSlots.miner).toBe(DEFAULT_ROLE_SLOTS.miner);
    });

    it('buys a slot, deducts gold, increments slot count', () => {
        const cost = ROLE_SLOT_COSTS.miner[0];
        gameStore.setState({ gold: cost + 50 });
        const result = gameStore.getState().buyRoleSlot('miner');
        expect(result).toBe(true);
        expect(gameStore.getState().roleSlots.miner).toBe(DEFAULT_ROLE_SLOTS.miner + 1);
        expect(gameStore.getState().gold).toBe(50);
    });

    it('costs increase for each additional slot', () => {
        gameStore.setState({ gold: 99999 });
        gameStore.getState().buyRoleSlot('miner'); // slot 2
        gameStore.getState().buyRoleSlot('miner'); // slot 3
        expect(gameStore.getState().roleSlots.miner).toBe(DEFAULT_ROLE_SLOTS.miner + 2);
        const spent = 99999 - gameStore.getState().gold;
        expect(spent).toBe(ROLE_SLOT_COSTS.miner[0] + ROLE_SLOT_COSTS.miner[1]);
    });

    it('returns false when slot max is reached', () => {
        gameStore.setState({ gold: 99999 });
        const maxExtra = ROLE_SLOT_COSTS.miner.length;
        for (let i = 0; i < maxExtra; i++) gameStore.getState().buyRoleSlot('miner');
        expect(gameStore.getState().buyRoleSlot('miner')).toBe(false);
        expect(gameStore.getState().roleSlots.miner).toBe(DEFAULT_ROLE_SLOTS.miner + maxExtra);
    });
});
