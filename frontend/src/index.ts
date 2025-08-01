// src/index.ts

import { saveGold } from "./api";

const statusDiv = document.getElementById("status") as HTMLDivElement;

function showMessage(msg: string) {
    statusDiv.innerText = msg;
}

document.getElementById("scoop-btn")?.addEventListener("click", () => {
    showMessage("Scooping Dirt...");
    saveGold("web-player", 10);
})

document.getElementById("pan-btn")?.addEventListener("click", () => {
    showMessage("Panning Gold...");
    saveGold("web-player", 20);
})

document.getElementById("sell-btn")?.addEventListener("click", () => {
    showMessage("Selling Gold...");
    saveGold("web-player", 30);
})