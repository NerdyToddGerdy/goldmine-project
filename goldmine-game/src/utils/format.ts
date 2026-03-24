const SUFFIXES: [number, string][] = [
    [1_000_000_000, 'B'],
    [1_000_000, 'M'],
    [1_000, 'K'],
];

export function formatNumber(n: number): string {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';

    for (const [threshold, suffix] of SUFFIXES) {
        if (abs >= threshold) {
            return `${sign}${(abs / threshold).toFixed(2)}${suffix}`;
        }
    }

    return `${sign}${abs.toFixed(2)}`;
}

export function formatRate(n: number): string {
    if (n === 0) return '0.00/sec';
    const prefix = n > 0 ? '+' : '';
    return `${prefix}${formatNumber(n)}/sec`;
}
