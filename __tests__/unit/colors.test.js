/**
 * Unit Tests for Color Engine (lib/colors.js)
 */

import { getColorHex, COLOR_PALETTE } from '@/lib/colors';

describe('Color Engine (lib/colors.js)', () => {
    test('resolves standard single-word CSS colors', () => {
        expect(getColorHex('black')).toBe('#0f172a');
        expect(getColorHex('white')).toBe('#ffffff');
        expect(getColorHex('red')).toBe('#dc2626');
        expect(getColorHex('blue')).toBe('#2563eb');
        expect(getColorHex('gold')).toBe('#ffd700');
    });

    test('resolves multi-word apparel colors correctly', () => {
        expect(getColorHex('dark green')).toBe('#006400');
        expect(getColorHex('navy blue')).toBe('#000080');
        expect(getColorHex('bottle green')).toBe('#094d2a');
        expect(getColorHex('olive green')).toBe('#556b2f');
        expect(getColorHex('wine red')).toBe('#722f37');
        expect(getColorHex('sky blue')).toBe('#0ea5e9');
        expect(getColorHex('charcoal grey')).toBe('#374151');
        expect(getColorHex('rose pink')).toBe('#ff66cc');
    });

    test('is insensitive to casing, extra spaces, hyphens, and underscores', () => {
        expect(getColorHex('DARK GREEN')).toBe('#006400');
        expect(getColorHex('Dark Green')).toBe('#006400');
        expect(getColorHex('  dark   green  ')).toBe('#006400');
        expect(getColorHex('dark-green')).toBe('#006400');
        expect(getColorHex('dark_green')).toBe('#006400');
        expect(getColorHex('NAVY BLUE')).toBe('#000080');
        expect(getColorHex('bottle-green')).toBe('#094d2a');
    });

    test('prioritizes valid explicit colorCode parameter if provided', () => {
        expect(getColorHex('Custom Color', '#006400')).toBe('#006400');
        expect(getColorHex('Random Name', '#123456')).toBe('#123456');
        expect(getColorHex('Random Name', 'rgb(0, 100, 0)')).toBe('rgb(0, 100, 0)');
    });

    test('supports direct hex inputs as colorName', () => {
        expect(getColorHex('#ff0000')).toBe('#ff0000');
        expect(getColorHex('#006400')).toBe('#006400');
    });

    test('generates dual-tone split gradient for combo colors with slash or ampersand', () => {
        const comboSlash = getColorHex('Black/White');
        expect(comboSlash).toContain('linear-gradient(135deg,');
        expect(comboSlash).toContain('#0f172a 50%');
        expect(comboSlash).toContain('#ffffff 50%');

        const comboAmpersand = getColorHex('Navy & Gold');
        expect(comboAmpersand).toContain('linear-gradient(135deg,');
        expect(comboAmpersand).toContain('#000080 50%');
        expect(comboAmpersand).toContain('#ffd700 50%');
    });

    test('gracefully falls back for empty, null, or undefined values', () => {
        expect(getColorHex(null)).toBe('#64748B');
        expect(getColorHex(undefined)).toBe('#64748B');
        expect(getColorHex('')).toBe('#64748B');
        expect(getColorHex('   ')).toBe('#64748B');
    });
});
