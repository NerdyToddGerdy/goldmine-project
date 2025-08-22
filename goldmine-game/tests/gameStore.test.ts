import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore, FIXED_DT_MS} from "../src/store/gameStore";

beforeEach(() => {
    //Ensure a clean slate for every test (no leftover ticks or accumulator)
    useGameStore.getState().reset()
})

describe('game store ticking', () => {
    it('accumulates variable dt into fixed ticks', () => {
        const initial = useGameStore.getState().tickCount
        // feed enough dt to cross 3 fixed steps
        const dt = FIXED_DT_MS * 3 + FIXED_DT_MS * 0.5
        useGameStore.getState().stepSimulation(dt)
        const after = useGameStore.getState().tickCount
        expect(after - initial).toBe(3)
    })

    it('pauses and resume', () => {
        useGameStore.getState().reset()
        useGameStore.getState().pause()
        useGameStore.getState().stepSimulation(FIXED_DT_MS * 5)
        expect(useGameStore.getState().tickCount).toBe(0)
        useGameStore.getState().resume()
        useGameStore.getState().stepSimulation(FIXED_DT_MS)
        expect(useGameStore.getState().tickCount).toBe(1)
    })
})