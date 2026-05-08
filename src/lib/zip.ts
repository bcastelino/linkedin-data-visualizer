import JSZip from 'jszip';
import type { FileMap } from '../types';

/**
 * Recursively extract a LinkedIn export ZIP into a Map of normalized lower-cased
 * filenames -> file text content. Handles nested ZIPs and folders.
 */
export async function extractZip(file: File): Promise<FileMap> {
  const buffer = await file.arrayBuffer();
  const map: FileMap = new Map();
  await walkZip(buffer, '', map);
  return map;
}

async function walkZip(buffer: ArrayBuffer, prefix: string, map: FileMap): Promise<void> {
  const zip = await JSZip.loadAsync(buffer);
  const entries = Object.values(zip.files);
  for (const entry of entries) {
    if (entry.dir) continue;
    const path = (prefix ? `${prefix}/` : '') + entry.name;
    if (path.toLowerCase().endsWith('.zip')) {
      const inner = await entry.async('arraybuffer');
      await walkZip(inner, path, map);
      continue;
    }
    if (path.toLowerCase().endsWith('.csv') || path.toLowerCase().endsWith('.json') || path.toLowerCase().endsWith('.txt') || path.toLowerCase().endsWith('.html')) {
      const text = await entry.async('string');
      map.set(normalizePath(path), text);
    }
  }
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase();
}

/**
 * Look up a file in the FileMap by basename (case-insensitive), allowing
 * nested folders. Optionally support partial filename matches (e.g., for
 * files like `Hashtag_Follows_<id>.csv`).
 */
export function findFile(map: FileMap, name: string, opts?: { partial?: boolean }): string | undefined {
  const target = name.toLowerCase();
  for (const [path, content] of map) {
    const base = path.split('/').pop() ?? path;
    if (base === target) return content;
    if (opts?.partial && base.includes(target.replace(/\.csv$/, ''))) return content;
  }
  return undefined;
}

export function listBasenames(map: FileMap): string[] {
  const names: string[] = [];
  for (const path of map.keys()) {
    const base = path.split('/').pop() ?? path;
    names.push(base);
  }
  return Array.from(new Set(names)).sort();
}
