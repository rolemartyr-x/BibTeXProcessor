import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { sanitizeFilename } from '../sanitizeFilename';

describe('sanitizeFilename', () => {
    it('leaves ordinary titles untouched', () => {
        assert.strictEqual(sanitizeFilename('A Study of Word Meanings'), 'A Study of Word Meanings');
    });

    it('replaces characters illegal in filenames', () => {
        assert.strictEqual(
            sanitizeFilename('Report: A/B Testing "Results" <2024>'),
            'Report_ A_B Testing _Results_ _2024_'
        );
    });

    it('replaces backslashes, colons, asterisks, question marks, and pipes', () => {
        assert.strictEqual(sanitizeFilename('a\\b:c*d?e|f'), 'a_b_c_d_e_f');
    });

    it('collapses ".." sequences so paths cannot escape the target folder', () => {
        assert.ok(!sanitizeFilename('../../etc/passwd').includes('..'));
    });

    it('strips leading and trailing dots and whitespace', () => {
        assert.strictEqual(sanitizeFilename('  ..hidden file..  '), 'hidden file');
    });

    it('falls back to a default name when nothing usable remains', () => {
        assert.strictEqual(sanitizeFilename(''), 'untitled');
        assert.strictEqual(sanitizeFilename('...'), 'untitled');
        assert.strictEqual(sanitizeFilename('   '), 'untitled');
    });

    it('truncates excessively long names', () => {
        const longName = 'a'.repeat(500);
        const result = sanitizeFilename(longName);
        assert.ok(result.length <= 200);
    });

    it('strips control characters', () => {
        const withControlChars = 'bad' + String.fromCharCode(7) + 'name' + String.fromCharCode(31);
        assert.strictEqual(sanitizeFilename(withControlChars), 'badname');
    });

    it('strips square brackets so wikilinks cannot be prematurely terminated', () => {
        assert.strictEqual(sanitizeFilename('Foo]] [[SomeOtherNote'), 'Foo__ __SomeOtherNote');
        assert.ok(!sanitizeFilename('Foo]] [[SomeOtherNote').includes('['));
        assert.ok(!sanitizeFilename('Foo]] [[SomeOtherNote').includes(']'));
    });

    it('appends a suffix to Windows-reserved device names', () => {
        assert.strictEqual(sanitizeFilename('CON'), 'CON_');
        assert.strictEqual(sanitizeFilename('con'), 'con_');
        assert.strictEqual(sanitizeFilename('COM1'), 'COM1_');
        assert.strictEqual(sanitizeFilename('LPT9'), 'LPT9_');
        // Not reserved names, should pass through untouched.
        assert.strictEqual(sanitizeFilename('CONtent'), 'CONtent');
        assert.strictEqual(sanitizeFilename('CONSTANTINE'), 'CONSTANTINE');
    });
});
