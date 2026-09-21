import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { buildFrontmatter } from '../frontmatter';
import type { Reference } from '../types';

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

        assert.ok(result.includes('citeKey: "Doe_2020"'));
        assert.ok(result.includes('title: "A Sample Title"'));
        assert.ok(result.includes('year: 2020'));
        assert.ok(!result.includes('publisher:'));
        assert.ok(!result.includes('journal:'));
        assert.ok(!result.includes('isbn:'));
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

        assert.ok(result.includes('publisher: "Acme Press"'));
        assert.ok(result.includes('journal: "Journal of Examples"'));
        assert.ok(result.includes('volume: "3"'));
        assert.ok(result.includes('pages: "1-10"'));
        assert.ok(result.includes('doi: "10.1234/example"'));
        assert.ok(result.includes('isbn: "123-456"'));
    });

    it('quotes and escapes values containing YAML-significant characters', async () => {
        const result = await buildFrontmatter(baseReference({
            title: 'Word Studies: A Critical Study',
            note: 'Contains a "quoted" phrase and a \\ backslash',
        }));

        assert.ok(result.includes('title: "Word Studies: A Critical Study"'));
        assert.ok(result.includes('note: "Contains a \\"quoted\\" phrase and a \\\\ backslash"'));
    });

    it('lists multiple authors as separate sanitized wikilinks', async () => {
        const result = await buildFrontmatter(baseReference({
            author: 'Doe, Jane and Smith, John and O’Neil, Sam',
        }));

        assert.ok(result.includes('- "[[Doe, Jane]]"'));
        assert.ok(result.includes('- "[[Smith, John]]"'));
        assert.ok(result.includes('- "[[O’Neil, Sam]]"'));
    });

    it('sanitizes illegal filename characters in author wikilinks', async () => {
        const result = await buildFrontmatter(baseReference({
            author: 'Doe: Jane/Q*A',
        }));

        assert.ok(result.includes('- "[[Doe_ Jane_Q_A]]"'));
        assert.ok(!result.includes('/'));
    });

    it('wraps frontmatter in --- delimiters', async () => {
        const result = await buildFrontmatter(baseReference());
        const lines = result.split('\n');

        assert.strictEqual(lines[0], '---');
        assert.strictEqual(lines[lines.length - 1], '---');
    });
});
