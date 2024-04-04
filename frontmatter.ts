import { Reference } from './main';

export async function buildFrontmatter(reference: Reference): Promise<string> {
    const frontmatter: string[] = [];
    const authors = reference.author.split(' and ').map((name: string) => `- "[[${name.trim()}]]"`).join('\n');
    
    frontmatter.push(`---`);
    frontmatter.push(`citeKey: ${reference.citeKey}`);
    frontmatter.push(`title: ${reference.title}`);
    frontmatter.push(`author: \n${authors}`);
    if (reference.editor) frontmatter.push(`editor: ${reference.editor}`);
    frontmatter.push(`year: ${reference.year}`);
    if (reference.publisher) frontmatter.push(`publisher: ${reference.publisher}`);
    if (reference.journal) frontmatter.push(`journal: ${reference.journal}`);
    if (reference.volume) frontmatter.push(`volume: ${reference.volume}`);
    if (reference.number) frontmatter.push(`number: ${reference.number}`);
    if (reference.pages) frontmatter.push(`pages: ${reference.pages}`);
    if (reference.booktitle) frontmatter.push(`booktitle: ${reference.booktitle}`);
    if (reference.address) frontmatter.push(`address: ${reference.address}`);
    if (reference.month) frontmatter.push(`month: ${reference.month}`);
    if (reference.note) frontmatter.push(`note: ${reference.note}`);
    if (reference.doi) frontmatter.push(`doi: ${reference.doi}`);
    if (reference.url) frontmatter.push(`url: ${reference.url}`);
    if (reference.isbn) frontmatter.push(`isbn: ${reference.isbn}`);
    if (reference.issn) frontmatter.push(`issn: ${reference.issn}`);
    if (reference.eprint) frontmatter.push(`eprint: ${reference.eprint}`);
    frontmatter.push(`---`);
    return frontmatter.join('\n');
}