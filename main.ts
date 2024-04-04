import { Plugin, Notice } from 'obsidian';
import { openBibTeXModal } from './interface';
import { processBibTeX } from './processBibTeX';


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
                await processBibTeX(bibtexData);
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
                    await processBibTeX(bibtexData);
                } else {
                    new Notice('Failed to get BibTeX data.');
                }
            },
        });
    }
}
