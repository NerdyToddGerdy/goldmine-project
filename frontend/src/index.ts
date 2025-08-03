// src/index.ts

// import { saveGold } from "./api";

import {bucketCapacity, gold, money, pan, paydirt, scoop, sell, shovelEfficiency} from "./gameState";


// HUD
const statusDiv = document.getElementById("status") as HTMLDivElement;
const hudPaydirt = document.getElementById("hud-paydirt") as HTMLDivElement;
const hudGold = document.getElementById("hud-gold") as HTMLDivElement;
const hudMoney = document.getElementById("hud-money") as HTMLDivElement;

// Buttons
const scoopBtn = document.getElementById("scoop-btn") as HTMLImageElement;
const panBtn = document.getElementById("pan-btn") as HTMLImageElement;
const sellBtn = document.getElementById("sell-btn") as HTMLImageElement;

function updateHUD() {
    hudPaydirt.innerText = `Paydirt: ${paydirt}/${bucketCapacity}`;
    hudGold.innerText = `Gold: ${gold}`;
    hudMoney.innerText = `Money: $${money}`;

    //Disable scoop if bucket is full
    if (paydirt >= bucketCapacity) {
        statusDiv.innerText = "Bucket is full! Pan or upgrade to scoop more.";
    }

    disableButton(scoopBtn, paydirt >= bucketCapacity);
    disableButton(panBtn, paydirt === 0);
    disableButton(sellBtn, gold === 0);
}

function showMessage(msg: string) {
    statusDiv.innerText = msg;
}

scoopBtn.addEventListener("click", () => {
    const result = scoop();
    updateHUD();
    if (!result.full) {
        showMessage(`Scooped ${shovelEfficiency} paydirt`)
    }
})

panBtn.addEventListener("click", () => {
    const { paydirt, gold } = pan();
    updateHUD();
    showMessage(`Panned gold! Paydirt: ${paydirt}, Gold: ${gold}`);
})

sellBtn.addEventListener("click", () => {
    const money = sell();
    updateHUD();
    showMessage(`Sold gold! Money: $${money}`);
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