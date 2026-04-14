import { useState, useRef, useCallback, type ReactNode } from 'react';

interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
}

/**
 * Wraps children with a hover tooltip (and 300 ms long-press on touch).
 * Renders the popover above the target.
 */
export function Tooltip({ content, children }: TooltipProps) {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const show = useCallback(() => setVisible(true), []);
    const hide = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setVisible(false);
    }, []);

    const onTouchStart = useCallback(() => {
        timerRef.current = setTimeout(() => setVisible(true), 300);
    }, []);

    const onTouchEnd = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    return (
        <span
            className="relative inline-block"
            onMouseEnter={show}
            onMouseLeave={hide}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {children}
            {visible && (
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-max max-w-[200px] rounded-sm bg-frontier-coal border border-frontier-iron px-2.5 py-1.5 text-xs text-frontier-bone shadow-xl leading-tight">
                    {content}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-frontier-coal" />
                </span>
            )}
        </span>
    );
}
