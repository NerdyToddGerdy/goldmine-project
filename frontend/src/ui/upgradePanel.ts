import {upgrades} from "../upgrades";
import {purchaseUpgrade} from "../upgradeLogic";
import {updateHUD} from "../index";
import {showFloatingText} from "./floatingFeedback";
import {gameState} from "../gameState";

export function updateUpgradeUI() {
    const bucketInfo = document.getElementById("bucket-info")!;
    const shovelInfo = document.getElementById("shovel-info")!;
    const panInfo = document.getElementById("pan-info")!;
    bucketInfo.innerText = `Bucket Lv ${upgrades.bucket.level} → Capacity: ${upgrades.bucket.effect}, Cost: $${upgrades.bucket.cost}`;
    shovelInfo.innerText = `Shovel Lv ${upgrades.shovel.level} → Efficiency: ${upgrades.shovel.effect}, Cost: $${upgrades.shovel.cost}`;
    panInfo.innerText = `Pan Lv ${upgrades.pan.level} → Gold Multiplier: x${upgrades.pan.effect}, Cost: $${upgrades.pan.cost}`;

    const buyBucketBtn = document.getElementById('buy-bucket') as HTMLButtonElement;
    const buyShovelBtn = document.getElementById('buy-shovel') as HTMLButtonElement;
    const buyPanBtn = document.getElementById('buy-pan') as HTMLButtonElement;

    buyBucketBtn.disabled = gameState.money < upgrades.bucket.cost;
    buyShovelBtn.disabled = gameState.money < upgrades.shovel.cost;
    buyPanBtn.disabled = gameState.money < upgrades.pan.cost;
}

export function initUpgradePanel() {
    const panel = document.getElementById("upgrades-panel")!;
    const openBtn = document.getElementById("open-upgrades")!;
    const closeBtn = document.getElementById("close-upgrades")!;

    document.getElementById("buy-bucket")?.addEventListener("click", () => {
        if (purchaseUpgrade("bucket")) {
            updateUpgradeUI();
            updateHUD();
            const btnRect = document.getElementById("buy-bucket")!.getBoundingClientRect();
            showFloatingText(upgrades.bucket.cost, btnRect.x, btnRect.y);
        }
    })

    document.getElementById("buy-shovel")?.addEventListener("click", () => {
        if (purchaseUpgrade("shovel")) {
            updateUpgradeUI();
            updateHUD();
            const btnRect= document.getElementById("buy-shovel")!.getBoundingClientRect();
            showFloatingText(upgrades.shovel.cost, btnRect.x, btnRect.y)
        }
    })

    openBtn.addEventListener("click", () => {
        panel.classList.add("visible");
        updateUpgradeUI();
    })

    closeBtn.addEventListener("click", () => {
        panel.classList.remove("visible")
    })

    updateUpgradeUI();
}