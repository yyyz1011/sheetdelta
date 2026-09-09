import { Unzip, UnzipInflate, unzipSync } from 'fflate';
import { fail, wrapError } from './errors.js';

/** Internal OOXML ZIP preflight: bound both declared and observed output, including data descriptors. */
export function readZipBudget(bytes: Uint8Array, maxBytes: number, maxEntries: number, retain = false): Record<string, Uint8Array> {
  const declared = new Map<string, number>(); const finished = new Set<string>();
  const files: Record<string, Uint8Array> = Object.create(null); let total = 0, expected = 0;
  const validName = (name: string) => name && !name.startsWith('/') && !/[\\\x00]/.test(name) && !name.split('/').some(p => p === '.' || p === '..');
  try {
    unzipSync(bytes, { filter: entry => {
      if (!validName(entry.name) || declared.has(entry.name)) fail('INVALID_WORKBOOK', 'Duplicate or unsafe ZIP path.');
      declared.set(entry.name, entry.originalSize); expected += entry.originalSize;
      if (declared.size > maxEntries || expected > maxBytes) fail('LIMIT_EXCEEDED', 'Declared ZIP output exceeds workbook budget.');
      return false;
    } });
    const seen = new Set<string>();
    const unzip = new Unzip(file => {
      if (!validName(file.name) || seen.has(file.name) || !declared.has(file.name)) fail('INVALID_WORKBOOK', 'ZIP directory and entry paths do not agree.');
      seen.add(file.name); let size = 0; const chunks: Uint8Array[] = [];
      file.ondata = (error, chunk, final) => {
        if (error) wrapError(error, 'INVALID_WORKBOOK', 'Unable to decompress ZIP entry.');
        size += chunk.length; total += chunk.length;
        if (total > maxBytes) fail('LIMIT_EXCEEDED', 'Actual ZIP output exceeds workbook budget.');
        if (size > declared.get(file.name)!) fail('INVALID_WORKBOOK', 'ZIP entry expands beyond its declared size.');
        if (retain) chunks.push(chunk);
        if (final) {
          if (size !== declared.get(file.name)) fail('INVALID_WORKBOOK', 'ZIP entry size does not agree with its directory.');
          finished.add(file.name);
          if (retain) { const data = new Uint8Array(size); let offset = 0; for (const c of chunks) { data.set(c, offset); offset += c.length; } files[file.name] = data; }
        }
      };
      file.start();
    });
    unzip.register(UnzipInflate);
    // Bounded compressed chunks reduce per-callback expansion; this is not a hard process-memory sandbox.
    for (let offset = 0; offset < bytes.length; offset += 1024) unzip.push(bytes.subarray(offset, offset + 1024), offset + 1024 >= bytes.length);
    if (finished.size !== declared.size) fail('INVALID_WORKBOOK', 'ZIP entries are incomplete.');
    return files;
  } catch (error) { wrapError(error, 'INVALID_WORKBOOK', 'Invalid workbook ZIP package.'); }
}
