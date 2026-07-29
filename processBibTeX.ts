import { App, normalizePath, TFile, Notice } from 'obsidian';
import { createAuthorPage, updateAuthorPageContent } from './authors';
import { buildFrontmatter } from './frontmatter';
import { parseBibTeX } from './parseBibTeX';
import { ensureFoldersExist } from './ensureFolders';
import { sanitizeFilename } from './sanitizeFilename';

export async function processBibTeX(app: App, bibtexData: string) {
    // Parse BibTeX input
    const parsedData = await parseBibTeX(bibtexData);
    if (!parsedData) {
        new Notice('Failed to parse BibTeX data.');
        return;
    }

    // Generate folder hierarchy if necessary
    await ensureFoldersExist(app);

    const vault = app.vault;

    // Process references
    for (const reference of parsedData.references) {
        const { title } = reference;

        // Check if reference page already exists
        const referencePagePath = `Sources/References/${normalizePath(sanitizeFilename(title))}.md`;
        const referencePageExists = await vault.adapter.exists(referencePagePath);

        // If reference page already exists, skip creation
        if (referencePageExists) {
            continue;
        }

        // Create reference page
        try {
            let referenceContent = `# ${title}`;
            const frontmatter = await buildFrontmatter(reference);

            if(reference.abstract != ""){
                referenceContent = referenceContent + `\n## Abstract\n${reference.abstract}`;
            }

            const fullContent = `${frontmatter}\n${referenceContent}`;

            await vault.create(referencePagePath, fullContent);
        } catch (error) {
            console.error('Error creating reference page:', error);
        }
    }

    // Process authors
    for (const author of parsedData.authors) {
        const authorPagePath = `Sources/Authors/${normalizePath(sanitizeFilename(author.name))}.md`;
        const authorPage = vault.getAbstractFileByPath(authorPagePath) as TFile; // Cast to TFile
        if (authorPage) {
            await updateAuthorPageContent(authorPage, author.name, parsedData.references, vault);
        } else {
            // If author page doesn't exist, create it
            await createAuthorPage(authorPagePath, author.name, parsedData.references, vault);
        }
    }

    // Display success message
    new Notice('BibTeX processing complete!');
}
