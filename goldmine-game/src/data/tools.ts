// Tool tier definitions for Phase 1 manual tools.
// Costs and names for each upgrade tier (5 tiers each).

export const MAX_TOOL_TIER = 5;

export const TOOL_TIERS = {
    shovel: {
        name: "Shovel",
        icon: "⛏️",
        costs: [10, 50, 200, 800, 3000] as const,
        tierNames: [
            "Iron Shovel",
            "Steel Shovel",
            "Power Shovel",
            "Hydraulic Shovel",
            "Diamond Drill",
        ] as const,
        effect: "+1 scoop power per tier",
    },
    pan: {
        name: "Pan",
        icon: "🥘",
        costs: [10, 50, 200, 800, 3000] as const,
        tierNames: [
            "Tin Pan",
            "Steel Pan",
            "Vibrating Classifier",
            "Spiral Panner",
            "Centrifuge",
        ] as const,
        effect: "+1 pan power per tier",
    },
} as const;

export type ToolType = keyof typeof TOOL_TIERS;