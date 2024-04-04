import { Plugin, Notice, normalizePath, TFolder, TFile } from 'obsidian';
import { openBibTeXModal } from './interface';
import { createAuthorPage, updateAuthorPageContent} from './authors';
import { buildFrontmatter } from './frontmatter';
import { parseBibTeX } from './parseBibTeX';

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
        await this.ensureFoldersExist();
    
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
    
    async ensureFoldersExist() {
        await this.ensureFolderExists('Sources');
        await this.ensureFolderExists('Sources/Authors');
        await this.ensureFolderExists('Sources/References');
    }

    async ensureFolderExists(folderName: string) {
        const folder = this.app.vault.getAbstractFileByPath(folderName);
        if (!folder || !(folder instanceof TFolder)) {
            await this.app.vault.createFolder(folderName);
        }
    }
    
    /* parseBibTeX(bibtexInput: string): BibTeXData | null {
        try {
            const references: Reference[] = [];
            const authors: Author[] = [];
    
            // Split BibTeX input into individual entries
            const entries = bibtexInput.split('\n\n');
            console.log('Number of BibTeX entries:', entries.length); // Add this line
    
            // Iterate over each BibTeX entry
            for (const entry of entries) {
                // Extract citekey
                const citeKeyMatch = entry.match(/@\w+\s*{\s*([^,]+)/);
                if (!citeKeyMatch) continue; // Skip entry if citekey is not found
                let citeKey = citeKeyMatch[1].trim();
                console.log('Citekey:', citeKey); // Add this line
    
                // Replace non-word characters with underscores
                citeKey = citeKey.replace(/\W/g, '_');
    
                const lines = entry.split('\n');
                const entryData: BibTeXEntryData = {};
    
                // Parse each line of the entry
                for (const line of lines) {
                    const [key, ...values] = line.split('=').map(str => str.trim());
                    const value = values.join('=').trim();
                    if (key && value) {
                        // Remove leading and trailing braces and any extra spaces
                        const cleanedValue = value.replace(/^{?\s*|}?,?/g, '').trim();
                        const cleanedKey = key.replace(/[{}]/g, '').trim();
                        const propertyName = cleanedKey.toLowerCase() as keyof BibTeXEntryData;
                        entryData[propertyName] = cleanedValue;
                    }
                }
    
                console.log('Parsed entry data:', entryData); // Add this line
    
                // Check if it's a reference entry
                if (entryData.title && entryData.author) {
                    references.push({
                        citeKey,
                        abstract: entryData.abstract || '',
                        author: entryData.author,
                        title: entryData.title,
                        year: parseInt(entryData.year || '0', 10),
                        journal: entryData.journal || '',
                        volume: entryData.volume || '',
                        pages: entryData.pages || '',
                        doi: entryData.doi || '',
                        url: entryData.url || '',
                        eprint: entryData.eprint || ''
                    });
                }
    
                // Check if it's an author entry
                if (entryData.author) {
                    const authorNames = entryData.author.split(/\s+and\s+/).map(name => name.trim());
                    console.log('Parsed author names:', authorNames); // Add this line
                    authorNames.forEach(authorName => {
                        authors.push({ name: authorName });
                    });
                }
            }
    
            console.log('Parsed references:', references); // Add this line
            console.log('Parsed authors:', authors); // Add this line
    
            return { references, authors };
        } catch (error) {
            new Notice('Failed to parse BibTeX data.');
            console.error(error);
            return null;
        }
    } */
}
