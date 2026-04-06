import { useState, useEffect } from 'react';
import { gameStore, useGameStore, getHireCost, getEmployeeRolePower, getEmployeeLevel, computeEmployeeStats, STAT_BASE, EMPLOYEE_LEVEL_CAPS, MERGE_COSTS, RARITY_ORDER, JOB_POSTING_COSTS } from '../store/gameStore';
import type { Employee, Role } from '../store/schema';

const RARITY_STYLES: Record<string, { border: string; badge: string; text: string }> = {
    common:    { border: 'border-gray-300',    badge: 'bg-gray-100 text-gray-600',     text: 'text-gray-600'     },
    uncommon:  { border: 'border-green-400',   badge: 'bg-green-100 text-green-700',   text: 'text-green-700'    },
    rare:      { border: 'border-blue-400',    badge: 'bg-blue-100 text-blue-700',     text: 'text-blue-700'     },
    epic:      { border: 'border-purple-400',  badge: 'bg-purple-100 text-purple-700', text: 'text-purple-700'   },
    legendary: { border: 'border-amber-400',   badge: 'bg-amber-100 text-amber-700',   text: 'text-amber-700'    },
};

const ROLE_META: Record<Role, { label: string; icon: string; equipment?: string }> = {
    miner:            { label: 'Miner',             icon: '⛏️' },
    hauler:           { label: 'Hauler',             icon: '🛒' },
    prospector:       { label: 'Prospector',         icon: '🔭' },
    sluiceOperator:   { label: 'Sluice Operator',    icon: '🚿', equipment: 'Sluice Box'     },
    furnaceOperator:  { label: 'Furnace Operator',   icon: '⚗️', equipment: 'Furnace'        },
    detectorOperator: { label: 'Detector Operator',  icon: '🔍', equipment: 'Metal Detector' },
    certifier:        { label: 'Certifier',          icon: '⚖️', equipment: 'Assayer Level 2' },
};

const ROLE_ORDER: Role[] = ['miner', 'hauler', 'prospector', 'sluiceOperator', 'furnaceOperator', 'detectorOperator', 'certifier'];

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-10 shrink-0 text-gray-500">{label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
            </div>
            <span className="w-8 text-right font-semibold text-gray-700">{value}/{max}</span>
        </div>
    );
}

