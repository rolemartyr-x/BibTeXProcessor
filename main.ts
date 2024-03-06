import { Plugin, Notice, normalizePath, TFolder, TFile } from 'obsidian';
import { openBibTeXModal } from './interface';
import { } from './authors';

interface Reference {
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


interface Author {
    name: string;
}

interface BibTeXData {
    references: Reference[];
    authors: Author[];
}

interface BibTeXEntryData {
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
        const parsedData = this.parseBibTeX(bibtexData);
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
                const frontmatter = this.buildFrontmatter(reference);

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
                await this.updateAuthorPageContent(authorPage, author.name, parsedData.references);
            } else {
                // If author page doesn't exist, create it
                await this.createAuthorPage(authorPagePath, author.name, parsedData.references);
            }
        }
    
        // Display success message
        new Notice('BibTeX processing complete!');
    }
    
    async updateAuthorPageContent(authorPage: TFile, authorName: string, references: Reference[]) {
        try {
            // Read current content of the author page
            let authorPageContent = await this.app.vault.read(authorPage);
    
            // Check if the author page content already contains the "References" heading
            const referencesHeading = '### References';
            let referencesHeadingIndex = authorPageContent.indexOf(referencesHeading);
            if (referencesHeadingIndex === -1) {
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
    
            // Append the reference links
            const referenceLinks = references
                .filter((reference) => {
                    const referenceAuthors = reference.author.split(' and ').map(name => name.trim());
                    return referenceAuthors.includes(authorName);
                })
                .map((reference) => `[[${reference.title}]]`);
            authorPageContent = `${authorPageContent.slice(0, referencesHeadingIndex)}\n${referenceLinks.join('\n')}${authorPageContent.slice(referencesHeadingIndex)}`;
    
            // Update the author page with the new content
            await this.app.vault.modify(authorPage, authorPageContent);
        } catch (error) {
            console.error('Error updating author page:', error);
        }
    }
    
    
        
    async createAuthorPage(authorPagePath: string, authorName: string, references: Reference[]) {
        try {
            console.log(`Creating author page: ${authorPagePath}`);
            const frontmatter = `---\ntitle: ${authorName}\n---`;
            let authorPageContent = `${frontmatter}\n\n# ${authorName}`;
    
            // Check if any references exist for this author
            const authorReferences = references.filter((reference) => {
                const referenceAuthors = reference.author.split(' and ').map(name => name.trim());
                return referenceAuthors.includes(authorName);
            });
    
            if (authorReferences.length > 0) {
                authorPageContent += '\n\n### References\n'; // Add the "References" heading
                // Add reference links
                authorReferences.forEach((reference) => {
                    authorPageContent += `[[${reference.title}]]`;
                });
            }
    
            await this.app.vault.create(authorPagePath, authorPageContent);
            console.log(`Created author page: ${authorPagePath}`);
        } catch (error) {
            console.error('Error creating author page:', error);
        }
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
    
    parseBibTeX(bibtexInput: string): BibTeXData | null {
        try {
            const references: Reference[] = [];
            const authors: Author[] = [];
    
            // Split BibTeX input into individual entries
            const entries = bibtexInput.split('\n\n');
            console.log('Number of BibTeX entries:', entries.length);
    
            // Iterate over each BibTeX entry
            for (const entry of entries) {
                // Extract citekey
                const citeKeyMatch = entry.match(/@\w+\s*{\s*([^,]+)/);
                if (!citeKeyMatch) {
                    console.log('Failed to extract citekey:', entry);
                    continue;
                } // Skip entry if citekey is not found
                let citeKey = citeKeyMatch[1].trim();
                console.log('Citekey:', citeKey);
    
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

                console.log('Parsed entry data:', entryData);
    
                // Check if it's a reference entry
                if (entryData.title && entryData.author) {
                    console.log('Adding reference:', entryData);
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
                    const authorNames = entryData.author.split(' and ').map(name => name.trim());
                    authorNames.forEach(authorName => {
                        authors.push({ name: authorName });
                    });
                    console.log('Adding author:', authorNames);
                }
            }

            console.log('Parsed references:', references);
            console.log('Parsed authors:', authors);
    
            return { references, authors };
        } catch (error) {
            new Notice('Failed to parse BibTeX data.');
            console.error(error);
            return null;
        }
    }
    
        
        
    buildFrontmatter(reference: Reference): string {
        const frontmatter: string[] = [];
        const authors = reference.author.split(' and ').map(name => `- "[[${name.trim()}]]"`).join('\n');
        
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
}
