import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { getAuthorReferenceLinks } from '../authors';
import type { Reference } from '../types';

function makeReference(overrides: Partial<Reference>): Reference {
    return {
        citeKey: 'key',
        title: 'Untitled',
        author: 'Doe, Jane',
        year: 2020,
        ...overrides,
    };
}

describe('getAuthorReferenceLinks', () => {
    it('returns a wikilink for each reference the author appears on', () => {
        const references: Reference[] = [
            makeReference({ title: 'Paper One', author: 'Doe, Jane' }),
            makeReference({ title: 'Paper Two', author: 'Smith, John' }),
            makeReference({ title: 'Paper Three', author: 'Doe, Jane and Smith, John' }),
        ];

        assert.deepStrictEqual(getAuthorReferenceLinks('Doe, Jane', references), [
            '[[Paper One]]',
            '[[Paper Three]]',
        ]);
    });

    it('returns an empty list when the author has no references', () => {
        const references: Reference[] = [
            makeReference({ title: 'Paper One', author: 'Someone Else' }),
        ];

        assert.deepStrictEqual(getAuthorReferenceLinks('Doe, Jane', references), []);
    });

    it('sanitizes illegal filename characters in the linked reference title', () => {
        const references: Reference[] = [
            makeReference({ title: 'Report: A/B "Results"', author: 'Doe, Jane' }),
        ];

        assert.deepStrictEqual(getAuthorReferenceLinks('Doe, Jane', references), [
            '[[Report_ A_B _Results_]]',
        ]);
    });
});
