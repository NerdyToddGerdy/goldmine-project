// src/upgradeLogic.ts

import {upgrades} from "./upgrades";
import {gameState} from "./gameState";

export function purchaseUpgrade(type: "bucket" | "shovel") {
    const upgrade = upgrades[type]; // No

    if (!upgrade) {
        console.error(`Upgrade type "${type}" does not exist.`)
        return false;
    }

    if (gameState.money >= upgrade.cost) {

        // Deduct cost
        gameState.money -= upgrade.cost;

        // Increase level and effect
        upgrade.level++;
        if (type === "bucket") {
            gameState.bucketCapacity += 5;
            upgrade.effect +=5;
        } else if (type === "shovel") {
            gameState.shovelEfficiency += 0.5;
            upgrade.effect = gameState.shovelEfficiency;
        }

        // Increase cost for next upgrade
        upgrade.cost = Math.floor(upgrade.cost * 1.5);

        return true;
    }

    console.warn("Note enough money for upgrade:", type);
    return false;

}