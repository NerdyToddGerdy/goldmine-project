// src/api.ts
const BASE_URL = "https://0gzo542ykg.execute-api.us-east-1.amazonaws.com/dev/gold";

export async function saveGold(playerId: string, gold: number) {
    try {
        const response = await  fetch(BASE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: playerId, gold }),
        });
        const data = await response.json();
        console.log("Saved:", data);
    } catch (error) {
        console.error("Error saving gold:", error)
    }
}