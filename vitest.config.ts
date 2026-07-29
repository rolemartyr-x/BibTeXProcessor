import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        environment: 'node',
    },
    resolve: {
        alias: {
            // The real `obsidian` package ships only type declarations (no
            // runtime code) - it's provided by the Obsidian app at runtime.
            // Tests only touch the small bits used for error reporting, so
            // swap in a minimal stub instead of the full API surface.
            obsidian: resolve(__dirname, 'tests/__mocks__/obsidian.ts'),
        },
    },
});
