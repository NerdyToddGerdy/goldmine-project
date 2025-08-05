// src/upgradeLogic.ts

import {upgrades} from "./upgrades";
import {gameState} from "./gameState";

export function purchaseUpgrade(type: "bucket" | "shovel" | "pan") {
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
            upgrade.effect = gameState.bucketCapacity;
        } else if (type === "shovel") {
            gameState.shovelEfficiency += 0.5;
            upgrade.effect = gameState.shovelEfficiency;
        } else if (type === "pan") {
            // TODO: the button is not clickable
            // TODO: the close button for the Updgrades is not styled.
            // TODO: figure out how to not highlight the background.
            gameState.panQuality += 0.2;
            upgrade.effect += gameState.panQuality; // +20 % yield each upgrade
        }

        // Increase cost for next upgrade
        upgrade.cost = Math.floor(upgrade.cost * 1.5);

        return true;
    }

    console.warn("Not enough money for upgrade:", type);
    return false;

}