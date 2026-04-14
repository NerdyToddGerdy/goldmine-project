interface BuildingProps {
    emoji: string;
    name: string;
    locked: boolean;
    lockHint?: string;
    onClick: () => void;
    children?: React.ReactNode;
}

export function Building({ emoji, name, locked, lockHint, onClick, children }: BuildingProps) {
    if (locked) {
        return (
            <div className="flex flex-col items-center gap-1 select-none">
                <div className="relative w-16 h-16 flex items-center justify-center rounded-sm border-2 border-dashed border-frontier-iron bg-frontier-coal/20 dark:bg-frontier-coal/60">
                    <span className="text-2xl opacity-20">{emoji}</span>
                    <span className="absolute inset-0 flex items-center justify-center text-frontier-dust font-bold text-lg">?</span>
                </div>
                {lockHint && (
                    <p className="text-center text-xs text-frontier-dust max-w-[72px] leading-tight">{lockHint}</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1 select-none">
            <button
                onClick={onClick}
                className="relative w-16 h-16 flex flex-col items-center justify-center rounded-sm border-2 border-frontier-hide bg-frontier-parchment dark:bg-frontier-dirt hover:bg-frontier-aged dark:hover:bg-frontier-dirt/80 hover:border-frontier-ember active:scale-95 transition-all shadow-sm"
            >
                <span className="text-2xl leading-none">{emoji}</span>
                {children && (
                    <span className="absolute -top-1.5 -right-1.5 text-xs bg-frontier-sage text-frontier-bone rounded-sm px-1 font-bold leading-tight min-w-[18px] text-center">
                        {children}
                    </span>
                )}
            </button>
            <span className="text-xs font-semibold text-frontier-coal dark:text-frontier-bone text-center max-w-[72px] leading-tight">{name}</span>
        </div>
    );
}
