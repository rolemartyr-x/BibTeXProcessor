import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
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
        assert.notStrictEqual(result, null);
        assert.strictEqual(result?.references.length, 1);

        const reference = result?.references[0];
        assert.strictEqual(reference?.citeKey, 'Vincent_1887');
        assert.strictEqual(reference?.title, 'Word studies in the New Testament');
        assert.strictEqual(reference?.author, 'Vincent, Marvin Richardson');
        assert.strictEqual(reference?.year, 1887);
        assert.strictEqual(reference?.volume, '2');

        assert.deepStrictEqual(result?.authors, [{ name: 'Vincent, Marvin Richardson' }]);
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
        assert.strictEqual(result?.references.length, 2);
        assert.deepStrictEqual(result?.references.map((r) => r.citeKey), ['Smith2020', 'Doe2021']);
        assert.strictEqual(result?.references[0].title, 'First Paper');
        assert.strictEqual(result?.references[1].title, 'Second Paper');
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
        assert.strictEqual(result?.references.length, 1);
        assert.strictEqual(result?.references[0].title, 'A Title That Spans Multiple Lines');
    });

    it('handles field values that themselves contain an "=" character', async () => {
        const input = `@misc{Eq2023,
title={Solving x=y for x},
author={Author, Some},
year={2023}
}`;

        const result = await parseBibTeX(input);
        assert.strictEqual(result?.references.length, 1);
        assert.strictEqual(result?.references[0].title, 'Solving x=y for x');
    });

    it('skips entries missing the fields required to build a reference', async () => {
        const input = `@article{NoAuthor2020,
title={Orphan Title},
year={2020}
}`;

        const result = await parseBibTeX(input);
        assert.strictEqual(result?.references.length, 0);
        // No author field at all, so no author entries should be produced either.
        assert.strictEqual(result?.authors.length, 0);
    });

    it('defaults a missing year to 0 and leaves other missing optional fields undefined', async () => {
        const input = `@article{Minimal2020,
title={Minimal Entry},
author={Only, Author}
}`;

        const result = await parseBibTeX(input);
        const reference = result?.references[0];
        assert.strictEqual(reference?.year, 0);
        assert.strictEqual(reference?.journal, undefined);
        assert.strictEqual(reference?.doi, undefined);
    });

    it('splits multiple authors joined by " and " into separate author records', async () => {
        const input = `@book{Multi2020,
title={Collaborative Work},
author={First, One and Second, Two and Third, Three},
year={2020}
}`;

        const result = await parseBibTeX(input);
        assert.deepStrictEqual(result?.authors, [
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
        assert.strictEqual(result?.references[0].citeKey, 'Weird_Key_With_Spaces_');
    });

    it('returns empty references/authors for input with no valid entries', async () => {
        const result = await parseBibTeX('not bibtex at all, just some text');
        assert.deepStrictEqual(result, { references: [], authors: [] });
    });

    it('carries every optional BibTeX field through to the parsed reference', async () => {
        const input = `@book{Full2020,
title={Full Entry},
author={Some, Author},
year={2020},
editor={Some, Editor},
publisher={Acme Press},
number={7},
booktitle={A Book},
address={Nowhere},
month={January},
note={A note},
isbn={123-456},
issn={789-012}
}`;

        const result = await parseBibTeX(input);
        const reference = result?.references[0];
        assert.strictEqual(reference?.editor, 'Some, Editor');
        assert.strictEqual(reference?.publisher, 'Acme Press');
        assert.strictEqual(reference?.number, '7');
        assert.strictEqual(reference?.booktitle, 'A Book');
        assert.strictEqual(reference?.address, 'Nowhere');
        assert.strictEqual(reference?.month, 'January');
        assert.strictEqual(reference?.note, 'A note');
        assert.strictEqual(reference?.isbn, '123-456');
        assert.strictEqual(reference?.issn, '789-012');
    });

    it('supports quote-delimited field values', async () => {
        const input = `@article{Quoted2020,
title="A Quoted Title",
author="Author, Some",
year="2020"
}`;

        const result = await parseBibTeX(input);
        assert.strictEqual(result?.references[0].title, 'A Quoted Title');
        assert.strictEqual(result?.references[0].year, 2020);
    });
});
