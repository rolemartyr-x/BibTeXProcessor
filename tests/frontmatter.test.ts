import { describe, expect, it } from 'vitest';
import { buildFrontmatter } from '../frontmatter';
import { Reference } from '../types';

function baseReference(overrides: Partial<Reference> = {}): Reference {
    return {
        citeKey: 'Doe_2020',
        title: 'A Sample Title',
        author: 'Doe, Jane',
        year: 2020,
        ...overrides,
    };
}

describe('buildFrontmatter', () => {
    it('includes required fields and omits absent optional fields', async () => {
        const result = await buildFrontmatter(baseReference());

        expect(result).toContain('citeKey: Doe_2020');
        expect(result).toContain('title: A Sample Title');
        expect(result).toContain('year: 2020');
        expect(result).not.toContain('publisher:');
        expect(result).not.toContain('journal:');
        expect(result).not.toContain('isbn:');
    });

    it('includes optional fields when present', async () => {
        const result = await buildFrontmatter(baseReference({
            publisher: 'Acme Press',
            journal: 'Journal of Examples',
            volume: '3',
            pages: '1-10',
            doi: '10.1234/example',
            isbn: '123-456',
        }));

        expect(result).toContain('publisher: Acme Press');
        expect(result).toContain('journal: Journal of Examples');
        expect(result).toContain('volume: 3');
        expect(result).toContain('pages: 1-10');
        expect(result).toContain('doi: 10.1234/example');
        expect(result).toContain('isbn: 123-456');
    });

    it('lists multiple authors as separate sanitized wikilinks', async () => {
        const result = await buildFrontmatter(baseReference({
            author: 'Doe, Jane and Smith, John and O’Neil, Sam',
        }));

        expect(result).toContain('- "[[Doe, Jane]]"');
        expect(result).toContain('- "[[Smith, John]]"');
        expect(result).toContain('- "[[O’Neil, Sam]]"');
    });

    it('sanitizes illegal filename characters in author wikilinks', async () => {
        const result = await buildFrontmatter(baseReference({
            author: 'Doe: Jane/Q*A',
        }));

        expect(result).toContain('- "[[Doe_ Jane_Q_A]]"');
        expect(result).not.toContain('/');
    });

    it('wraps frontmatter in --- delimiters', async () => {
        const result = await buildFrontmatter(baseReference());
        const lines = result.split('\n');

        expect(lines[0]).toBe('---');
        expect(lines[lines.length - 1]).toBe('---');
    });
});
