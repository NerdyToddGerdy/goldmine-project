import { useState, useEffect } from 'react';
import { gameStore, useGameStore, getHireCost, EMPLOYEE_WAGES, getEmployeeRolePower } from '../store/gameStore';
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

function StatPips({ value, max = 10 }: { value: number; max?: number }) {
    return (
        <div className="flex gap-0.5">
            {Array.from({ length: max }, (_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < value ? 'bg-amber-500' : 'bg-gray-200'}`} />
            ))}
        </div>
    );
}

function EmployeeCard({ emp, children }: { emp: Employee; children?: React.ReactNode }) {
    const s = RARITY_STYLES[emp.rarity];
    return (
        <div className={`p-3 rounded-xl border-2 bg-white space-y-2 ${s.border}`}>
            <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">{emp.name}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full capitalize ${s.badge}`}>{emp.rarity}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-gray-500">
                <div className="flex items-center justify-between gap-1">
                    <span>Brawn</span>
                    <StatPips value={emp.stats.brawn} />
                </div>
                <div className="flex items-center justify-between gap-1">
                    <span>Dex</span>
                    <StatPips value={emp.stats.dexterity} />
                </div>
                <div className="flex items-center justify-between gap-1">
                    <span>Tech</span>
                    <StatPips value={emp.stats.technical} />
                </div>
                <div className="flex items-center justify-between gap-1">
                    <span>Hustle</span>
                    <StatPips value={emp.stats.hustle} />
                </div>
            </div>
            {children}
        </div>
    );
}

// ─── Draft Pool ───────────────────────────────────────────────────────────────

function DraftPool() {
    const money = useGameStore(s => s.money);
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
                    disabled={money < refreshCost}
                    className="text-xs px-3 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold border border-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Refresh Pool (${refreshCost})
                </button>
            </div>

            {draftPool.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Generating candidates…</p>
            ) : (
                <div className="space-y-2">
                    {draftPool.map(emp => {
                        const cost = getHireCost(emp);
                        const canAfford = money >= cost;
                        return (
                            <EmployeeCard key={emp.id} emp={emp}>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="text-xs text-gray-500">Hire: <span className="font-semibold text-gray-700">${cost}</span></span>
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
                            <div className="flex items-center justify-between pt-1">
                                <span className="text-xs text-gray-500">Wage: <span className="font-semibold">${EMPLOYEE_WAGES[emp.rarity].toFixed(2)}/s</span></span>
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
        return (
            <div className={`flex items-center gap-2 p-2 rounded-lg border-2 bg-white ${s.border}`}>
                <span className="text-base">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-800 truncate">{emp.name}</span>
                        <span className={`text-xs px-1 rounded capitalize ${s.badge}`}>{emp.rarity}</span>
                    </div>
                    <span className="text-xs text-gray-400">Power {power.toFixed(1)}</span>
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

function Roster() {
    const employees = useGameStore(s => s.employees);
    const roleSlots = useGameStore(s => s.roleSlots);
    const hasSluiceBox = useGameStore(s => s.hasSluiceBox);
    const hasFurnace = useGameStore(s => s.hasFurnace);
    const hasMetalDetector = useGameStore(s => s.hasMetalDetector);
    const assayerLevel = useGameStore(s => s.npcLevels.assayer);

    const bench = employees.filter(e => e.assignedRole === null);

    function isLocked(role: Role): boolean {
        if (role === 'sluiceOperator') return !hasSluiceBox;
        if (role === 'furnaceOperator') return !hasFurnace;
        if (role === 'detectorOperator') return !hasMetalDetector;
        if (role === 'certifier') return assayerLevel < 2;
        return false;
    }

    return (
        <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Work Assignments</h4>
            {ROLE_ORDER.map(role => {
                const meta = ROLE_META[role];
                const locked = isLocked(role);
                const slotCount = roleSlots[role];
                const assigned = employees.filter(e => e.assignedRole === role);
                const filled = assigned.length;

                return (
                    <div key={role} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-600">{meta.icon} {meta.label}</span>
                            {!locked && <span className="text-xs text-gray-400">{filled}/{slotCount} slots</span>}
                        </div>
                        {locked ? (
                            <RoleSlotRow role={role} emp={null} bench={bench} isLocked={true} equipmentReq={meta.equipment} />
                        ) : (
                            Array.from({ length: slotCount }, (_, i) => (
                                <RoleSlotRow
                                    key={i}
                                    role={role}
                                    emp={assigned[i] ?? null}
                                    bench={bench}
                                    isLocked={false}
                                />
                            ))
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type HallTab = 'draft' | 'bench' | 'roster';

export function HiringHall() {
    const [tab, setTab] = useState<HallTab>('draft');

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-800">🏗️ Hiring Hall</h3>

            <div className="flex gap-1 border-b-2 border-gray-200">
                {([['draft', '📋 Candidates'], ['bench', '👥 Crew'], ['roster', '📌 Assignments']] as [HallTab, string][]).map(([id, label]) => (
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
            </div>
        </div>
    );
}
