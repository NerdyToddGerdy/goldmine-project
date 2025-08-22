import {useGameStore} from "../store/gameStore.ts";
import {useEffect, useRef} from "react";

/**
* useGameLoop
* Hooks a single rAF loop to the global store. Multiple mounts are safe
* because we only request a frame when mounted and cancel on unmount.
*/
export function useGameLoop() {
    const step = useGameStore((s) => s.stepSimulation)
    const isPaused = useGameStore((s) => s.isPaused)
    const rafRef = useRef<number | null>(null)
    const lastRef = useRef<number | null>(null)

    useEffect(() => {
        function frame(now: number) {
            if (lastRef.current == null) {
                lastRef.current = now
            }
            const dt = now - lastRef.current
            lastRef.current = now

            step(dt)
            rafRef.current = requestAnimationFrame(frame)
        }

        // Start loop
        rafRef.current = requestAnimationFrame(frame)

        // Cleanup on unmount
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
            rafRef.current = null
            lastRef.current = null
        }
    }, [step])

    // When pausing/resuming, we want to reset the last timestamp so we don;'t get a huge dt sp
    useEffect(() => {
        if (isPaused) return
        lastRef.current = null
    }, [isPaused]);
}