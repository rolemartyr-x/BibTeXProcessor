import { Modal } from 'obsidian';

/**
 * Opens a BibTeX modal for entering BibTeX data and returns the entered BibTeX data.
 *
 * @return {Promise<string | null>} A promise that resolves with the entered BibTeX data or null if no data was entered.
 */
export async function openBibTeXModal(): Promise<string | null> {
    console.log('BibTeX modal opened');
    return new Promise((resolve) => {
        //Create modal
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
                    event.preventDefault(); 
                    processButton.click(); 
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