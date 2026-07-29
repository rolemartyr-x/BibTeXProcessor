import { describe, expect, it } from 'vitest';
import { parseBibTeX } from '../parseBibTeX';

describe('parseBibTeX', () => {
    it('parses a single well-formed entry', async () => {
        const input = `@book{Vincent_1887,
address={New York},
title={Word studies in the New Testament},
volume={2},
publisher={Charles Scribner's Sons},
author={Vincent, Marvin Richardson},
year={1887},
pages={24} }`;

        const result = await parseBibTeX(input);
        expect(result).not.toBeNull();
        expect(result?.references).toHaveLength(1);

        const reference = result?.references[0];
        expect(reference?.citeKey).toBe('Vincent_1887');
        expect(reference?.title).toBe('Word studies in the New Testament');
        expect(reference?.author).toBe('Vincent, Marvin Richardson');
        expect(reference?.year).toBe(1887);
        expect(reference?.volume).toBe('2');

        expect(result?.authors).toEqual([{ name: 'Vincent, Marvin Richardson' }]);
    });

    it('parses multiple entries, including ones separated by internal blank lines', async () => {
        const input = `@article{Smith2020,
title={First Paper},

author={Smith, John},
year={2020}
}

@article{Doe2021,
title={Second Paper},
author={Doe, Jane},
year={2021}
}`;

        const result = await parseBibTeX(input);
        expect(result?.references).toHaveLength(2);
        expect(result?.references.map((r) => r.citeKey)).toEqual(['Smith2020', 'Doe2021']);
        expect(result?.references[0].title).toBe('First Paper');
        expect(result?.references[1].title).toBe('Second Paper');
    });

    it('handles multi-line field values, collapsing internal whitespace', async () => {
        const input = `@article{Multi2022,
title={A Title That
    Spans Multiple
    Lines},
author={Author, Some},
year={2022}
}`;

        const result = await parseBibTeX(input);
        expect(result?.references).toHaveLength(1);
        expect(result?.references[0].title).toBe('A Title That Spans Multiple Lines');
    });

    it('handles field values that themselves contain an "=" character', async () => {
        const input = `@misc{Eq2023,
title={Solving x=y for x},
author={Author, Some},
year={2023}
}`;

        const result = await parseBibTeX(input);
        expect(result?.references).toHaveLength(1);
        expect(result?.references[0].title).toBe('Solving x=y for x');
    });

    it('skips entries missing the fields required to build a reference', async () => {
        const input = `@article{NoAuthor2020,
title={Orphan Title},
year={2020}
}`;

        const result = await parseBibTeX(input);
        expect(result?.references).toHaveLength(0);
        // No author field at all, so no author entries should be produced either.
        expect(result?.authors).toHaveLength(0);
    });

    it('defaults missing optional fields to empty string / zero', async () => {
        const input = `@article{Minimal2020,
title={Minimal Entry},
author={Only, Author}
}`;

        const result = await parseBibTeX(input);
        const reference = result?.references[0];
        expect(reference?.year).toBe(0);
        expect(reference?.journal).toBe('');
        expect(reference?.doi).toBe('');
    });

    it('splits multiple authors joined by " and " into separate author records', async () => {
        const input = `@book{Multi2020,
title={Collaborative Work},
author={First, One and Second, Two and Third, Three},
year={2020}
}`;

        const result = await parseBibTeX(input);
        expect(result?.authors).toEqual([
            { name: 'First, One' },
            { name: 'Second, Two' },
            { name: 'Third, Three' },
        ]);
    });

    it('sanitizes special characters in the citekey to underscores', async () => {
        const input = `@article{Weird:Key With Spaces!,
title={Some Title},
author={An, Author},
year={2020}
}`;

        const result = await parseBibTeX(input);
        expect(result?.references[0].citeKey).toBe('Weird_Key_With_Spaces_');
    });

    it('returns empty references/authors for input with no valid entries', async () => {
        const result = await parseBibTeX('not bibtex at all, just some text');
        expect(result).toEqual({ references: [], authors: [] });
    });

    it('supports quote-delimited field values', async () => {
        const input = `@article{Quoted2020,
title="A Quoted Title",
author="Author, Some",
year="2020"
}`;

        const result = await parseBibTeX(input);
        expect(result?.references[0].title).toBe('A Quoted Title');
        expect(result?.references[0].year).toBe(2020);
    });
});
