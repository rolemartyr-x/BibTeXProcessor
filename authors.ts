import type { TFile, Vault } from 'obsidian';
import { Reference } from './types';
import { sanitizeFilename } from './sanitizeFilename';
import { yamlString } from './yaml';

/**
 * Computes the `[[wikilink]]` list for every reference authored by
 * `authorName`, using the same sanitized filename that reference pages are
 * created under so the links resolve correctly.
 *
 * Pure helper (no vault access) so it's easy to unit test.
 */
export function getAuthorReferenceLinks(authorName: string, references: Reference[]): string[] {
    return references
        .filter((reference) => {
            const referenceAuthors = reference.author.split(' and ').map((name: string) => name.trim());
            return referenceAuthors.includes(authorName);
        })
        .map((reference) => `[[${sanitizeFilename(reference.title)}]]`);
}

export async function createAuthorPage(authorPagePath: string, authorName: string, references: Reference[], vault: Vault) {
    try {
        const frontmatter = `---\ntitle: ${yamlString(authorName)}\n---`;
        let authorPageContent = `${frontmatter}\n\n# ${authorName}`;

        const referenceLinks = getAuthorReferenceLinks(authorName, references);
        if (referenceLinks.length > 0) {
            authorPageContent += '\n\n### References\n';
            authorPageContent += referenceLinks.join('\n');
        }

        await vault.create(authorPagePath, authorPageContent);
    } catch (error) {
        console.error('Error creating author page: ', error);
    }
}

export async function updateAuthorPageContent(authorPage: TFile, authorName: string, references: Reference[], vault: Vault) {
    try {
        // Read current content of the author page
        let authorPageContent = await vault.read(authorPage);

        //Check if the author page content already contains the "References" ehading
        const referencesHeading = '### References';
        let referencesHeadingIndex = authorPageContent.indexOf(referencesHeading);
        if(referencesHeadingIndex === -1) {
            // If the "References" heading doesn't exist, find the end of the file
            referencesHeadingIndex = authorPageContent.length;
        } else {
            // If the "References" heading exists, find the end of the heading section
            const endOfReferencesIndex = authorPageContent.indexOf('\n\n', referencesHeadingIndex + referencesHeading.length);
            if (endOfReferencesIndex !== -1) {
                referencesHeadingIndex = endOfReferencesIndex;
            } else {
                referencesHeadingIndex = authorPageContent.length;
            }
        }

        //Append the reference links
        const referenceLinks = getAuthorReferenceLinks(authorName, references);
        authorPageContent = `${authorPageContent.slice(0, referencesHeadingIndex)}\n${referenceLinks.join('\n')}${authorPageContent.slice(referencesHeadingIndex)}`;

        // Update the author page with the new content
        await vault.modify(authorPage, authorPageContent);
    } catch (error) {
        console.error('Error updating author page: ', error);
    }
}
