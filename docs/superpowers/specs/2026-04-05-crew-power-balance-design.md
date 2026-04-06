# Crew Power Balance — Design Spec
**Date:** 2026-04-05  
**Version target:** v1.27.1 (patch)

---

## Problem

With the v1.27 stat-driven leveling system, a fully-staffed legendary crew is 27× more powerful than a fresh common crew. In practice this means:

- Gold floods in so fast the economy breaks (nothing left to spend it on)
- Everything runs itself — no meaningful decisions remain for the player
- Mid-game upgrades become irrelevant before the player can act on them

The root causes are two independent issues in `gameStore.ts`:

1. **Linear stat → power formula**: `power = brawn × 0.5 + hustle × 0.25` scales 27× from Common L0 (brawn=1) to Legendary L30 (brawn=35).
2. **Uncapped extraction rate**: `extractionRate = 0.2 + sluiceOpPower × SLUICE_EXTRACTION_RATE × sluiceGear` has no ceiling, producing extraction multipliers of 5× or more at max crew.

---

## Goal

Legendary L30 crew should feel **meaningfully better** than Common L0 — approximately **3–5×**, not 27×. Every level should still feel worthwhile. The fix must not disrupt early-game feel.

---

## Design

### Change 1 — Soft curve on stat → power (sqrt)

**File:** `goldmine-game/src/store/gameStore.ts` — `getEmployeeRolePower()`

Replace the linear stat weights with square-root-scaled weights:

```ts
// Before
const { brawn, dexterity, technical, hustle } = computeEmployeeStats(e);
return brawn * 0.5 + hustle * 0.25;

// After
const { brawn, dexterity, technical, hustle } = computeEmployeeStats(e);
return Math.sqrt(brawn) * 0.5 + Math.sqrt(hustle) * 0.25;
```

Same structure applies to the `prospector` and technical role cases.

**Effect on power values:**

| Employee | Brawn | Power (before) | Power (after) |
|---|---|---|---|
| Common L0 | 1 | 0.75 | 0.75 |
| Common L10 | 11 | 6.25 | 2.09 |
| Legendary L30 | 35 | 20.25 | 3.79 |

- L0 power is **identical** (`sqrt(1) = 1`) — no rate constant changes needed
- Top-to-bottom ratio: 27× → **~5×**
- 5 Legendary L30 miners fill a max-upgrade bucket in ~0.4 seconds (not instant)

### Change 2 — Extraction rate hard cap

**File:** `goldmine-game/src/store/gameStore.ts`

Add a new exported constant:

```ts
export const MAX_EXTRACTION_RATE = 0.8;
```

Apply the cap in both places where `extractionRate` is computed:
1. The manual `panForGold` action
2. The `_fixedTick` prospector automation block

```ts
extractionRate = Math.min(BASE_EXTRACTION + bonus, MAX_EXTRACTION_RATE);
```

**Effect:**
- Base (no sluice ops): 0.2 — unchanged
- Fully maxed sluice crew: 0.8 (4× base) — meaningful but bounded
- Gold per oz paydirt at cap: 0.8 × 2.5 = **2.0 oz** (vs 0.5 oz base, 5× base without sluice)
- `sluiceGear` upgrades now matter as a way to reach the ceiling with fewer operators

---

## What Does NOT Change

- `STAT_BASE`, `EMPLOYEE_LEVEL_CAPS`, `computeEmployeeStats` — unchanged
- Rate constants (`MINER_DIRT_RATE`, `PROSPECTOR_PAN_RATE`, etc.) — unchanged (L0 power is identical before and after)
- Schema — no version bump needed
- UI — no display changes

---

## Files Changed

- `goldmine-game/src/store/gameStore.ts` — `getEmployeeRolePower()`, `MAX_EXTRACTION_RATE`, two `extractionRate` clamp sites
- `goldmine-game/tests/gameStore.tick.test.ts` — update expected power/gold values for the new formula
- `goldmine-game/src/data/changelog.ts` — v1.27.1 entry
- `goldmine-game/package.json` — version bump

---

## Verification

1. `npm test` — all tests pass
2. Hard reset → Common L0 miner output unchanged (~0.04 dirt/tick)
3. Dev mode with legendary crew: bucket fills in ~0.4s, not instantly
4. Max sluice ops: extraction rate shows 0.8 in gold calculations, not higher
