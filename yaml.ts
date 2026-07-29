/**
 * Encodes a string as a double-quoted YAML scalar. Used for frontmatter
 * values built from untrusted BibTeX field text, which may otherwise contain
 * YAML-significant characters (e.g. ": ", leading "- ", "#") that would
 * corrupt or silently misparse an unquoted plain scalar.
 */
export function yamlString(value: string): string {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}
