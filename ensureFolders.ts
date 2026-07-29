import { App, TFolder } from 'obsidian';

async function ensureFolderExists(app: App, folderName: string): Promise<void> {
    const folder = app.vault.getAbstractFileByPath(folderName);
    if (!folder || !(folder instanceof TFolder)) {
        await app.vault.createFolder(folderName);
    }
}

export async function ensureFoldersExist(app: App): Promise<void> {
    await ensureFolderExists(app, 'Sources');
    await ensureFolderExists(app, 'Sources/Authors');
    await ensureFolderExists(app, 'Sources/References');
}
