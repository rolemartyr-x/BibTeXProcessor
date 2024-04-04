import { TFile, Vault } from 'obsidian';
import { Reference } from './main';

export async function createAuthorPage(authorPagePath: string, authorName: string, references: Reference[], vault: Vault) {
    try {
        console.log(`Creating author page: ${authorPagePath}`);
        const frontmatter = `---\ntitle: ${authorName}\n---`;
        let authorPageContent = `${frontmatter}\n\n# ${authorName}`;

        // Check if any references exist for this author
        const authorReferences = references.filter((reference) => {
            const referenceAuthors = reference.author.split(' and ').map((name: string) => name.trim());
            return referenceAuthors.includes(authorName);
        });

        if (authorReferences.length > 0) {
            authorPageContent += '\n\n### References\n';
            authorReferences.forEach((reference) => {
                authorPageContent += `[[${reference.title}]]`;
            });
        }

        await vault.create(authorPagePath, authorPageContent);
        console.log(`Created author page: ${authorPagePath}`);
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
        const referenceLinks = references
            .filter((reference) => {
                const referenceAuthors = reference.author.split(' and ').map((name: string) => name.trim());
                return referenceAuthors.includes(authorName);
            })
            .map((reference) => `[[${reference.title}]]`);
        authorPageContent = `${authorPageContent.slice(0, referencesHeadingIndex)}\n${referenceLinks.join('\n')}${authorPageContent.slice(referencesHeadingIndex)}`;

        // Update the author page with the new content
        await this.app.vault.modify(authorPage, authorPageContent);
    } catch (error) {
        console.error('Error updating author page: ', error);
    }
}