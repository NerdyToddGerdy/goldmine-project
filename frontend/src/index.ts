// src/index.ts

// import { saveGold } from "./api";

import {gameState, pan, scoop, sell} from "./gameState";
import { initUpgradePanel } from "./ui/upgradePanel"
import {showFloatingText} from "./ui/floatingFeedback";


// HUD
const statusDiv = document.getElementById("status") as HTMLDivElement;
const hudPaydirt = document.getElementById("hud-paydirt") as HTMLDivElement;
const hudGold = document.getElementById("hud-gold") as HTMLDivElement;
const hudMoney = document.getElementById("hud-money") as HTMLDivElement;

// Buttons
const scoopBtn = document.getElementById("scoop-btn") as HTMLImageElement;
const panBtn = document.getElementById("pan-btn") as HTMLImageElement;
const sellBtn = document.getElementById("sell-btn") as HTMLImageElement;

export function updateHUD() {
    hudPaydirt.innerText = `Paydirt: ${gameState.paydirt}/${gameState.bucketCapacity}`;
    hudGold.innerText = `Gold: ${gameState.gold}`;
    hudMoney.innerText = `Money: $${gameState.money}`;

    //Disable scoop if bucket is full
    if (gameState.paydirt >= gameState.bucketCapacity) {
        statusDiv.innerText = "Bucket is full! Pan or upgrade to scoop more.";
    }

    disableButton(scoopBtn, gameState.paydirt >= gameState.bucketCapacity);
    disableButton(panBtn, gameState.paydirt === 0);
    disableButton(sellBtn, gameState.gold === 0);
}

function showMessage(msg: string) {
    statusDiv.innerText = msg;
}

scoopBtn.addEventListener("click", (event) => {
    const result = scoop();
    updateHUD();
    if (!result.full) {
        showMessage(`Scooped ${gameState.shovelEfficiency} paydirt`);
        const rect = scoopBtn.getBoundingClientRect();
        showFloatingText(gameState.shovelEfficiency, rect.x, rect.y);
    }
})

panBtn.addEventListener("click", () => {
    const { paydirt, gold } = pan();
    updateHUD();
    showMessage(`Panned gold! Paydirt: ${paydirt}, Gold: ${gold}`);
    const rect = panBtn.getBoundingClientRect();
    showFloatingText(1, rect.x - 50, rect.y);
})

sellBtn.addEventListener("click", () => {
    const money = sell();
    updateHUD();
    showMessage(`Sold gold! Money: $${money}`);
    const rect = sellBtn.getBoundingClientRect();
    showFloatingText(money, rect.x, rect.y);
})

// Disable Button Function
function disableButton(button: HTMLImageElement, disabled: boolean) {
    if (disabled) {
        button.classList.add("disabled");
        button.style.pointerEvents = "none";
    } else {
        button.classList.remove("disabled");
        button.style.pointerEvents = "auto";
    }
}


// Initialize HUD on page load.
updateHUD();

document.addEventListener("DOMContentLoaded", () => {
    initUpgradePanel();
})