function EmployeeCard({ emp, children }: { emp: Employee; children?: React.ReactNode }) {
    const s = RARITY_STYLES[emp.rarity];
    const stats = computeEmployeeStats(emp);
    const statMax = STAT_BASE[emp.rarity] + EMPLOYEE_LEVEL_CAPS[emp.rarity];
    return (
        <div className={`p-3 rounded-xl border-2 bg-white space-y-2 ${s.border}`}>
            <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">{emp.name}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full capitalize ${s.badge}`}>{emp.rarity}</span>
            </div>
            <div className="space-y-1 text-xs">
                <StatBar label="Brawn"  value={stats.brawn}     max={statMax} />
                <StatBar label="Dex"    value={stats.dexterity} max={statMax} />
                <StatBar label="Tech"   value={stats.technical} max={statMax} />
                <StatBar label="Hustle" value={stats.hustle}    max={statMax} />
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

    // Auto-populate on first mount
    useEffect(() => {
        if (draftPool.length === 0) {
            gameStore.getState().refreshDraftPool();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Candidates</h4>
                <button
                    onClick={() => gameStore.getState().refreshDraftPool()}
                    disabled={gold < refreshCost}
                    className="text-xs px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold border border-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Refresh Pool ({refreshCost} oz)
                </button>
            </div>

            {draftPool.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Generating candidates…</p>
            ) : (
                <div className="space-y-2">
                    {draftPool.map(emp => {
                        const cost = getHireCost(emp);
                        const canAfford = gold >= cost;
                        return (
                            <EmployeeCard key={emp.id} emp={emp}>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-gray-500">Hire: <span className="font-semibold text-gray-700">{cost} oz</span></span>
                                    <button
                                        onClick={() => gameStore.getState().hireEmployee(emp.id)}
                                        disabled={!canAfford}
                                        className="text-xs px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Hire
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
    const bench = employees.filter(e => e.assignedRole === null);

    return (
        <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Your Crew (Unassigned)</h4>
            {bench.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No idle crew. Hire someone or unassign a worker.</p>
            ) : (
                <div className="space-y-2">
                    {bench.map(emp => (
                        <EmployeeCard key={emp.id} emp={emp}>
                            <div className="flex items-center justify-end pt-1">
                                <button
                                    onClick={() => gameStore.getState().dismissEmployee(emp.id)}
                                    className="text-xs px-3 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold border border-red-300 transition-all"
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
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-dashed border-gray-200 opacity-60">
                <span className="text-base">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-500">{meta.label}</span>
                    {equipmentReq && <span className="text-xs text-gray-400 ml-1">— requires {equipmentReq}</span>}
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
            <div className={`flex items-center gap-2 p-2 rounded-lg border-2 bg-white ${s.border}`}>
                <span className="text-base">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-800 truncate">{emp.name}</span>
                        <span className={`text-xs px-1 rounded capitalize ${s.badge}`}>{emp.rarity}</span>
                        <span className="text-xs text-gray-500">L{level}{level >= cap ? ' ★' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${level >= cap ? 'bg-amber-400' : 'bg-blue-400'}`}
                                style={{ width: `${xpPct}%` }}
                            />
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">Pwr {power.toFixed(1)}</span>
                    </div>
                </div>
                <button
                    onClick={() => gameStore.getState().unassignEmployee(emp.id)}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-300 transition-all"
                >
                    ✕
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50">
                <span className="text-base opacity-40">{meta.icon}</span>
                <span className="text-xs text-gray-400 flex-1">Empty slot</span>
                <button
                    onClick={() => setPicking(p => !p)}
                    disabled={bench.length === 0}
                    className="text-xs px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Assign
                </button>
            </div>
            {picking && (
                <div className="ml-6 space-y-1 border-l-2 border-amber-200 pl-2">
                    {bench.map(b => (
                        <button
                            key={b.id}
                            onClick={() => { gameStore.getState().assignEmployee(b.id, role); setPicking(false); }}
                            className="w-full text-left text-xs px-2 py-1.5 rounded bg-white hover:bg-amber-50 border border-amber-200 text-gray-700 transition-all"
                        >
                            <span className="font-semibold">{b.name}</span>
                            <span className={`ml-1 capitalize text-xs ${RARITY_STYLES[b.rarity].text}`}>{b.rarity}</span>
                            <span className="ml-1 text-gray-400">· Power {getEmployeeRolePower(b, role).toFixed(1)}</span>
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
    const postedJobs = useGameStore(s => s.postedJobs);
    const gold = useGameStore(s => s.gold);
    const [collapsed, setCollapsed] = useState(false);

    const bench = employees.filter(e => e.assignedRole === null);
    const activeRoles = roles ?? ROLE_ORDER;

    function equipmentOwned(role: Role): boolean {
        if (role === 'sluiceOperator') return hasSluiceBox;
        if (role === 'furnaceOperator') return hasFurnace;
        if (role === 'detectorOperator') return hasMetalDetector;
        return true;
    }

    function isLocked(role: Role): boolean {
        if (role === 'sluiceOperator') return !hasSluiceBox || !postedJobs.sluiceOperator;
        if (role === 'furnaceOperator') return !hasFurnace || !postedJobs.furnaceOperator;
        if (role === 'detectorOperator') return !hasMetalDetector || !postedJobs.detectorOperator;
        if (role === 'certifier') return assayerLevel < 2;
        return false;
    }

    const roleRows = activeRoles.map(role => {
        const meta = ROLE_META[role];
        const postingCost = JOB_POSTING_COSTS[role];
        const needsPosting = !!postingCost && equipmentOwned(role) && !postedJobs[role];
        const locked = isLocked(role);
        const slotCount = roleSlots[role];
        const assigned = employees.filter(e => e.assignedRole === role);
        const filled = assigned.length;

        if (needsPosting) {
            return (
                <div key={role} className="space-y-1.5">
                    <span className="text-xs font-semibold text-gray-600">{meta.icon} {meta.label}</span>
                    <div className="flex items-center gap-2 p-2 rounded-lg border border-dashed border-amber-300 bg-amber-50">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-amber-800">📋 Post Job Opening</p>
                            <p className="text-xs text-amber-600">Enables crew assignment for this role</p>
                        </div>
                        <button
                            onClick={() => gameStore.getState().postJob(role)}
                            disabled={gold < postingCost}
                            className="text-xs px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {postingCost.toLocaleString()} oz
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div key={role} className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600">{meta.icon} {meta.label}</span>
                    {!locked && <span className="text-xs text-gray-400">{filled}/{slotCount} slots</span>}
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
                    className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-700 py-0.5 transition-colors"
                >
                    <span className="font-semibold">{label} Crew — {totalFilled}/{totalSlots}</span>
                    <span className="text-gray-400">{collapsed ? '▸' : '▾'}</span>
                </button>
                {!collapsed && <div className="space-y-3 mt-2">{roleRows}</div>}
            </div>
        );
    }

    // Full Hiring Hall view
    return (
        <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Work Assignments</h4>
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
            // Only allow selecting same rarity as already-selected
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
            <p className="text-xs text-gray-500">Select 3 unassigned crew of the same rarity to forge them into one of the next tier.</p>

            {bench.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-6">No unassigned crew available.</p>
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
                                <span className="text-xs text-gray-400">{members.length} available — {Math.floor(members.length / 3)} merge{Math.floor(members.length / 3) !== 1 ? 's' : ''} possible</span>
                            )}
                            {!isMaxRarity && members.length < 3 && (
                                <span className="text-xs text-gray-400">{members.length}/3</span>
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
                                        className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 text-left transition-all ${
                                            isSel
                                                ? `${s.border} bg-white shadow-sm ring-2 ring-offset-1 ring-amber-400`
                                                : isDisabled
                                                    ? 'border-gray-200 bg-gray-50 opacity-40 cursor-not-allowed'
                                                    : `border-gray-200 bg-white hover:${s.border} hover:bg-gray-50`
                                        }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-semibold text-gray-800">{emp.name}</span>
                                                <span className={`text-xs px-1 rounded capitalize ${s.badge}`}>{emp.rarity}</span>
                                            </div>
                                            <div className="flex gap-2 mt-0.5 text-xs text-gray-400">
                                                {(() => { const st = computeEmployeeStats(emp); return (<><span>Brawn {st.brawn}</span><span>Dex {st.dexterity}</span><span>Tech {st.technical}</span><span>Hustle {st.hustle}</span></>); })()}
                                            </div>
                                        </div>
                                        {isSel && <span className="text-amber-500 font-bold text-sm">✓</span>}
                                    </button>
                                );
            })}
                        </div>
                    </div>
                );
            })}

            {/* Forge action panel */}
            {sel.length > 0 && (
                <div className="sticky bottom-0 p-3 rounded-xl border-2 border-amber-300 bg-amber-50 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-800">
                            {sel.length}/3 selected{targetRarity ? ` → ${targetRarity}` : ''}
                        </span>
                        <button onClick={() => setSelected([])} className="text-xs text-amber-500 hover:text-amber-700">Clear</button>
                    </div>

                    {canForge && targetRarity && (
                        <div className="space-y-1 text-xs text-amber-700">
                            <div className="flex gap-3 justify-center font-mono">
                                {(['Brawn', 'Dex', 'Tech', 'Hustle'] as const).map(label => (
                                    <div key={label} className="text-center">
                                        <div className="text-gray-400">{label}</div>
                                        <div className="font-bold text-amber-800">{STAT_BASE[targetRarity]}</div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-center text-amber-600">"{sel[0].name}" · {targetRarity} · starts at base {STAT_BASE[targetRarity]}</p>
                        </div>
                    )}

                    <button
                        onClick={doForge}
                        disabled={!canForge || !canAfford}
                        className="w-full py-2 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h3 className="text-lg font-semibold text-green-800">🏗️ Hiring Hall</h3>

            <div className="flex gap-1 border-b-2 border-gray-200">
                {([['draft', '📋 Candidates'], ['bench', '👥 Crew'], ['roster', '📌 Assignments'], ['forge', '⚒️ Forge']] as [HallTab, string][]).map(([id, label]) => (
                    <button
                        key={id}
                        onClick={() => setTab(id)}
                        className={`flex-1 px-2 py-2 text-xs font-semibold rounded-t-lg transition-all border-2 ${
                            tab === id
                                ? 'bg-gray-100 text-gray-900 border-gray-200 border-b-0'
                                : 'bg-white/50 text-gray-600 hover:bg-white/80 border-transparent'
                        }`}
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
