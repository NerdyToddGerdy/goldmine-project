import { useState, useEffect } from 'react';
import { gameStore, useGameStore, getHireCost, getEmployeeRolePower, getEmployeeLevel, SKILL_BASE, SKILL_PER_LEVEL, EMPLOYEE_LEVEL_CAPS, MERGE_COSTS, RARITY_ORDER, JOB_POSTING_COSTS, DEFAULT_ROLE_SLOTS, ROLE_SLOT_COSTS } from '../store/gameStore';
import type { Employee, Role } from '../store/schema';

const RARITY_STYLES: Record<string, { border: string; badge: string; text: string }> = {
    common:    { border: 'border-frontier-aged',   badge: 'frontier-badge-common',    text: 'text-frontier-dust'    },
    uncommon:  { border: 'border-frontier-sage',   badge: 'frontier-badge-uncommon',  text: 'text-frontier-sage'    },
    rare:      { border: 'border-blue-500',         badge: 'frontier-badge-rare',      text: 'text-blue-400'         },
    epic:      { border: 'border-purple-500',       badge: 'frontier-badge-epic',      text: 'text-purple-400'       },
    legendary: { border: 'border-frontier-nugget', badge: 'frontier-badge-legendary', text: 'text-frontier-nugget'  },
};

const ROLE_META: Record<Role, { label: string; icon: string; equipment?: string }> = {
    miner:            { label: 'Miner',             icon: '⛏️' },
    hauler:           { label: 'Hauler',             icon: '🛒' },
    prospector:       { label: 'Prospector',         icon: '🔭' },
    sluiceOperator:   { label: 'Sluice Operator',    icon: '🚿', equipment: 'Sluice Box'        },
    driver:           { label: 'Driver',              icon: '🤠', equipment: 'Sluice Box'        },
    furnaceOperator:  { label: 'Furnace Operator',   icon: '⚗️', equipment: 'Furnace'           },
    detectorOperator: { label: 'Detector Operator',  icon: '🔍', equipment: 'Metal Detector'    },
    certifier:        { label: 'Certifier',          icon: '⚖️', equipment: 'Assayer Level 2'   },
    teamster:         { label: 'Teamster',            icon: '⛽', equipment: 'Excavator/Washplant' },
};

const ROLE_ORDER: Role[] = ['miner', 'hauler', 'prospector', 'sluiceOperator', 'driver', 'furnaceOperator', 'detectorOperator', 'certifier', 'teamster'];

function getUnlockedRoles(state: { hasSluiceBox: boolean; hasFurnace: boolean; hasMetalDetector: boolean; assayerLevel: number; hasExcavator: boolean; hasWashplant: boolean }): Role[] {
    const roles: Role[] = ['miner', 'hauler', 'prospector'];
    if (state.hasSluiceBox)                     roles.push('sluiceOperator', 'driver');
    if (state.hasFurnace)                        roles.push('furnaceOperator');
    if (state.hasMetalDetector)                  roles.push('detectorOperator');
    if (state.assayerLevel >= 2)                 roles.push('certifier');
    if (state.hasExcavator || state.hasWashplant) roles.push('teamster');
    return roles;
}

function EmployeeCard({ emp, unlockedRoles, children }: { emp: Employee; unlockedRoles: Role[]; children?: React.ReactNode }) {
    const s = RARITY_STYLES[emp.rarity];
    const cap = EMPLOYEE_LEVEL_CAPS[emp.rarity];
    const maxPower = SKILL_BASE[emp.rarity] + cap * SKILL_PER_LEVEL;
    return (
        <div className={`has-texture p-3 rounded-sm border-2 space-y-2 bg-frontier-parchment dark:bg-frontier-dirt ${s.border}`}>
            <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-frontier-coal dark:text-frontier-bone">{emp.name}</span>
                <span className={`text-xs font-bold capitalize ${s.badge}`}>{emp.rarity}</span>
            </div>
            <div className="space-y-1 text-xs">
                {unlockedRoles.map(role => {
                    const power = getEmployeeRolePower(emp, role);
                    return (
                        <div key={role} className="flex items-center gap-2">
                            <span className="w-16 shrink-0 text-frontier-dust">{ROLE_META[role].label}</span>
                            <div className="flex-1 h-1.5 rounded-sm bg-frontier-iron/30 overflow-hidden">
                                <div className="h-full rounded-sm bg-frontier-nugget" style={{ width: `${Math.min(100, (power / maxPower) * 100)}%` }} />
                            </div>
                            <span className="w-10 text-right font-semibold text-frontier-bone">×{power.toFixed(1)}</span>
                        </div>
                    );
                })}
                {unlockedRoles.length === 0 && (
                    <p className="text-frontier-iron text-center py-1">No roles unlocked yet</p>
                )}
            </div>
            {children}
        </div>
    );
}

