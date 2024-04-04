import { Author, BibTeXData, BibTeXEntryData, Reference } from './main';
import { Notice } from 'obsidian';

export async function parseBibTeX(bibtexInput: string): Promise<BibTeXData | null> {
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
    }