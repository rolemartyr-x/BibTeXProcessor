import { Plugin, Notice, normalizePath, TFolder, TFile, Modal } from 'obsidian';

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
        console.log('BibTeX plugin loaded'); // Check if plugin is loaded
        
        // Add ribbon icon
        this.addRibbonIcon('book-open-check', 'Process BibTeX', async () => {
            const bibtexData = await this.openBibTeXModal();
            if (bibtexData) {
                await this.processBibTeX(bibtexData);
            } else {
                new Notice('Failed to get BibTeX data.');
            }
        });
        
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
        
            // Create container for columns
            const columnsContainer = modal.contentEl.createDiv({ cls: 'columns' });
    
            // Create column for instructions
            const instructionsColumn = columnsContainer.createDiv({ cls: 'column' });
            instructionsColumn.appendChild(createEl('p', { text: 'Paste your BibTeX data:' }));
    
            // Create column for input box
            const inputColumn = columnsContainer.createDiv({ cls: 'column' });
            inputColumn.style.display = 'flex';
            inputColumn.style.flexDirection = 'column';
    
            // Create textarea for BibTeX input
            const textarea = inputColumn.createEl('textarea', { cls: 'markdown-editor-input' });
            textarea.placeholder = `Paste your BibTeX data here...\n\nExample:\n\n@book{Vincent_1887,\naddress={New York},\ntitle={Word studies in the New Testament},\nvolume={2},\npublisher={Charles Scribner’s Sons},\nauthor={Vincent, Marvin Richardson},\nyear={1887},\npages={24} }`;
            textarea.style.height = '300px'; // Adjust the height here

            // Handle "Enter" key press to submit the modal
            textarea.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault(); // Prevent newline in textarea
                    processButton.click(); // Simulate click on the Process button
                }
            });
    
            // Create "Process" button
            const processButton = inputColumn.createEl('button', { text: 'Process' });
            processButton.onclick = () => {
                const bibtexData = textarea.value;
                modal.close();
                if (bibtexData.trim() !== '') {
                    resolve(bibtexData);
                } else {
                    resolve(null);
                }
            };
    
            // Move Process button to the bottom-right
            const buttonWrapper = inputColumn.createDiv();
            buttonWrapper.style.marginTop = 'auto'; // Align button to the bottom
            buttonWrapper.style.alignSelf = 'flex-end'; // Align button to the right
            buttonWrapper.appendChild(processButton);
    
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
    
            // Iterate over each BibTeX entry
            for (const entry of entries) {
                // Extract citekey
                const citeKeyMatch = entry.match(/@\w+\s*{\s*([^,]+)/);
                if (!citeKeyMatch) continue; // Skip entry if citekey is not found
                let citeKey = citeKeyMatch[1].trim();
    
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
        if (reference.abstract) frontmatter.push(`abstract: ${reference.abstract}`);
        frontmatter.push(`---`);
        return frontmatter.join('\n');
    }
}
