import { Plugin, Notice, normalizePath, TFolder, /*TFile,*/ Modal } from 'obsidian';

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
}

export default class BibTeXProcessorPlugin extends Plugin {
    async onload() {
        console.log('BibTeX plugin loaded'); // Check if plugin is loaded
        // Register command to process BibTeX input
        this.addCommand({
            id: 'process-bibtex',
            name: 'Process BibTeX',
            callback: async () => {
                const bibtexData = await this.openBibTeXModal();
                if (bibtexData) {
                    await this.processBibTeX(bibtexData);
                } else {
                    new Notice('Failed to get BibTeX data.');
                }
            },
        });
    }
    

    openBibTeXModal(): Promise<string | null> {
        console.log('BibTeX modal opened'); // Check if modal is opened
        return new Promise((resolve) => {
            // Create modal
            const modal = new Modal(this.app);
        
            // Set modal title
            modal.contentEl.appendChild(createEl('h2', { text: 'Enter BibTeX Data' }));
        
            // Create textarea for BibTeX input
            const textarea = modal.contentEl.createEl('textarea', { cls: 'markdown-editor-input' });
        
            // Create "Process" button
            const processButton = modal.contentEl.createEl('button', { text: 'Process' });
            processButton.onclick = () => {
                const bibtexData = textarea.value;
                modal.close();
                if (bibtexData.trim() !== '') {
                    resolve(bibtexData);
                } else {
                    resolve(null);
                }
            };
        
            // Open the modal
            modal.open();
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
                const referenceContent = `# ${title}`;
                const frontmatter = this.buildFrontmatter(reference);
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
            const { name } = author;
    
            // Check if author page already exists
            const authorPagePath = `Sources/Authors/${normalizePath(name)}.md`;
            const authorPageExists = await vault.adapter.exists(authorPagePath);
    
            // If author page already exists, skip creation
            if (authorPageExists) {
                console.log(`Author page already exists: ${authorPagePath}`);
                continue;
            }
    
            // Create author page
            try {
                console.log(`Creating author page: ${authorPagePath}`); // Check if creating author page
                const authorContent = `# ${name}`;
                await vault.create(authorPagePath, authorContent);
                console.log(`Created author page: ${authorPagePath}`);
            } catch (error) {
                console.error('Error creating author page:', error);
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
    
    parseBibTeX(bibtexInput: string): BibTeXData | null {
        try {
            const references: Reference[] = [];
            const authors: Author[] = [];
    
            // Split BibTeX input into individual entries
            const entries = bibtexInput.split('\n\n');
    
            // Iterate over each BibTeX entry
            for (const entry of entries) {
                // Extract citekey
                const citeKeyMatch = entry.match(/@\w+\s*{\s*([^,]+)/);
                if (!citeKeyMatch) continue; // Skip entry if citekey is not found
                const citeKey = citeKeyMatch[1].trim();
    
                const lines = entry.split('\n');
                const entryData: BibTeXEntryData = {};
    
                // Parse each line of the entry
                for (const line of lines) {
                    const [key, ...values] = line.split('=').map(str => str.trim());
                    const value = values.join('=').trim();
                    if (key && value) {
                        // Remove curly braces from value
                        const propertyName = key.toLowerCase() as keyof BibTeXEntryData;
                        entryData[propertyName] = value.replace(/{|}/g, '').replace(/,$/, ''); // Remove trailing comma
                    }
                }
    
                // Check if it's a reference entry
                if (entryData.title && entryData.author) {
                    references.push({
                        citeKey,
                        abstract: entryData.abstract || '',
                        address: entryData.address || '',
                        author: entryData.author,
                        booktitle: entryData.booktitle || '',
                        doi: entryData.doi || '',
                        editor: entryData.editor || '',
                        isbn: entryData.isbn || '',
                        issn: entryData.issn || '',
                        journal: entryData.journal || '',
                        month: entryData.month || '',
                        note: entryData.note || '',
                        number: entryData.number || '',
                        pages: entryData.pages || '',
                        publisher: entryData.publisher || '',
                        title: entryData.title || '',
                        url: entryData.url || '',
                        volume: entryData.volume || '',
                        year: parseInt(entryData.year || '0', 10),             
                    });
                }
    
                // Check if it's an author entry
                if (entryData.author) {
                    const authorNames = entryData.author.split(' and ').map(name => name.trim());
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
    
    buildFrontmatter(reference: Reference): string {
        return `---\ntitle: ${reference.title}\npublisher: ${reference.publisher}\nvolume: ${reference.volume}\nauthor: ${reference.author}\nyear: ${reference.year}\npages: ${reference.pages}\n---`;
    }
}
