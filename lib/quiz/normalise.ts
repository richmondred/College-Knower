export function normaliseAnswer(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u02bb\u02bc`´]/g, "'")
    .toLowerCase()
    .replace(/\bhawai['\s]?i\b/g, "hawaii")
    .replace(/&/g, " and ")
    .replace(/\./g, "")
    .replace(/[(),:/\\-]/g, " ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bst\b/g, "state")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasTokenBoundaryPrefix(value: string, prefix: string): boolean {
  return value === prefix || value.startsWith(`${prefix} `);
}
