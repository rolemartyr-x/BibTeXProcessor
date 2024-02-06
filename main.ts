import {
	//App,
	//CachedMetadata,
	//Editor,
	//MarkdownView,
	//Modal,
	//Notice,
	Plugin,
	//PluginSettingTab,
	//Setting
} from 'obsidian';


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
            callback: () => this.processBibTeX(),
        });
    }

    async processBibTeX() {
        // Parse BibTeX input (Assuming you have a function to parse BibTeX)
        const bibtexData = this.parseBibTeX(); // Replace with actual parsing logic

        // Generate folder hierarchy
        const sourcesFolder = await this.app.vault.createFolder('Sources');
        const authorsFolder = await sourcesFolder.createFolder('Authors');
        const referencesFolder = await sourcesFolder.createFolder('References');

        // Process references
        for (const reference of bibtexData.references) {
            // Extract reference information
            const { title, publisher, volume, author, year, pages } = reference;

            // Create reference page
            const referencePagePath = `References/${title}.md`;
            const referencePage = await this.app.vault.createMarkdownFile(referencePagePath);
            const referenceContent = `# ${title}`;
            await referencePage.write(referenceContent);

            // Add YAML frontmatter
            await referencePage.changeFrontmatter((data: FrontMatterData) => {
                data.title = title;
                data.publisher = publisher;
                data.volume = volume;
                data.author = author;
                data.year = year;
                data.pages = pages;
            });
        }

        // Process authors
        for (const author of bibtexData.authors) {
            // Extract author information
            const { name } = author;

            // Create author page
            const authorPagePath = `Authors/${name}.md`;
            const authorPage = await this.app.vault.createMarkdownFile(authorPagePath);
            const authorContent = `# ${name}`;
            await authorPage.write(authorContent);

            // Add YAML frontmatter
            await authorPage.changeFrontmatter((data: FrontMatterData) => {
                data.name = name;
            });
        }

        // Display success message
        this.app.workspace.nag("BibTeX processing complete!");
    }

    parseBibTeX(): BibTeXData {
        // Replace this function with actual BibTeX parsing logic
        // This function should return an object with references and authors arrays
        return {
            references: [
                {
                    title: "Sample Reference",
                    publisher: "Sample Publisher",
                    volume: "1",
                    author: "John Doe",
                    year: 2023,
                    pages: 100
                }
            ],
            authors: [
                { name: "John Doe" },
                { name: "Jane Smith" }
            ]
        };
    }
}
