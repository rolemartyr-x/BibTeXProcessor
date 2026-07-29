import { Plugin, Notice } from 'obsidian';
import { openBibTeXModal } from './bibtexModal';
import { processBibTeX } from './processBibTeX';

export default class BibTeXProcessorPlugin extends Plugin {
    async onload() {
        // Add ribbon icon
        this.addRibbonIcon('book-open-check', 'Process BibTeX', async () => {
            const bibtexData = await openBibTeXModal(this.app);
            if (bibtexData) {
                await processBibTeX(this.app, bibtexData);
            } else {
                new Notice('Failed to get BibTeX data.');
            }
        });

        // Register command for command palette
        this.addCommand({
            id: 'process-bibtex',
            name: 'Process BibTeX',
            callback: async () => {
                const bibtexData = await openBibTeXModal(this.app);
                if (bibtexData) {
                    await processBibTeX(this.app, bibtexData);
                } else {
                    new Notice('Failed to get BibTeX data.');
                }
            },
        });
    }
}
