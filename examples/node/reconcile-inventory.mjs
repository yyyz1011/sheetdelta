import { createReadStream, createWriteStream } from 'node:fs';
import { link, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { readCsvStream, compareSortedStreams, writeCsvStream } from 'sheetdelta-core/stream';
import { cleanTable } from 'sheetdelta-core/clean';
import { validateTable } from 'sheetdelta-core/validate';

/** Both CSV files must be sorted by the text SKU key. Existing output files are never replaced. */
export async function reconcileInventory(beforePath, afterPath, outputPath, signal) {
  const temporary = join(dirname(outputPath), `.sheetdelta-${randomUUID()}.csv`);
  async function* normalized(path) {
    const input = createReadStream(path, { signal });
    try {
      for await (const { row, rowNumber } of readCsvStream(input, { signal })) {
        const cleaned = cleanTable([row], { sku: { trim: true }, quantity: { trim: true, type: 'number' } });
        const validation = validateTable(cleaned.rows, { sku: { required: true, type: 'string' }, quantity: { required: true, type: 'number', min: 0 } });
        if (cleaned.issues.length || !validation.valid) throw new Error(`Invalid inventory record ${rowNumber}`);
        yield cleaned.rows[0];
      }
    } finally { input.destroy(); }
  }
  const summary = { added: 0, removed: 0, changed: 0, unchanged: 0 };
  async function* report() {
    for await (const diff of compareSortedStreams(normalized(beforePath), normalized(afterPath), { keys: ['sku'], columns: ['quantity'] }, { signal })) {
      summary[diff.status]++;
      if (diff.status !== 'unchanged') yield { sku: diff.key[0], status: diff.status, before: diff.before?.quantity ?? null, after: diff.after?.quantity ?? null };
    }
  }
  try {
    await pipeline(writeCsvStream(report(), { columns: ['sku', 'status', 'before', 'after'], signal }), createWriteStream(temporary, { flags: 'wx' }), { signal });
    // Linking after success exposes a complete file atomically and fails if outputPath already exists.
    await link(temporary, outputPath);
    return summary;
  } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}
