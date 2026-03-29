# Goldmine Tycoon — Game

A placer gold mining idle/clicker game. Scoop dirt, process it through a sluice, pan the paydirt for gold, smelt it into bars, haul it to town, and sell it. Hire workers to automate each stage. Prestige to earn Legacy Dust and unlock permanent upgrades across runs.

**Current version:** v1.11.1

---

## Tech Stack

- **React 19** + **TypeScript** (strict mode)
- **Zustand** vanilla store (no React hooks in game logic)
- **Vite** + **Tailwind CSS** (custom amber theme)
- **Vitest** for unit tests

---

## Dev Setup

```bash
npm install
npm run dev          # dev server (HMR)
npm run build        # production build
npm run lint         # ESLint
npm test             # run all tests
npm run test:watch   # watch mode
npx tsc -b           # type check
```

---

## Game Loop

### Core Processing Chain

```
Scoop Dirt → Bucket → Sluice Box → Miner's Moss → Pan → Gold Flakes
                                                              ↓
                                                         Furnace
                                                              ↓
                                                         Gold Bars
```

1. **Scoop dirt** into the bucket (manual click or Miners)
2. **Empty bucket** into the Sluice Box — dirt drains slowly, concentrating into the Miner's Moss
3. Once the sluice empties, **Clean Moss** → 1 unit of moss yields 3 units of paydirt in the pan
4. **Pan for Gold** — extracts gold flakes from paydirt (manual click or Prospectors)
5. *(Optional)* **Load Furnace** → smelt gold flakes into bars — bars sell at 1.2× market price with no smelting fee; flakes carry a 15% fee

### Travel & Economy

- The player has a **Mine** tab and a **Town** tab
- Traveling between them takes time (15s on foot → 8s mule → 4s steam wagon → 2s truck)
- Gold is sold at the **Bank** in Town — market price fluctuates between $0.60–$1.80/oz on a 30-second mean-reverting drift
- The player can only sell what they carried from the mine (`goldInPocket` cap)

### Bank Vault & Driver

- Hire a **Driver** (requires Steam Wagon) to haul gold automatically to the **Bank Vault**
- Driver prioritizes gold bars over flakes; vault bars and vault flakes are tracked separately and sell at their respective prices
- **Larger Carrier** upgrade (+5 oz capacity, up to 3×) available in Transport tab after hiring

### Prestige

- Once you've earned $10,000 in a run, **Prospect New Claim** (Banking tab) resets the run and awards **Legacy Dust** (√run earnings)
- Spend Dust in the **Legacy Shop** on permanent cross-run upgrades: scoop boost, pan yield, gold value, bucket size, pan speed, pan capacity, detect rate, spot cap

---

## Workers

Hired from the **Labor Office** in Town. All workers have a per-second wage; idle workers (bucket full, pan empty) are not charged.

| Worker | Requires | Effect |
|---|---|---|
| Miner | — | Auto-digs dirt into the bucket |
| Hauler | — | Auto-empties full bucket into sluice/pan |
| Prospector | — | Auto-pans gold from the pan |
| Sluice Operator | Sluice Box | Speeds up sluice drain; auto-cleans moss once sluice empties; +10% gold extraction per worker |
| Furnace Operator | Furnace | Auto-loads, auto-starts, and auto-collects the furnace |
| Banker | — | Auto-sells gold at Town on a timer |
| Detector Operator | Metal Detector | Auto-detects high-yield patches |

---

## Equipment & Upgrades (Town Shop)

### Equipment

| Item | Effect |
|---|---|
| Sluice Box | Unlocks the sluice → moss processing stage |
| Metal Detector | Unlocks high-yield patch detection |
| Furnace | Unlocks gold bar smelting |

### Transport

| Upgrade | Travel Time |
|---|---|
| On Foot (default) | 15s |
| Mule Cart | 8s |
| Steam Wagon | 4s — required for Driver |
| Motor Truck | 2s |

### Gear Upgrades

Better Shovel, Better Pan, Better Sluice, Better Furnace — multiply worker output and manual action power.

---

## Architecture

### State Management

All game state lives in a **Zustand vanilla store** (`src/store/gameStore.ts`). React components subscribe via `useGameStore`. This allows the game loop to run outside React.

### Game Loop

```
requestAnimationFrame → stepSimulation(dtMs)
    → accumulate dt into _accumulator
    → while accumulator >= FIXED_DT_MS (16.667ms):
        → _fixedTick()   ← all game logic here
```

The fixed-step loop guarantees deterministic behavior at any frame rate.

### Save System

- Schema versioned (`SCHEMA_VERSION` in `src/store/schema.ts`)
- `migrateToLatest()` handles automatic migration from older saves on load
- `partialize` in the store controls exactly which fields are persisted to LocalStorage
- Export/Import save as JSON available in Settings

### Tests

Tests live in `tests/` and use Vitest. Run with `npm test`. Key files:

- `tests/gameStore.tick.test.ts` — production tick logic (miners, prospectors, driver, sluice)
- `tests/gameStore.actions.test.ts` — manual actions and upgrade purchases
- `tests/tests/store/schema.test.ts` — save migration correctness

---

## Project Structure

```
src/
├── store/
│   ├── gameStore.ts     # Zustand store, game loop, all actions
│   └── schema.ts        # Save types, versioning, migrations
├── components/
│   ├── Mine.tsx          # Mine tab UI
│   ├── Town.tsx          # Town tab (Shop, Labor Office, Transport)
│   ├── Banking.tsx       # Banking tab (sell gold, vault, prestige)
│   ├── Settings.tsx      # Settings, stats, save management
│   └── ui/               # Shared UI components (ProgressBar, WorkerRow, etc.)
├── data/
│   └── changelog.ts      # In-game changelog (shown in What's New modal)
├── hooks/
│   └── useGameLoop.ts    # requestAnimationFrame → stepSimulation bridge
└── utils/
    └── format.ts         # Number formatting helpers
tests/
├── gameStore.tick.test.ts
├── gameStore.actions.test.ts
└── tests/store/schema.test.ts
```
