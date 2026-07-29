// Minimal stand-in for the `obsidian` package used only so pure-logic modules
// (e.g. parseBibTeX.ts, which constructs a Notice on a parse failure) can be
// imported under Vitest. The real `obsidian` package ships type declarations
// only - no runtime implementation - so it can't be imported directly outside
// the Obsidian app. This is not a full mock of the Obsidian API.
export class Notice {
    constructor(_message?: string) {
        // no-op
    }
}
