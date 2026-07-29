// Characters that are illegal (or awkward) in filenames across common OSes.
// Includes `[` and `]` even though they're filesystem-legal: this string is
// also embedded directly into Obsidian [[wikilinks]], where an unescaped
// bracket could terminate the intended link early and splice in extra,
// attacker-chosen link text.
const ILLEGAL_FILENAME_CHARS = /[\\/:*?"<>|[\]]/g;

// Control characters (code points 0-31, plus DEL/127) are invalid/awkward in
// filenames. Built from character codes (rather than a regex literal with an
// escape range) to avoid embedding raw control bytes in the source file.
const CONTROL_CHAR_CODES = [...Array.from({ length: 32 }, (_, i) => i), 127];
const CONTROL_CHARS = new RegExp(
    `[${CONTROL_CHAR_CODES.map((code) => String.fromCharCode(code)).join('')}]`,
    'g'
);

const MAX_FILENAME_LENGTH = 200;

// Windows device names, reserved regardless of extension/case.
const WINDOWS_RESERVED_NAMES = new Set([
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9',
]);

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
        .replace(ILLEGAL_FILENAME_CHARS, '_');

    // Strip any leading/trailing run of dots and/or whitespace (trailing dots
    // are invalid on Windows, leading dots risk creating hidden files, and a
    // name that is entirely dots - e.g. "..".. must not survive as-is).
    sanitized = sanitized.replace(/^[\s.]+/, '').replace(/[\s.]+$/, '');

    // Collapse any remaining (interior) run of 2+ dots, defense-in-depth
    // against ".." segments, since a "/" can no longer follow one here.
    sanitized = sanitized.replace(/\.\.+/g, '_');

    // Windows reserves these device names outright, regardless of case or
    // extension - e.g. "CON.md" is just as invalid as "CON".
    if (WINDOWS_RESERVED_NAMES.has(sanitized.toUpperCase())) {
        sanitized = `${sanitized}_`;
    }

    if (sanitized.length > MAX_FILENAME_LENGTH) {
        sanitized = sanitized.slice(0, MAX_FILENAME_LENGTH).trim();
    }

    return sanitized.length > 0 ? sanitized : 'untitled';
}
