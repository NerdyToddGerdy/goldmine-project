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
                <div className="relative w-16 h-16 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                    <span className="text-2xl opacity-20">{emoji}</span>
                    <span className="absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-lg">?</span>
                </div>
                {lockHint && (
                    <p className="text-center text-xs text-gray-400 max-w-[72px] leading-tight">{lockHint}</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1 select-none">
            <button
                onClick={onClick}
                className="relative w-16 h-16 flex flex-col items-center justify-center rounded-xl border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 active:scale-95 transition-all shadow-sm"
            >
                <span className="text-2xl leading-none">{emoji}</span>
                {children && (
                    <span className="absolute -top-1.5 -right-1.5 text-xs bg-green-500 text-white rounded-full px-1 font-bold leading-tight min-w-[18px] text-center">
                        {children}
                    </span>
                )}
            </button>
            <span className="text-xs font-semibold text-amber-900 text-center max-w-[72px] leading-tight">{name}</span>
        </div>
    );
}
