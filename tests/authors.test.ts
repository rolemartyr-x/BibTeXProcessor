import { describe, expect, it } from 'vitest';
import { getAuthorReferenceLinks } from '../authors';
import { Reference } from '../types';

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

        expect(getAuthorReferenceLinks('Doe, Jane', references)).toEqual([
            '[[Paper One]]',
            '[[Paper Three]]',
        ]);
    });

    it('returns an empty list when the author has no references', () => {
        const references: Reference[] = [
            makeReference({ title: 'Paper One', author: 'Someone Else' }),
        ];

        expect(getAuthorReferenceLinks('Doe, Jane', references)).toEqual([]);
    });

    it('sanitizes illegal filename characters in the linked reference title', () => {
        const references: Reference[] = [
            makeReference({ title: 'Report: A/B "Results"', author: 'Doe, Jane' }),
        ];

        expect(getAuthorReferenceLinks('Doe, Jane', references)).toEqual([
            '[[Report_ A_B _Results_]]',
        ]);
    });
});
