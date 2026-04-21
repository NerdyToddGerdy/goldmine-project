interface BuildingProps {
    emoji: string;
    name: string;
    locked: boolean;
    lockHint?: string;
    onClick: () => void;
    children?: React.ReactNode;
}

const roofClip = 'polygon(0% 100%, 0% 45%, 12% 0%, 88% 0%, 100% 45%, 100% 100%)';

export function Building({ emoji, name, locked, lockHint, onClick, children }: BuildingProps) {
    if (locked) {
        return (
            <div className="flex flex-col items-center gap-1 select-none">
                <div className="relative w-24">
                    {/* Facade */}
                    <div
                        className="w-full border-2 border-dashed border-frontier-iron overflow-hidden"
                        style={{ background: 'var(--fw-coal)' }}
                    >
                        {/* Roofline */}
                        <div
                            className="w-full h-5"
                            style={{ background: 'var(--fw-iron)', clipPath: roofClip }}
                        />

                        {/* Sign board */}
                        <div
                            className="w-full flex items-center justify-center gap-1 px-1 py-1"
                            style={{ borderBottom: '1px solid var(--fw-iron)', background: 'color-mix(in srgb, var(--fw-iron) 50%, var(--fw-coal))' }}
                        >
                            <span className="text-sm opacity-15 leading-none">{emoji}</span>
                            <span className="text-sm font-bold leading-none" style={{ color: 'var(--fw-dust)' }}>?</span>
                        </div>

                        {/* Windows — boarded */}
                        <div className="flex items-center justify-around px-2 py-1.5" style={{ background: 'color-mix(in srgb, var(--fw-coal) 85%, transparent)' }}>
                            <div className="relative w-7 h-5 border border-frontier-iron/60" style={{ background: 'var(--fw-iron)' }}>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--fw-dust)', opacity: 0.6 }}>✕</span>
                            </div>
                            <div className="relative w-7 h-5 border border-frontier-iron/60" style={{ background: 'var(--fw-iron)' }}>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: 'var(--fw-dust)', opacity: 0.6 }}>✕</span>
                            </div>
                        </div>

                        {/* Door — shut */}
                        <div className="flex items-end justify-center" style={{ background: 'color-mix(in srgb, var(--fw-coal) 85%, transparent)' }}>
                            <div
                                className="w-6 h-7 border-2 border-frontier-iron"
                                style={{ borderRadius: '40% 40% 0 0 / 60% 60% 0 0', background: 'var(--fw-iron)' }}
                            />
                        </div>

                        {/* Base strip */}
                        <div className="w-full h-1.5" style={{ background: 'var(--fw-iron)' }} />
                    </div>
                </div>

                {lockHint && (
                    <p className="text-center text-xs text-frontier-dust max-w-[96px] leading-tight">{lockHint}</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1 select-none">
            <button
                onClick={onClick}
                className="relative w-24 group transition-all duration-150 active:scale-95 focus:outline-none"
            >
                {/* Badge */}
                {children && (
                    <span className="absolute -top-1.5 -right-1.5 z-10 text-xs bg-frontier-sage text-frontier-bone rounded-sm px-1 font-bold leading-tight min-w-[18px] text-center">
                        {children}
                    </span>
                )}

                {/* Facade */}
                <div
                    className="w-full border-2 border-frontier-hide group-hover:border-frontier-ember transition-colors duration-150 shadow-md overflow-hidden"
                    style={{ background: 'var(--fw-parchment)' }}
                >
                    {/* Roofline */}
                    <div
                        className="w-full h-5 relative overflow-hidden"
                        style={{ background: 'var(--fw-hide)', clipPath: roofClip }}
                    >
                        <div className="absolute bottom-1 left-2 right-2 h-px opacity-30" style={{ background: 'var(--fw-aged)' }} />
                    </div>

                    {/* Sign board */}
                    <div
                        className="w-full flex items-center justify-center gap-1 px-1 py-1"
                        style={{ borderBottom: '1px solid var(--fw-hide)', background: 'var(--fw-aged)' }}
                    >
                        <span className="text-sm leading-none">{emoji}</span>
                        <span
                            className="text-[9px] font-display leading-tight truncate max-w-[52px] uppercase tracking-wide"
                            style={{ color: 'var(--fw-coal)' }}
                        >
                            {name}
                        </span>
                    </div>

                    {/* Windows — lit */}
                    <div className="flex items-center justify-around px-2 py-1.5" style={{ background: 'var(--fw-parchment)' }}>
                        <div
                            className="building-window-lit w-7 h-5 border border-frontier-hide/60"
                            style={{ background: 'linear-gradient(135deg, #fde68a, #fbbf24)' }}
                        />
                        <div
                            className="building-window-lit w-7 h-5 border border-frontier-hide/60"
                            style={{ background: 'linear-gradient(135deg, #fde68a, #fbbf24)' }}
                        />
                    </div>

                    {/* Door */}
                    <div className="flex items-end justify-center" style={{ background: 'var(--fw-parchment)' }}>
                        <div
                            className="w-6 h-7 border-2 border-frontier-hide"
                            style={{ borderRadius: '40% 40% 0 0 / 60% 60% 0 0', background: 'var(--fw-dirt)' }}
                        />
                    </div>

                    {/* Base strip */}
                    <div className="w-full h-1.5" style={{ background: 'var(--fw-hide)' }} />
                </div>
            </button>
        </div>
    );
}
