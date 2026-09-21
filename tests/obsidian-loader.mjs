// The real `obsidian` package ships only type declarations (no runtime
// code) - it's provided by the Obsidian app at runtime. Modules under test
// that import runtime values from it (e.g. parseBibTeX.ts, which constructs
// a Notice on a parse failure) can't resolve it outside the Obsidian app, so
// this hook redirects any `import ... from 'obsidian'` to the local stub.
const mockUrl = new URL('./__mocks__/obsidian.ts', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
    if (specifier === 'obsidian') {
        return { url: mockUrl, shortCircuit: true };
    }

    try {
        return await nextResolve(specifier, context);
    } catch (err) {
        // Source files use bundler-style extensionless relative imports
        // (e.g. `./types`), which esbuild resolves but Node's own ESM
        // resolver doesn't. Retry those as explicit `.ts` files.
        const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
        const isMissingExtension =
            err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'ERR_UNSUPPORTED_DIR_IMPORT';
        if (isRelative && isMissingExtension) {
            return nextResolve(`${specifier}.ts`, context);
        }
        throw err;
    }
}
