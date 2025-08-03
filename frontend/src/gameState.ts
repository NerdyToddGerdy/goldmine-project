// Current Resources
export let paydirt = 0;
export let gold = 0;
export let money = 0;

// Player Equipment
export let bucketCapacity = 10; // Max paydirt bucket can hold
export let shovelEfficiency = 1; // Paydirt scooped per click


/**
 * @returns the amount of paydirt after scooping dirt
 */
export function scoop() {
    if (paydirt + shovelEfficiency > bucketCapacity) {
        return { bucketCapacity, full: true}
    }
    paydirt += shovelEfficiency;
    return { paydirt, full: false}
}

/**
 * @returns the amount of gold you get from panning
 */
export function pan() {
    if (paydirt > 0) {
        paydirt -= 1;
        gold += 1;
    }
    return {paydirt, gold}
}

/**
 * @returns The money from selling gold
 */
export function sell() {
    // TODO: Add random sell value within range (range can be upgraded later)
    if (gold > 0) {
        money += gold * 10;
        gold = 0;
    }
    return money;
}

export function upgradeBucket(newCapacity: number) {
    bucketCapacity = newCapacity;
}

export function upgradeShovel(newEfficiency: number) {
    shovelEfficiency = newEfficiency;
}