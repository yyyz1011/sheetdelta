import { compareTables, TableValidationError } from 'sheetdelta-core';
import { parseFile } from './data';
self.onmessage = async ({ data }) => {
  const { id, type, payload } = data;
  try {
    const value = type === 'parse' ? await parseFile(payload) : compareTables(payload.left, payload.right, payload.options);
    self.postMessage({ id, value });
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : '处理失败，请检查文件后重试。', issues: error instanceof TableValidationError ? error.issues : undefined });
  }
};
