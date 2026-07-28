// Characters that are illegal (or awkward) in filenames across common OSes.
const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|]/g;

// Control characters (code points 0-31, plus DEL/127) are invalid/awkward in
// filenames. Built from character codes (rather than a regex literal with an
// escape range) to avoid embedding raw control bytes in the source file.
const CONTROL_CHAR_CODES = [...Array(32).keys(), 127];
const CONTROL_CHARS = new RegExp(
    `[${CONTROL_CHAR_CODES.map((code) => String.fromCharCode(code)).join('')}]`,
    'g'
);

const MAX_FILENAME_LENGTH = 200;

/**
 * Sanitizes a string so it can be safely used as a single filename/path
 * segment (e.g. the basename for a note). Strips characters that are illegal
 * on Windows/macOS/Linux, collapses ".." sequences (which could otherwise be
 * used to escape the intended folder), trims stray leading/trailing dots and
 * whitespace, and falls back to a default name if nothing usable remains.
 *
 * This only sanitizes a single path segment - it does not accept or preserve
 * any `/` characters, so it cannot be used to build a multi-segment path.
 */
export function sanitizeFilename(name: string): string {
    let sanitized = name
        .replace(CONTROL_CHARS, '')
        .replace(ILLEGAL_FILENAME_CHARS, '_')
        .replace(/\.\.+/g, '_');

    // Trim whitespace and stray leading/trailing dots (trailing dots are
    // invalid on Windows, and leading dots risk creating hidden files).
    sanitized = sanitized.trim().replace(/^\.+/, '').replace(/\.+$/, '').trim();

    if (sanitized.length > MAX_FILENAME_LENGTH) {
        sanitized = sanitized.slice(0, MAX_FILENAME_LENGTH).trim();
    }

    return sanitized.length > 0 ? sanitized : 'untitled';
}
