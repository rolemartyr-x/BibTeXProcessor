import { register } from 'node:module';

// Registers the obsidian-loader hook so test files (and the modules they
// import) can resolve the `obsidian` package without the real plugin host.
register('./obsidian-loader.mjs', import.meta.url);
