// src/upgrades.ts

export interface Upgrade {
    name: string;
    level: number;
    cost: number;
    effect: number;
    description: string;
}

export const upgrades = {
    bucket: {
        name: "Bucket Capacity",
        level: 1,
        cost: 50,
        effect: 10,
        description: "Increase how much paydirt your bucket can hold."
    },
    shovel: {
        name: "Shovel Efficiency",
        level: 1,
        cost: 75,
        effect: 1,
        description: "Increase how much paydirt you scoop per click."
    }
};