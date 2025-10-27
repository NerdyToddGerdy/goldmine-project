# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Goldmine Tycoon** is a game with two main components:
1. **goldmine-game**: Frontend game built with React + TypeScript + Vite + Tailwind CSS
2. **goldmine-lambda**: Python serverless backend using AWS Lambda (managed with Poetry, deployed via Pulumi)

The frontend uses Zustand for state management with a fixed-step game loop architecture (60 FPS). The game state persists to LocalStorage with schema versioning and migration support.

## Common Commands

### Frontend (goldmine-game/)

```bash
# Navigate to frontend
cd goldmine-game

# Development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Type checking
tsc -b
```

### Backend (goldmine-lambda/)

```bash
# Install dependencies
poetry install

# Run handler locally
poetry run python handler.py

# Run tests
poetry add --group dev pytest
poetry run pytest

# Deploy to AWS (requires Pulumi setup)
pulumi up

# Export requirements for Lambda packaging
poetry export -f requirements.txt --without-hashes > requirements.txt
```

### Running a Single Test

```bash
# From goldmine-game/
npm test -- <test-file-path>
# Example:
npm test -- tests/gameStore.test.ts
```

## Architecture

### State Management (Zustand Vanilla Store)

The game uses **Zustand vanilla store** (not React hooks) located in `src/store/gameStore.ts`. This allows:
- Direct access from non-React code (game loop, tests)
- React components subscribe via `useGameStore`
- Persistent state with LocalStorage integration

**Key store features:**
- `stepSimulation(dtMs)`: Converts variable delta time from requestAnimationFrame into fixed-step simulation (60 FPS)
- `_fixedTick()`: Internal method executing game logic at fixed intervals
- `pause/resume/togglePause`: Control game execution
- `reset()`: Soft reset (clears run values, keeps settings)
- `hardResetSave()`: Wipes LocalStorage and resets all state
- `exportSave()/importSave()`: JSON-based save file management

### Game Loop Architecture

The game uses a **fixed-step game loop** pattern:

1. **useGameLoop hook** (`src/hooks/useGameLoop.ts`):
   - Runs requestAnimationFrame loop
   - Calculates variable delta time between frames
   - Feeds delta to `stepSimulation()`

2. **stepSimulation** (`src/store/gameStore.ts:124`):
   - Accumulates variable dt into `_accumulator`
   - Executes `_fixedTick()` in a while loop for each full `FIXED_DT_MS` (16.6667ms)
   - Ensures deterministic physics/game logic regardless of frame rate

3. **_fixedTick** (`src/store/gameStore.ts:139`):
   - Core game logic runs here
   - Currently increments `tickCount` and `paydirt`
   - This is where game rules, resource generation, and mechanics should be implemented

### Save System & Schema Versioning

**Schema management** (`src/store/schema.ts`):
- `SCHEMA_VERSION`: Constant defining current save format version (currently v2)
- `SaveV1` / `SaveV2`: TypeScript types for each schema version
- `migrateToLatest()`: Handles automatic migration from older save formats
  - Example: v1 used `dirtyGold`, v2 renamed it to `paydirt`
- `defaultSaveV2()`: Returns clean default save state

**Persistence integration** (`src/store/gameStore.ts:147-173`):
- Uses Zustand's `persist` middleware with `createJSONStorage`
- `partialize`: Only persists game data, excludes transient fields (`isPaused`, `_accumulator`)
- `migrate`: Automatically runs `migrateToLatest()` on load
- `onRehydrateStorage`: Resets transient flags after loading

**When adding new persisted fields:**
1. Bump `SCHEMA_VERSION` in `schema.ts`
2. Create new `SaveVX` type with the new schema
3. Update `LatestSave` type alias
4. Add migration logic in `migrateToLatest()` to handle old -> new conversion
5. Update `partialize` in `gameStore.ts` to include new fields
6. Update `exportSave()` and `importSave()` if needed

### Component Structure

- `src/App.tsx`: Main app container with Tailwind layout
- `src/components/Controls.tsx`: Game control UI (pause/resume buttons)
- `src/components/HUD.tsx`: Heads-up display showing game stats
- `src/main.tsx`: Entry point, mounts `useGameLoop` hook

### Testing

Tests use **Vitest** and are located in `tests/` directory (note: not `src/__tests__`).

Test structure mirrors source:
- `tests/gameStore.test.ts` - Store tests
- `tests/tests/store/schema.test.ts` - Schema migration tests

**Test patterns:**
- Use `beforeEach()` with `useGameStore.getState().reset()` for clean state
- Access store directly via `useGameStore.getState()` (no React rendering needed)
- Test fixed-step simulation by feeding multiples of `FIXED_DT_MS`

### Backend Architecture

The Python Lambda handler (`handler.py`) will power server-side game events:
- Gold selling transactions
- Player action validation
- Game progression logic
- Future integration with S3/DynamoDB for persistence

Currently standalone; future API Gateway or EventBridge triggers planned.

## Development Notes

- TypeScript is in **strict mode** with comprehensive linting rules
- Use **ES2022** syntax, ESNext modules
- Tailwind configured with custom amber theme for gold mine aesthetic
- React 19 with Vite's Fast Refresh (HMR)
- All game logic should run in `_fixedTick()` to ensure frame-rate independence
