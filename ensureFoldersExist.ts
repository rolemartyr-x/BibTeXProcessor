import { ensureFolderExists } from './ensureFolderExists';

export async function ensureFoldersExist() {
    await ensureFolderExists('Sources');
    await ensureFolderExists('Sources/Authors');
    await ensureFolderExists('Sources/References');
}