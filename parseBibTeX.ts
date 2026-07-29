import { Notice } from 'obsidian';
import { Author, BibTeXData, BibTeXEntryData, Reference } from './types';

/**
 * Splits raw BibTeX text into individual `@entry{...}` chunks. Splits on `@`
 * characters that occur at brace-depth 0 (i.e. entry starts), rather than on
 * blank lines, so entries containing internal blank lines are kept intact.
 */
function splitEntries(bibtexInput: string): string[] {
    const entries: string[] = [];
    let depth = 0;
    let start = -1;

    for (let i = 0; i < bibtexInput.length; i++) {
        const char = bibtexInput[i];
        if (char === '{') {
            depth++;
        } else if (char === '}') {
            depth = Math.max(0, depth - 1);
        } else if (char === '@' && depth === 0) {
            if (start !== -1) {
                entries.push(bibtexInput.slice(start, i));
            }
            start = i;
        }
    }

    if (start !== -1) {
        entries.push(bibtexInput.slice(start));
    }

    return entries;
}

/**
 * Given a string and the index of an opening `{`, returns the index of its
 * matching closing `}` (brace-depth aware), or -1 if unmatched.
 */
function findMatchingBrace(str: string, openIndex: number): number {
    let depth = 0;
    for (let i = openIndex; i < str.length; i++) {
        if (str[i] === '{') {
            depth++;
        } else if (str[i] === '}') {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

/**
 * Finds the index of the first top-level (brace-depth 0) comma in `str`,
 * starting from `fromIndex`. Returns -1 if none is found.
 */
function findTopLevelComma(str: string, fromIndex: number): number {
    let depth = 0;
    for (let i = fromIndex; i < str.length; i++) {
        const char = str[i];
        if (char === '{') depth++;
        else if (char === '}') depth = Math.max(0, depth - 1);
        else if (char === ',' && depth === 0) return i;
    }
    return -1;
}

/** Collapses internal whitespace (including newlines from multi-line values) into single spaces. */
function normalizeValue(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

/**
 * Parses the `key = value, key2 = value2, ...` field list of a BibTeX entry
 * (the text after the citekey). Values may be brace-delimited (with nested
 * braces), quote-delimited, or bare, and may span multiple lines.
 */
function extractFields(fieldsText: string): BibTeXEntryData {
    const entryData: BibTeXEntryData = {};
    let pos = 0;
    const len = fieldsText.length;

    while (pos < len) {
        // Skip whitespace and stray commas between fields.
        while (pos < len && /[\s,]/.test(fieldsText[pos])) pos++;
        if (pos >= len) break;

        const eqIndex = fieldsText.indexOf('=', pos);
        if (eqIndex === -1) break; // No more key=value pairs.

        const rawKey = fieldsText.slice(pos, eqIndex).trim();
        pos = eqIndex + 1;

        // Skip whitespace before the value.
        while (pos < len && /\s/.test(fieldsText[pos])) pos++;

        let rawValue: string;
        if (fieldsText[pos] === '{') {
            const closeIndex = findMatchingBrace(fieldsText, pos);
            if (closeIndex === -1) {
                rawValue = fieldsText.slice(pos + 1);
                pos = len;
            } else {
                rawValue = fieldsText.slice(pos + 1, closeIndex);
                pos = closeIndex + 1;
            }
        } else if (fieldsText[pos] === '"') {
            let depth = 0;
            let closeIndex = -1;
            for (let i = pos + 1; i < len; i++) {
                if (fieldsText[i] === '{') depth++;
                else if (fieldsText[i] === '}') depth = Math.max(0, depth - 1);
                else if (fieldsText[i] === '"' && depth === 0) {
                    closeIndex = i;
                    break;
                }
            }
            if (closeIndex === -1) {
                rawValue = fieldsText.slice(pos + 1);
                pos = len;
            } else {
                rawValue = fieldsText.slice(pos + 1, closeIndex);
                pos = closeIndex + 1;
            }
        } else {
            // Bare value (e.g. a number): read up to the next top-level comma.
            const commaIndex = findTopLevelComma(fieldsText, pos);
            if (commaIndex === -1) {
                rawValue = fieldsText.slice(pos);
                pos = len;
            } else {
                rawValue = fieldsText.slice(pos, commaIndex);
                pos = commaIndex;
            }
        }

        // Skip whitespace and consume a single trailing separator comma, if present.
        while (pos < len && /\s/.test(fieldsText[pos])) pos++;
        if (pos < len && fieldsText[pos] === ',') pos++;

        const key = rawKey.replace(/[{}]/g, '').trim().toLowerCase();
        const value = normalizeValue(rawValue);
        if (key && value) {
            entryData[key as keyof BibTeXEntryData] = value;
        }
    }

    return entryData;
}

/** Parses a single `@type{citekey, field = value, ...}` entry chunk. */
function parseEntry(entryText: string): { citeKey: string; entryData: BibTeXEntryData } | null {
    const headerMatch = entryText.match(/^@(\w+)\s*\{/);
    if (!headerMatch) return null;

    const openBraceIndex = entryText.indexOf('{', headerMatch.index ?? 0);
    if (openBraceIndex === -1) return null;

    const closeBraceIndex = findMatchingBrace(entryText, openBraceIndex);
    const body = closeBraceIndex === -1
        ? entryText.slice(openBraceIndex + 1)
        : entryText.slice(openBraceIndex + 1, closeBraceIndex);

    const commaIndex = findTopLevelComma(body, 0);
    const rawCiteKey = commaIndex === -1 ? body : body.slice(0, commaIndex);
    const citeKey = rawCiteKey.trim().replace(/\W/g, '_');
    if (!citeKey) return null;

    const fieldsText = commaIndex === -1 ? '' : body.slice(commaIndex + 1);
    const entryData = extractFields(fieldsText);

    return { citeKey, entryData };
}

export async function parseBibTeX(bibtexInput: string): Promise<BibTeXData | null> {
    try {
        const references: Reference[] = [];
        const authors: Author[] = [];

        // Split BibTeX input into individual entries (entry-start aware, not blank-line based).
        const entries = splitEntries(bibtexInput);

        // Iterate over each BibTeX entry
        for (const entryText of entries) {
            const parsed = parseEntry(entryText);
            if (!parsed) continue; // Skip entry if it couldn't be parsed.
            const { citeKey, entryData } = parsed;

            // Check if it's a reference entry
            if (entryData.title && entryData.author) {
                references.push({
                    ...entryData,
                    citeKey,
                    title: entryData.title,
                    author: entryData.author,
                    year: parseInt(entryData.year || '0', 10),
                    abstract: entryData.abstract || '',
                });
            }

            // Check if it's an author entry
            if (entryData.author) {
                const authorNames = entryData.author.split(/\s+and\s+/).map(name => name.trim());
                authorNames.forEach(authorName => {
                    authors.push({ name: authorName });
                });
            }
        }

        return { references, authors };
    } catch (error) {
        new Notice('Failed to parse BibTeX data.');
        console.error(error);
        return null;
    }
}
