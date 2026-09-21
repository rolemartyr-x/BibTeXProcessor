import type { Reference } from './types';
import { sanitizeFilename } from './sanitizeFilename';
import { yamlString } from './yaml';

export async function buildFrontmatter(reference: Reference): Promise<string> {
    const frontmatter: string[] = [];
    const authors = reference.author.split(' and ').map((name: string) => `- "[[${sanitizeFilename(name.trim())}]]"`).join('\n');

    frontmatter.push(`---`);
    frontmatter.push(`citeKey: ${yamlString(reference.citeKey)}`);
    frontmatter.push(`title: ${yamlString(reference.title)}`);
    frontmatter.push(`author: \n${authors}`);
    if (reference.editor) frontmatter.push(`editor: ${yamlString(reference.editor)}`);
    frontmatter.push(`year: ${reference.year}`);
    if (reference.publisher) frontmatter.push(`publisher: ${yamlString(reference.publisher)}`);
    if (reference.journal) frontmatter.push(`journal: ${yamlString(reference.journal)}`);
    if (reference.volume) frontmatter.push(`volume: ${yamlString(reference.volume)}`);
    if (reference.number) frontmatter.push(`number: ${yamlString(reference.number)}`);
    if (reference.pages) frontmatter.push(`pages: ${yamlString(reference.pages)}`);
    if (reference.booktitle) frontmatter.push(`booktitle: ${yamlString(reference.booktitle)}`);
    if (reference.address) frontmatter.push(`address: ${yamlString(reference.address)}`);
    if (reference.month) frontmatter.push(`month: ${yamlString(reference.month)}`);
    if (reference.note) frontmatter.push(`note: ${yamlString(reference.note)}`);
    if (reference.doi) frontmatter.push(`doi: ${yamlString(reference.doi)}`);
    if (reference.url) frontmatter.push(`url: ${yamlString(reference.url)}`);
    if (reference.isbn) frontmatter.push(`isbn: ${yamlString(reference.isbn)}`);
    if (reference.issn) frontmatter.push(`issn: ${yamlString(reference.issn)}`);
    if (reference.eprint) frontmatter.push(`eprint: ${yamlString(reference.eprint)}`);
    frontmatter.push(`---`);
    return frontmatter.join('\n');
}
