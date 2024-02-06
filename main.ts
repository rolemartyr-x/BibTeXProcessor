import { Plugin, Notice, normalizePath, TFile, MarkdownView, Modal } from 'obsidian';

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

export default class BibTeXProcessorPlugin extends Plugin {
    async onload() {
        // Register command to process BibTeX input
        this.addCommand({
            id: 'process-bibtex',
            name: 'Process BibTeX',
            callback: () => this.openBibTeXModal(),
        });
    }

    openBibTeXModal() {
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
        if (!parsedData) return; // Parsing failed

        // Generate folder hierarchy
        const vault = this.app.vault;
        const sourcesFolder = vault.getAbstractFileByPath('Sources');
        const authorsFolder = vault.getAbstractFileByPath('Authors');
        const referencesFolder = vault.getAbstractFileByPath('References');

        if (!sourcesFolder || !authorsFolder || !referencesFolder) {
            new Notice('Failed to create necessary folders.');
            return;
        }

        // Process references
        for (const reference of parsedData.references) {
            // Extract reference information
            const { title, publisher, volume, author, year, pages } = reference;

            // Create reference page
            const referencePagePath = `References/${normalizePath(title)}.md`;
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
            const authorPagePath = `Authors/${normalizePath(name)}.md`;
            const authorPage = await vault.create(authorPagePath, '');
            if (authorPage instanceof TFile) {
                const authorContent = `# ${name}`;
                await vault.modify(authorPage, authorContent);
            }
        }

        // Display success message
        new Notice('BibTeX processing complete!');
    }

    parseBibTeX(bibtexInput: string): BibTeXData | null {
        // Replace this function with actual BibTeX parsing logic
        // This function should return an object with references and authors arrays
        try {
            // Example parsing logic
            const references: Reference[] = [];
            const authors: Author[] = [];
            // Parse BibTeX data and populate references and authors arrays
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
