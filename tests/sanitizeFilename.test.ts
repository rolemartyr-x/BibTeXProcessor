import { describe, expect, it } from 'vitest';
import { sanitizeFilename } from '../sanitizeFilename';

describe('sanitizeFilename', () => {
    it('leaves ordinary titles untouched', () => {
        expect(sanitizeFilename('A Study of Word Meanings')).toBe('A Study of Word Meanings');
    });

    it('replaces characters illegal in filenames', () => {
        expect(sanitizeFilename('Report: A/B Testing "Results" <2024>')).toBe(
            'Report_ A_B Testing _Results_ _2024_'
        );
    });

    it('replaces backslashes, colons, asterisks, question marks, and pipes', () => {
        expect(sanitizeFilename('a\\b:c*d?e|f')).toBe('a_b_c_d_e_f');
    });

    it('collapses ".." sequences so paths cannot escape the target folder', () => {
        expect(sanitizeFilename('../../etc/passwd')).not.toContain('..');
    });

    it('strips leading and trailing dots and whitespace', () => {
        expect(sanitizeFilename('  ..hidden file..  ')).toBe('hidden file');
    });

    it('falls back to a default name when nothing usable remains', () => {
        expect(sanitizeFilename('')).toBe('untitled');
        expect(sanitizeFilename('...')).toBe('untitled');
        expect(sanitizeFilename('   ')).toBe('untitled');
    });

    it('truncates excessively long names', () => {
        const longName = 'a'.repeat(500);
        const result = sanitizeFilename(longName);
        expect(result.length).toBeLessThanOrEqual(200);
    });

    it('strips control characters', () => {
        const withControlChars = 'bad' + String.fromCharCode(7) + 'name' + String.fromCharCode(31);
        expect(sanitizeFilename(withControlChars)).toBe('badname');
    });
});
