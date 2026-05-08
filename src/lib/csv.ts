import Papa from 'papaparse';

/**
 * Parse a CSV string into an array of row objects, with normalized header keys.
 */
export function parseCsv<T extends Record<string, string> = Record<string, string>>(text: string): T[] {
  if (!text || !text.trim()) return [];
  const result = Papa.parse<T>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
    dynamicTyping: false,
  });
  // Filter out fully empty rows that papaparse may emit
  return (result.data || []).filter((row) => row && Object.values(row).some((v) => v !== '' && v != null)) as T[];
}

/**
 * Best-effort date parse. LinkedIn uses a few date formats:
 * - ISO 8601 (e.g., 2023-09-12 14:25:01)
 * - "MMM DD, YYYY"
 * - "MM/DD/YYYY"
 * - Unix milliseconds
 */
export function parseDate(input: string | undefined | null): Date | undefined {
  if (!input) return undefined;
  const s = String(input).trim();
  if (!s) return undefined;
  // Numeric epoch
  if (/^\d{10,}$/.test(s)) {
    const n = Number(s);
    const d = new Date(n.toString().length === 10 ? n * 1000 : n);
    return isNaN(d.getTime()) ? undefined : d;
  }
  const direct = new Date(s);
  if (!isNaN(direct.getTime())) return direct;
  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (mdy) {
    const [, mm, dd, yy] = mdy;
    const yyyy = yy.length === 2 ? `20${yy}` : yy;
    const d = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}
