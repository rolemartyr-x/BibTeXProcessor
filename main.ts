import { Plugin, Notice, normalizePath, TFile } from 'obsidian';
import { openBibTeXModal } from './interface';
import { createAuthorPage, updateAuthorPageContent} from './authors';
import { buildFrontmatter } from './frontmatter';
import { parseBibTeX } from './parseBibTeX';
import { ensureFoldersExist } from './ensureFoldersExist';

export interface Reference {
    citeKey: string;
    title: string;
    author: string;
    editor?: string;
    year: number;
    publisher?: string;
    journal?: string;
    volume?: string;
    number?: string;
    pages?: string;
    booktitle?: string;
    address?: string;
    month?: string;
    note?: string;
    doi?: string;
    url?: string;
    isbn?: string;
    issn?: string;
    abstract?: string;
    eprint?: string;
}

export interface Author {
    name: string;
}

export interface BibTeXData {
    references: Reference[];
    authors: Author[];
}

export interface BibTeXEntryData {
    title?: string;
    author?: string;
    editor?: string;
    year?: string;
    publisher?: string;
    journal?: string;
    volume?: string;
    number?: string;
    pages?: string;
    booktitle?: string;
    address?: string;
    month?: string;
    note?: string;
    doi?: string;
    url?: string;
    isbn?: string;
    issn?: string;
    abstract?: string;
    eprint?: string;
}

export default class BibTeXProcessorPlugin extends Plugin {
    async onload() {
        console.log('BibTeX plugin loaded');
        
        // Add ribbon icon
        this.addRibbonIcon('book-open-check', 'Process BibTeX', async () => {
            const bibtexData = await openBibTeXModal();
            if (bibtexData) {
                await this.processBibTeX(bibtexData);
            } else {
                new Notice('Failed to get BibTeX data.');
            }
        });
        
        // Register command for command palette
        this.addCommand({
            id: 'process-bibtex',
            name: 'Process BibTeX',
            callback: async () => {
                const bibtexData = await openBibTeXModal();
                if (bibtexData) {
                    await this.processBibTeX(bibtexData);
                } else {
                    new Notice('Failed to get BibTeX data.');
                }
            },
        });
    }

    async processBibTeX(bibtexData: string) {
        console.log('Processing BibTeX data:', bibtexData); // Check the BibTeX data
        // Parse BibTeX input
        const parsedData = await parseBibTeX(bibtexData);
        console.log('Parsed BibTeX data:', parsedData); // Check the parsed data
        if (!parsedData) {
            new Notice('Failed to parse BibTeX data.');
            return;
        }
    
        // Generate folder hierarchy if necessary
        console.log('Ensuring folders exist...'); // Check if ensuring folders exist
        await ensureFoldersExist();
    
        const vault = this.app.vault;
    
        // Process references
        console.log('Processing references...'); // Check if processing references
        for (const reference of parsedData.references) {
            const { title } = reference;
    
            // Check if reference page already exists
            const referencePagePath = `Sources/References/${normalizePath(title)}.md`;
            const referencePageExists = await vault.adapter.exists(referencePagePath);
    
            // If reference page already exists, skip creation
            if (referencePageExists) {
                console.log(`Reference page already exists: ${referencePagePath}`);
                continue;
            }
    
            // Create reference page
            try {
                console.log(`Creating reference page: ${referencePagePath}`); // Check if creating reference page
                let referenceContent = `# ${title}`;
                const frontmatter = await buildFrontmatter(reference);

                if(reference.abstract != ""){
                    referenceContent = referenceContent + `\n## Abstract\n${reference.abstract}`;
                }

                const fullContent = `${frontmatter}\n${referenceContent}`;
    
                await vault.create(referencePagePath, fullContent);
                console.log(`Created reference page: ${referencePagePath}`);
            } catch (error) {
                console.error('Error creating reference page:', error);
            }
        }
    
        // Process authors
        console.log('Processing authors...'); // Check if processing authors
        for (const author of parsedData.authors) {
            const authorPagePath = `Sources/Authors/${normalizePath(author.name)}.md`;
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
}
