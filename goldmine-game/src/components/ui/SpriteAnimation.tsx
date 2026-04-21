import { useEffect, useRef, useState } from 'react';

interface SpriteAnimationProps {
    src: string;
    frameWidth: number;
    frameHeight: number;
    totalWidth: number;
    totalHeight: number;
    frameCount: number;
    rowIndex: number;
    fps: number;
    displayHeight: number;
    playing?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

export function SpriteAnimation({
    src, frameWidth, frameHeight, totalWidth, totalHeight,
    frameCount, rowIndex, fps, displayHeight,
    playing = true, className, style,
}: SpriteAnimationProps) {
    const [frameIndex, setFrameIndex] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (!playing) { setFrameIndex(0); return; }
        intervalRef.current = setInterval(() => {
            setFrameIndex(i => (i + 1) % frameCount);
        }, 1000 / fps);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [playing, frameCount, fps]);

    const scale = displayHeight / frameHeight;
    const displayWidth = frameWidth * scale;

    return (
        <div
            className={className}
            style={{
                width: displayWidth,
                height: displayHeight,
                backgroundImage: `url(${src})`,
                backgroundSize: `${totalWidth * scale}px ${totalHeight * scale}px`,
                backgroundPosition: `${-frameIndex * frameWidth * scale}px ${-rowIndex * frameHeight * scale}px`,
                backgroundRepeat: 'no-repeat',
                imageRendering: 'pixelated',
                ...style,
            }}
        />
    );
}
