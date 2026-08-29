/**
 * Minimal, dependency-free CSV serializer. Escapes values containing
 * commas, quotes, or newlines per RFC 4180.
 */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = value instanceof Date ? value.toISOString() : String(value);
    if (/[",\n\r]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((col) => escape(row[col])).join(','));

  return [header, ...lines].join('\r\n');
}
