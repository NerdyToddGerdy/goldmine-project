import { describe, it, expect, beforeEach } from 'vitest'
import { gameStore, FIXED_DT_MS} from "../src/store/gameStore";

beforeEach(() => {
    //Ensure a clean slate for every test (no leftover ticks or accumulator)
    gameStore.getState().reset()
})

describe('game store ticking', () => {
    it('accumulates variable dt into fixed ticks', () => {
        const initial = gameStore.getState().tickCount
        // feed enough dt to cross 3 fixed steps
        const dt = FIXED_DT_MS * 3 + FIXED_DT_MS * 0.5
        gameStore.getState().stepSimulation(dt)
        const after = gameStore.getState().tickCount
        expect(after - initial).toBe(3)
    })

    it('pauses and resume', () => {
        gameStore.getState().reset()
        gameStore.getState().pause()
        gameStore.getState().stepSimulation(FIXED_DT_MS * 5)
        expect(gameStore.getState().tickCount).toBe(0)
        gameStore.getState().resume()
        gameStore.getState().stepSimulation(FIXED_DT_MS)
        expect(gameStore.getState().tickCount).toBe(1)
    })
})