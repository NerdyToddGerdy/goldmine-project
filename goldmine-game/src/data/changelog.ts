export interface ChangelogEntry {
    version: string;
    date: string;
    title: string;
    changes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: 'v1.5',
        date: '2026-03-25',
        title: 'Polish Sprint — Travel, Banker & UX',
        changes: [
            'Travel button now transforms in-place into a progress bar with moving vehicle emoji and cancel button',
            'Banker workers auto-sell your gold on arrival at Town — no more manual selling required',
            'Tab switching has a smooth fade + slide transition',
            'New payroll widget in Mine shows banker income vs. worker costs and net per minute',
        ],
    },
    {
        version: 'v1.4',
        date: '2026-03-25',
        title: 'Lifetime Stats Panel',
        changes: [
            'New Lifetime Stats section in Settings tracking total gold extracted, total money earned, and prestige run count',
            'Peak Run Earnings tracks your best single run across all resets and prestiges',
            'Stats persist through soft resets and prestiges — only wiped on hard reset',
        ],
    },
    {
        version: 'v1.3',
        date: '2026-03-25',
        title: 'Progress Bar Polish — Shimmer, Glow & Urgency Colors',
        changes: [
            'Bucket bar shifts amber → orange → red as it fills (60%/90% thresholds) to signal "empty me soon"',
            'Active shimmer animation on bucket and pan bars while workers are filling them',
            'Pulsing glow ring when bucket or pan reaches 100% — prompts you to act',
        ],
    },
    {
        version: 'v1.2',
        date: '2026-03-25',
        title: 'Toast Polish — Success Type & Richer Feedback',
        changes: [
            'New ✅ success toast type (green) for positive events',
            'Equipment purchases, vehicle upgrades, driver hire, and prestige now fire success toasts',
            'Toast queue expanded to 4 visible notifications',
        ],
    },
    {
        version: 'v1.1',
        date: '2026-03-25',
        title: 'CI: Node.js 24',
        changes: [
            'GitHub Actions updated to Node.js 24',
        ],
    },
    {
        version: 'v1.0',
        date: '2026-03-25',
        title: 'v1.0 — Typography, Atmosphere & Animations',
        changes: [
            'Gear tab reorganized into ⛏️ Tools / 📦 Capacity & Speed / ⚙️ Machinery Upgrades sections',
            'Banking sell now shows an itemized breakdown card with oz × price, smelting fee, and net received',
            'Price trend arrow (▲/▼) on Banking market price; Furnace upsell hint when fee applies',
            'Press Start 2P pixel font applied to game title, section headers, and resource card labels',
            'Mine/Town/Settings each have a distinct background gradient (amber/green/gray) with smooth crossfade on tab switch',
            'Floating +X number animations appear on manual panning and gold sales',
        ],
    },
    {
        version: 'v0.22',
        date: '2026-03-25',
        title: 'Equipment → Worker Chain Made Visible',
        changes: [
            'Labor Office now shows locked rows for Sluice Operator, Separator Technician, Oven Operator, and Furnace Operator before their equipment is purchased',
            'Locked rows show which equipment to buy and where to find it (Shop → Equipment)',
            'Equipment descriptions now include a 🔗 Unlocks line pointing to the corresponding worker',
        ],
    },
    {
        version: 'v0.21',
        date: '2026-03-25',
        title: 'Disabled Button Tooltips',
        changes: [
            'Shop upgrades and equipment now show "Need $X more" when you can\'t afford them',
            'Labor Office hire buttons show the shortfall when funds are insufficient',
            'Mine action buttons show "🚗 Locked while traveling" when a trip is in progress',
        ],
    },
    {
        version: 'v0.20',
        date: '2026-03-25',
        title: 'Prestige Details & Payroll Warning',
        changes: [
            'Prestige modal now shows exactly what you\'ll lose (money, gold, workers, equipment, vehicle) and what you\'ll keep (Legacy Dust total after reward, dust upgrades)',
            'Labor Office now shows the wage cost of your next hire for each worker type',
            'Warning indicator (⚠️) appears when hiring a worker would push total payroll above your banker auto-sell income',
        ],
    },
    {
        version: 'v0.19',
        date: '2026-03-25',
        title: "QoL: Auto-Empty, What's New & Payroll Fix",
        changes: [
            "What's New popup: returning players see a summary of recent changes on load",
            'New upgrade in Shop → Gear: Auto-Empty Bucket ($75) — bucket empties to pan automatically when full, even without miners',
            'Payroll bar now stays visible once workers are hired, even when all are idle ($0.00)',
        ],
    },
    {
        version: 'v0.18',
        date: '2026-03-25',
        title: 'Gold Market & Economy Polish',
        changes: [
            'Randomized gold market price ($0.60–$1.80/oz) with 30-second mean-reverting drift',
            'Banking tab is now the sole place to sell gold — Gold Exchange removed from Town',
            'Investments removed (simplified Banking to market price + sell button)',
            'Smelting fee (15%) now correctly waived when you own a Furnace',
            'Idle workers no longer charge payroll — miners pause when bucket is full, prospectors when pan is empty',
            'Mine action buttons locked while traveling',
            'Town Shop and Labor Office locked while traveling (Banking stays accessible)',
            'Fixed page width shifting between tabs (caused by Vite boilerplate body/root CSS)',
        ],
    },
    {
        version: 'v0.16',
        date: '2026-03-25',
        title: 'Travel Mechanic',
        changes: [
            'Timed travel between Mine and Town — no instant teleporting',
            'Four vehicle tiers: On Foot (15s) → Mule Cart (8s) → Steam Wagon (4s) → Motor Truck (2s)',
            'Animated travel banner with vehicle emoji sliding across a progress bar',
            'Driver hire: auto-sells your gold at Town on round trips (requires Steam Wagon)',
            'Vehicle upgrades purchasable in Town Shop → Transport tab',
        ],
    },
    {
        version: 'v0.13',
        date: '2026-03-25',
        title: 'Prestige — New Creek Run',
        changes: [
            'Prestige system: start a new run and earn Legacy Dust (√run earnings)',
            'Legacy Dust persists across all runs',
            'Prestige Shop unlocked after first prestige — spend Dust on permanent upgrades',
            'Run money threshold of $10,000 required to prestige',
        ],
    },
    {
        version: 'v0.12',
        date: '2026-03-25',
        title: 'Banking & Toast Notifications',
        changes: [
            'Banking tab added to Town',
            'Toast notifications for equipment purchases',
            'Investment risk events with variable loss amounts',
        ],
    },
    {
        version: 'v0.11',
        date: '2026-03-24',
        title: 'Full Phase 1 Game',
        changes: [
            'Complete Mine and Town UI',
            'Sluice Box, Magnetic Separator, Oven, Furnace equipment chain',
            'Worker hiring: Miners, Prospectors, Sluice Operators, Separator Technicians, Oven/Furnace Operators, Bankers',
            'Gear upgrades for each equipment type',
            'Bucket and pan capacity upgrades',
            'Dark mode toggle',
            'Export / Import save files',
            'Soft reset and hard reset options',
        ],
    },
    {
        version: 'v0.1',
        date: '2026-03-24',
        title: 'Foundation',
        changes: [
            'Fixed-step 60 FPS game loop with Zustand vanilla store',
            'LocalStorage persistence with schema versioning and auto-migration',
            'Scoop dirt → empty bucket → pan for gold core loop',
            'Hire Miners (auto-dig) and Prospectors (auto-pan)',
        ],
    },
];
