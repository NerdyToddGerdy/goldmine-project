// Current Resources
// export let paydirt = 0;
// export let gold = 0;
// export let money = 0;
//
// // Player Equipment
// export let bucketCapacity = 10; // Max paydirt bucket can hold
// export let shovelEfficiency = 1; // Paydirt scooped per click

import {upgrades} from "./upgrades";

export const gameState = {
    paydirt: 0,
    gold: 0,
    money: 0,
    bucketCapacity: 10,
    shovelEfficiency: 1,
    panQuality: 1
}


/**
 * @returns the amount of paydirt after scooping dirt
 */
export function scoop() {
    if (gameState.paydirt + gameState.shovelEfficiency > gameState.bucketCapacity) {
        return {
            paydirt: gameState.bucketCapacity,
            full: true
        }
    }
    gameState.paydirt += gameState.shovelEfficiency;
    return {
        paydirt: gameState.paydirt,
        full: false
    }
}

/**
 * @returns the amount of gold you get from panning
 */
export function pan() {
    const paydirtNeeded = 1;

    if (gameState.paydirt >= paydirtNeeded) {
        gameState.paydirt -= paydirtNeeded;
        const panBonus = upgrades.pan.effect;
        gameState.gold += panBonus;
    } else {
        console.log("Not enough paydirt to pan!");
    }

    return {
        paydirt: gameState.paydirt,
        gold: gameState.gold
    }
}

/**
 * @returns The money from selling gold
 */
export function sell() {
    // TODO: Add random sell value within range (range can be upgraded later)
    if (gameState.gold > 0) {
        gameState.money += gameState.gold * 10;
        gameState.gold = 0;
    }
    return gameState.money;
}

export function upgradeBucket(newCapacity: number) {
    gameState.bucketCapacity = newCapacity;
}

export function upgradeShovel(newEfficiency: number) {
    gameState.shovelEfficiency = newEfficiency;
}