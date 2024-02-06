import { Plugin, Notice, normalizePath, TFolder, TFile, Modal } from 'obsidian';

interface Reference {
    title: string;
    publisher: string;
    volume: string;
    author: string;
    year: number;
    pages: number;
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
    publisher?: string;
    volume?: string;
    year?: string;
    pages?: string;
}

export default class BibTeXProcessorPlugin extends Plugin {
    async onload() {
        console.log('BibTeX plugin loaded'); // Check if plugin is loaded
        // Register command to process BibTeX input
        this.addCommand({
            id: 'process-bibtex',
            name: 'Process BibTeX',
            callback: () => this.openBibTeXModal(),
        });
    }
    

    openBibTeXModal() {
        console.log('BibTeX modal opened'); // Check if modal is opened
        // Create modal
        const modal = new Modal(this.app);
    
        // Set modal title
        modal.contentEl.appendChild(createEl('h2', { text: 'Enter BibTeX Data' }));
    
        // Create textarea for BibTeX input
        const textarea = modal.contentEl.createEl('textarea', { cls: 'markdown-editor-input' });
    
        // Create "Process" button
        const processButton = modal.contentEl.createEl('button', { text: 'Process' });
        processButton.onclick = async () => {
            const bibtexData = textarea.value;
            modal.close();
            if (bibtexData.trim() !== '') {
                await this.processBibTeX(bibtexData);
            } else {
                new Notice('Please enter BibTeX data.');
            }
        };
    
        // Open the modal
        modal.open();
    }
    

    async processBibTeX(bibtexData: string) {
        // Parse BibTeX input (You need to implement the parsing logic)
        const parsedData = this.parseBibTeX(bibtexData);
        console.log(parsedData); // Check parsed data in console
        const vault = this.app.vault;
        if (!parsedData) return; // Parsing failed
    
        // Generate folder hierarchy
        await this.ensureFoldersExist();
    
        // Process references
        for (const reference of parsedData.references) {
            // Extract reference information
            const { title, publisher, volume, author, year, pages } = reference;
    
            // Create reference page
            const referencePagePath = `Sources/References/${normalizePath(title)}.md`;
            console.log('Creating reference page:', referencePagePath); // Check reference page path
            const referencePage = await vault.create(referencePagePath, '');
            if (referencePage instanceof TFile) {
                const referenceContent = `# ${title}`;
                await vault.modify(referencePage, referenceContent);
    
                // Add YAML frontmatter
                const frontmatter = this.buildFrontmatter(reference);
                await vault.modify(referencePage, frontmatter + '\n' + referenceContent);
            }
        }
    
        // Process authors
        for (const author of parsedData.authors) {
            // Extract author information
            const { name } = author;
    
            // Create author page
            const authorPagePath = `Sources/Authors/${normalizePath(name)}.md`;
            console.log('Creating author page:', authorPagePath); // Check author page path
            const authorPage = await vault.create(authorPagePath, '');
            if (authorPage instanceof TFile) {
                const authorContent = `# ${name}`;
                await vault.modify(authorPage, authorContent);
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
                const lines = entry.split('\n');
                const entryData: BibTeXEntryData = {};
    
                // Parse each line of the entry
                for (const line of lines) {
                    const [key, value] = line.split('=').map(str => str.trim());
                    if (key && value && value.startsWith('{') && value.endsWith('}')) {
                        // Remove curly braces from value
                        const propertyName = key.toLowerCase() as keyof BibTeXEntryData;
                        entryData[propertyName] = value.slice(1, -1);
                    }
                }
    
                // Check if it's a reference or an author entry
                if (entryData.title && entryData.author) {
                    // It's a reference entry
                    references.push({
                        title: entryData.title,
                        publisher: entryData.publisher || '',
                        volume: entryData.volume || '',
                        author: entryData.author,
                        year: parseInt(entryData.year || '0', 10),
                        pages: parseInt(entryData.pages || '0', 10),
                    });
                } else if (entryData.author) {
                    // It's an author entry
                    authors.push({ name: entryData.author });
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