// ─── Draft Pool ───────────────────────────────────────────────────────────────

function DraftPool() {
    const gold = useGameStore(s => s.gold);
    const draftPool = useGameStore(s => s.draftPool);
    const refreshCost = useGameStore(s => s.draftPoolRefreshCost);
    const hasSluiceBox = useGameStore(s => s.hasSluiceBox);
    const hasFurnace = useGameStore(s => s.hasFurnace);
    const hasMetalDetector = useGameStore(s => s.hasMetalDetector);
    const assayerLevel = useGameStore(s => s.npcLevels.assayer);
    const hasExcavator = useGameStore(s => s.hasExcavator);
    const hasWashplant = useGameStore(s => s.hasWashplant);
    const unlockedRoles = getUnlockedRoles({ hasSluiceBox, hasFurnace, hasMetalDetector, assayerLevel, hasExcavator, hasWashplant });

    useEffect(() => {
        if (draftPool.length === 0) {
            gameStore.getState().refreshDraftPool();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="frontier-label">Candidates</h4>
                <button
                    onClick={() => gameStore.getState().refreshDraftPool()}
                    disabled={gold < refreshCost}
                    className="frontier-btn-ghost text-xs px-3 py-1 border border-frontier-hide/40"
                >
                    Refresh Pool ({refreshCost} oz)
                </button>
            </div>

            {draftPool.length === 0 ? (
                <p className="text-xs text-frontier-dust text-center py-4">Generating candidates…</p>
            ) : (
                <div className="space-y-2">
                    {draftPool.map(emp => {
                        const cost = getHireCost(emp);
                        const canAfford = gold >= cost;
                        return (
                            <EmployeeCard key={emp.id} emp={emp} unlockedRoles={unlockedRoles}>
                                <div className="flex items-center justify-end pt-1">
                                    <button
                                        onClick={() => gameStore.getState().hireEmployee(emp.id)}
                                        disabled={!canAfford}
                                        className="frontier-btn-primary text-xs px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ background: 'linear-gradient(to bottom, var(--fw-sage), var(--fw-pine))', borderColor: 'var(--fw-pine)' }}
                                    >
                                        Hire ({cost} oz)
                                    </button>
                                </div>
                            </EmployeeCard>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── Bench ────────────────────────────────────────────────────────────────────

function Bench() {
    const employees = useGameStore(s => s.employees);
    const hasSluiceBox = useGameStore(s => s.hasSluiceBox);
    const hasFurnace = useGameStore(s => s.hasFurnace);
    const hasMetalDetector = useGameStore(s => s.hasMetalDetector);
    const assayerLevel = useGameStore(s => s.npcLevels.assayer);
    const hasExcavator = useGameStore(s => s.hasExcavator);
    const hasWashplant = useGameStore(s => s.hasWashplant);
    const unlockedRoles = getUnlockedRoles({ hasSluiceBox, hasFurnace, hasMetalDetector, assayerLevel, hasExcavator, hasWashplant });
    const bench = employees.filter(e => e.assignedRole === null);

    return (
        <div className="space-y-3">
            <h4 className="frontier-label">Your Crew (Unassigned)</h4>
            {bench.length === 0 ? (
                <p className="text-xs text-frontier-dust text-center py-4">No idle crew. Hire someone or unassign a worker.</p>
            ) : (
                <div className="space-y-2">
                    {bench.map(emp => (
                        <EmployeeCard key={emp.id} emp={emp} unlockedRoles={unlockedRoles}>
                            <div className="flex items-center justify-end pt-1">
                                <button
                                    onClick={() => gameStore.getState().dismissEmployee(emp.id)}
                                    className="frontier-btn-danger text-xs px-3 py-1"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </EmployeeCard>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Roster ───────────────────────────────────────────────────────────────────

function RoleSlotRow({ role, emp, bench, isLocked, equipmentReq }: {
    role: Role;
    emp: Employee | null;
    bench: Employee[];
    isLocked: boolean;
    equipmentReq?: string;
}) {
    const [picking, setPicking] = useState(false);
    const meta = ROLE_META[role];

    if (isLocked) {
        return (
            <div className="flex items-center gap-2 p-2 rounded-sm bg-frontier-coal/20 border border-dashed border-frontier-iron/40 opacity-60">
                <span className="text-base">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-frontier-dust">{meta.label}</span>
                    {equipmentReq && <span className="text-xs text-frontier-iron ml-1">— requires {equipmentReq}</span>}
                </div>
            </div>
        );
    }

    if (emp) {
        const s = RARITY_STYLES[emp.rarity];
        const power = getEmployeeRolePower(emp, role);
        const xp = emp.xpByRole[role] ?? 0;
        const level = getEmployeeLevel(xp, emp.rarity);
        const cap = EMPLOYEE_LEVEL_CAPS[emp.rarity];
        const xpForLevel = level * level * 10;
        const xpForNext = (level + 1) * (level + 1) * 10;
        const xpPct = level >= cap ? 100 : Math.min(100, ((xp - xpForLevel) / (xpForNext - xpForLevel)) * 100);
        return (
            <div className={`flex items-center gap-2 p-2 rounded-sm border-2 bg-frontier-parchment dark:bg-frontier-dirt ${s.border}`}>
                <span className="text-base">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-frontier-coal dark:text-frontier-bone truncate">{emp.name}</span>
                        <span className={`text-xs px-1 rounded-sm capitalize ${s.badge}`}>{emp.rarity}</span>
                        <span className="text-xs text-frontier-dust">L{level}{level >= cap ? ' ★' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 h-1 rounded-sm bg-frontier-iron/30 overflow-hidden">
                            <div
                                className={`h-full rounded-sm transition-all duration-500 ${level >= cap ? 'bg-frontier-nugget' : 'bg-blue-400'}`}
                                style={{ width: `${xpPct}%` }}
                            />
                        </div>
                        <span className="text-xs text-frontier-dust shrink-0">Pwr {power.toFixed(1)}</span>
                    </div>
                </div>
                <button
                    onClick={() => gameStore.getState().unassignEmployee(emp.id)}
                    className="frontier-btn-ghost text-xs px-2 py-1"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 rounded-sm border border-dashed border-frontier-iron/50 bg-frontier-coal/20">
                <span className="text-base opacity-40">{meta.icon}</span>
                <span className="text-xs text-frontier-dust flex-1">Empty slot</span>
                <button
                    onClick={() => setPicking(p => !p)}
                    disabled={bench.length === 0}
                    className="frontier-btn-ghost text-xs px-2 py-1 border border-frontier-hide/40"
                >
                    Assign
                </button>
            </div>
            {picking && (
                <div className="ml-6 space-y-1 border-l-2 border-frontier-hide/40 pl-2">
                    {bench.map(b => (
                        <button
                            key={b.id}
                            onClick={() => { gameStore.getState().assignEmployee(b.id, role); setPicking(false); }}
                            className="w-full text-left text-xs px-2 py-1.5 rounded-sm bg-frontier-parchment dark:bg-frontier-coal hover:bg-frontier-aged dark:hover:bg-frontier-dirt border border-frontier-hide/40 text-frontier-coal dark:text-frontier-bone transition-all"
                        >
                            <span className="font-semibold">{b.name}</span>
                            <span className={`ml-1 capitalize text-xs ${RARITY_STYLES[b.rarity].text}`}>{b.rarity}</span>
                            <span className="ml-1 text-frontier-dust">· Power {getEmployeeRolePower(b, role).toFixed(1)}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function Roster({ roles }: { roles?: Role[] } = {}) {
    const employees = useGameStore(s => s.employees);
    const roleSlots = useGameStore(s => s.roleSlots);
    const hasSluiceBox = useGameStore(s => s.hasSluiceBox);
    const hasFurnace = useGameStore(s => s.hasFurnace);
    const hasMetalDetector = useGameStore(s => s.hasMetalDetector);
    const assayerLevel = useGameStore(s => s.npcLevels.assayer);
    const hasExcavator = useGameStore(s => s.hasExcavator);
    const hasWashplant = useGameStore(s => s.hasWashplant);
    const postedJobs = useGameStore(s => s.postedJobs);
    const gold = useGameStore(s => s.gold);
    const [collapsed, setCollapsed] = useState(false);

    const bench = employees.filter(e => e.assignedRole === null);
    const activeRoles = roles ?? ROLE_ORDER;
    const hasHeavyMachinery = hasExcavator || hasWashplant;

    function equipmentOwned(role: Role): boolean {
        if (role === 'sluiceOperator') return hasSluiceBox;
        if (role === 'driver') return hasSluiceBox;
        if (role === 'furnaceOperator') return hasFurnace;
        if (role === 'detectorOperator') return hasMetalDetector;
        if (role === 'teamster') return hasHeavyMachinery;
        return true;
    }

    function isLocked(role: Role): boolean {
        if (role === 'sluiceOperator') return !hasSluiceBox || !postedJobs.sluiceOperator;
        if (role === 'driver') return !hasSluiceBox || !postedJobs.driver;
        if (role === 'furnaceOperator') return !hasFurnace || !postedJobs.furnaceOperator;
        if (role === 'detectorOperator') return !hasMetalDetector || !postedJobs.detectorOperator;
        if (role === 'certifier') return assayerLevel < 2;
        if (role === 'teamster') return !hasHeavyMachinery || !postedJobs.teamster;
        return false;
    }

    const roleRows = activeRoles.map(role => {
        const meta = ROLE_META[role];
        const postingCost = JOB_POSTING_COSTS[role];
        const needsPosting = !!postingCost && equipmentOwned(role) && !postedJobs[role];
        const locked = isLocked(role);
        const slotCount = roleSlots[role] ?? DEFAULT_ROLE_SLOTS[role];
        const assigned = employees.filter(e => e.assignedRole === role);
        const filled = assigned.length;

        if (needsPosting) {
            return (
                <div key={role} className="space-y-1.5">
                    <span className="text-xs font-semibold text-frontier-dust">{meta.icon} {meta.label}</span>
                    <div className="flex items-center gap-2 p-2 rounded-sm border border-dashed border-frontier-ember/40 bg-frontier-ember/5">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-frontier-bone">📋 Post Job Opening</p>
                            <p className="text-xs text-frontier-dust">Enables crew assignment for this role</p>
                        </div>
                        <button
                            onClick={() => gameStore.getState().postJob(role)}
                            disabled={gold < postingCost}
                            className="frontier-btn-primary text-xs px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {postingCost.toLocaleString()} oz
                        </button>
                    </div>
                </div>
            );
        }

        const extra = slotCount - DEFAULT_ROLE_SLOTS[role];
        const slotCost = ROLE_SLOT_COSTS[role][extra];

        return (
            <div key={role} className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-frontier-dust">{meta.icon} {meta.label}</span>
                    {!locked && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-frontier-iron">{filled}/{slotCount} slots</span>
                            {slotCost !== undefined && (
                                <button
                                    onClick={() => gameStore.getState().buyRoleSlot(role)}
                                    disabled={gold < slotCost}
                                    className="frontier-btn-ghost text-xs px-1.5 py-0.5"
                                >
                                    +slot {slotCost.toLocaleString()} oz
                                </button>
                            )}
                        </div>
                    )}
                </div>
                {locked ? (
                    <RoleSlotRow role={role} emp={null} bench={bench} isLocked={true} equipmentReq={meta.equipment} />
                ) : (
                    <>
                        {assigned.map((emp, i) => (
                            <RoleSlotRow key={i} role={role} emp={emp} bench={bench} isLocked={false} />
                        ))}
                        {filled < slotCount && (
                            <RoleSlotRow key="empty" role={role} emp={null} bench={bench} isLocked={false} />
                        )}
                    </>
                )}
            </div>
        );
    });

    // Inline mine usage: collapsible header with assigned/total summary
    if (roles) {
        const totalFilled = activeRoles.reduce((n, r) => n + employees.filter(e => e.assignedRole === r).length, 0);
        const totalSlots  = activeRoles.reduce((n, r) => n + (roleSlots[r] ?? 0), 0);
        const label = activeRoles.map(r => ROLE_META[r].icon).join(' ');
        return (
            <div>
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="w-full flex items-center justify-between text-xs text-frontier-dust hover:text-frontier-bone py-0.5 transition-colors"
                >
                    <span className="font-semibold">{label} Crew — {totalFilled}/{totalSlots}</span>
                    <span className="text-frontier-iron">{collapsed ? '▸' : '▾'}</span>
                </button>
                {!collapsed && <div className="space-y-3 mt-2">{roleRows}</div>}
            </div>
        );
    }

    // Full Hiring Hall view
    return (
        <div className="space-y-3">
            <h4 className="frontier-label">Work Assignments</h4>
            {roleRows}
        </div>
    );
}

// ─── Forge ────────────────────────────────────────────────────────────────────

function Forge() {
    const gold = useGameStore(s => s.gold);
    const employees = useGameStore(s => s.employees);
    const [selected, setSelected] = useState<string[]>([]);

    const bench = employees.filter(e => e.assignedRole === null);

    function toggle(id: string) {
        setSelected(prev => {
            if (prev.includes(id)) return prev.filter(x => x !== id);
            const emp = bench.find(e => e.id === id)!;
            const firstSelected = bench.find(e => e.id === prev[0]);
            if (firstSelected && firstSelected.rarity !== emp.rarity) return prev;
            if (prev.length >= 3) return prev;
            return [...prev, id];
        });
    }

    const sel = selected.map(id => bench.find(e => e.id === id)).filter(Boolean) as typeof bench;
    const canForge = sel.length === 3 && sel.every(e => e.rarity === sel[0].rarity);
    const targetRarity = canForge ? RARITY_ORDER[RARITY_ORDER.indexOf(sel[0].rarity) + 1] : null;
    const forgeCost = targetRarity ? MERGE_COSTS[targetRarity] : 0;
    const canAfford = gold >= forgeCost;

    function doForge() {
        if (!canForge) return;
        const ids = selected as [string, string, string];
        const ok = gameStore.getState().mergeEmployees(ids);
        if (ok) setSelected([]);
    }

    const rarityGroups = RARITY_ORDER.filter(r => r !== 'legendary' || bench.some(e => e.rarity === 'legendary')).map(r => ({
        rarity: r,
        members: bench.filter(e => e.rarity === r),
    })).filter(g => g.members.length > 0);

    return (
        <div className="space-y-4">
            <p className="text-xs text-frontier-dust">Select 3 unassigned crew of the same rarity to forge them into one of the next tier.</p>

            {bench.length === 0 && (
                <p className="text-xs text-frontier-dust text-center py-6">No unassigned crew available.</p>
            )}

            {rarityGroups.map(({ rarity, members }) => {
                const s = RARITY_STYLES[rarity];
                const targetR = RARITY_ORDER[RARITY_ORDER.indexOf(rarity) + 1];
                const isMaxRarity = !targetR;
                return (
                    <div key={rarity} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold uppercase tracking-wider ${s.text}`}>{rarity}</span>
                            {!isMaxRarity && members.length >= 3 && (
                                <span className="text-xs text-frontier-dust">{members.length} available — {Math.floor(members.length / 3)} merge{Math.floor(members.length / 3) !== 1 ? 's' : ''} possible</span>
                            )}
                            {!isMaxRarity && members.length < 3 && (
                                <span className="text-xs text-frontier-dust">{members.length}/3</span>
                            )}
                        </div>
                        <div className="space-y-1">
                            {members.map(emp => {
                                const isSel = selected.includes(emp.id);
                                const selRarity = sel[0]?.rarity;
                                const isDisabled = isMaxRarity || (!isSel && selRarity && selRarity !== rarity) || (!isSel && selected.length >= 3);
                                return (
                                    <button
                                        key={emp.id}
                                        onClick={() => !isDisabled && toggle(emp.id)}
                                        disabled={!!isDisabled}
                                        className={`w-full flex items-center gap-2 p-2 rounded-sm border-2 text-left transition-all ${
                                            isSel
                                                ? `${s.border} bg-frontier-parchment dark:bg-frontier-dirt shadow-sm ring-2 ring-offset-1 ring-frontier-nugget`
                                                : isDisabled
                                                    ? 'border-frontier-iron/30 bg-frontier-coal/20 opacity-40 cursor-not-allowed'
                                                    : `border-frontier-iron/30 bg-frontier-parchment/50 dark:bg-frontier-coal/40 hover:border-frontier-hide`
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-frontier-coal dark:text-frontier-bone">{emp.name}</span>
                                                <span className={`text-xs px-1 rounded-sm capitalize ${s.badge}`}>{emp.rarity}</span>
                                            </div>
                                            <div className="flex gap-2 mt-0.5 text-xs text-frontier-dust">
                                                <span className="capitalize">{emp.rarity}</span>
                                            </div>
                                        </div>
                                        {isSel && <span className="text-frontier-nugget font-bold text-sm">✓</span>}
                                    </button>
                                );
            })}
                        </div>
                    </div>
                );
            })}

            {/* Forge action panel */}
            {sel.length > 0 && (
                <div className="sticky bottom-0 frontier-panel space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-frontier-bone">
                            {sel.length}/3 selected{targetRarity ? ` → ${targetRarity}` : ''}
                        </span>
                        <button onClick={() => setSelected([])} className="frontier-btn-ghost text-xs">Clear</button>
                    </div>

                    {canForge && targetRarity && (
                        <p className="text-xs text-center text-frontier-dust">
                            "{sel[0].name}" · {targetRarity} · starts at ×{SKILL_BASE[targetRarity].toFixed(1)} base skill
                        </p>
                    )}

                    <button
                        onClick={doForge}
                        disabled={!canForge || !canAfford}
                        className="w-full frontier-btn-primary py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {!canForge
                            ? `Select ${3 - sel.length} more`
                            : !canAfford
                                ? `Need ${forgeCost} oz (have ${gold.toFixed(0)})`
                                : `⚒️ Forge for ${forgeCost} oz`
                        }
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type HallTab = 'draft' | 'bench' | 'roster' | 'forge';

export function HiringHall() {
    const [tab, setTab] = useState<HallTab>('draft');

    return (
        <div className="space-y-4">
            <h3 className="font-display text-base text-frontier-bone tracking-wide">🏗️ Hiring Hall</h3>

            <div className="frontier-tab-bar">
                {([['draft', '📋 Candidates'], ['bench', '👥 Crew'], ['roster', '📌 Assignments'], ['forge', '⚒️ Forge']] as [HallTab, string][]).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={tab === id ? 'frontier-tab-active' : 'frontier-tab-inactive'}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div>
                {tab === 'draft'  && <DraftPool />}
                {tab === 'bench'  && <Bench />}
                {tab === 'roster' && <Roster />}
                {tab === 'forge'  && <Forge />}
            </div>
        </div>
    );
}
