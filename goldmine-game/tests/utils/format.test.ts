import { describe, it, expect } from 'vitest';
import { formatNumber, formatRate } from '../../src/utils/format';

describe('formatNumber', () => {
    it('shows decimals below 1000', () => {
        expect(formatNumber(0)).toBe('0.00');
        expect(formatNumber(1)).toBe('1.00');
        expect(formatNumber(3.14159)).toBe('3.14');
        expect(formatNumber(999.99)).toBe('999.99');
    });

    it('uses K suffix from 1000', () => {
        expect(formatNumber(1000)).toBe('1.00K');
        expect(formatNumber(1234)).toBe('1.23K');
        expect(formatNumber(999_999)).toBe('1000.00K');
    });

    it('uses M suffix from 1,000,000', () => {
        expect(formatNumber(1_000_000)).toBe('1.00M');
        expect(formatNumber(4_560_000)).toBe('4.56M');
        expect(formatNumber(999_999_999)).toBe('1000.00M');
    });

    it('uses B suffix from 1,000,000,000', () => {
        expect(formatNumber(1_000_000_000)).toBe('1.00B');
        expect(formatNumber(7_890_000_000)).toBe('7.89B');
    });

    it('handles negative values', () => {
        expect(formatNumber(-1)).toBe('-1.00');
        expect(formatNumber(-1500)).toBe('-1.50K');
        expect(formatNumber(-2_000_000)).toBe('-2.00M');
    });
});

describe('formatRate', () => {
    it('shows +prefix for positive', () => {
        expect(formatRate(1.5)).toBe('+1.50/sec');
        expect(formatRate(1000)).toBe('+1.00K/sec');
    });

    it('shows -prefix for negative', () => {
        expect(formatRate(-1.5)).toBe('-1.50/sec');
    });

    it('shows no prefix for zero', () => {
        expect(formatRate(0)).toBe('0.00/sec');
    });
});
