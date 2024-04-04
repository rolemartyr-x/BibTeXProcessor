import { TFolder } from 'obsidian';

export async function ensureFolderExists(folderName: string) {
    const folder = this.app.vault.getAbstractFileByPath(folderName);
    if (!folder || !(folder instanceof TFolder)) {
        await this.app.vault.createFolder(folderName);
    }
}