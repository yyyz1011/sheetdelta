export type ErrorCode = 'INVALID_OPTIONS' | 'INVALID_DATA' | 'INVALID_HEADER' | 'LIMIT_EXCEEDED' | 'INVALID_CSV' | 'INVALID_WORKBOOK' | 'SHEET_NOT_FOUND' | 'EMPTY_WORKBOOK' | 'MISSING_KEY' | 'DUPLICATE_KEY' | 'SCHEMA_MISMATCH' | 'MERGE_CONFLICT' | 'TABLE_VALIDATION' | 'FORMULA_REJECTED' | 'MERGED_CELLS' | 'CELL_ERROR' | 'ABORTED' | 'EXPORT_FAILED';
export interface ErrorContext { operation?: string; sheet?: string; row?: number; column?: string; cell?: string; side?: string; limit?: number; actual?: number; option?: string }
/** Stable machine-readable failure, with a serializable location. */
export class SheetDeltaError extends Error {
  constructor(readonly code: ErrorCode, message: string, readonly context: ErrorContext = {}, options?: ErrorOptions) {
    super(message, options); this.name = 'SheetDeltaError';
  }
  toJSON() { return { name: this.name, code: this.code, message: this.message, context: { ...this.context } }; }
}
export function isSheetDeltaError(error: unknown): error is SheetDeltaError { return error instanceof SheetDeltaError; }
export function fail(code: ErrorCode, message: string, context: ErrorContext = {}): never { throw new SheetDeltaError(code, message, context); }
export function wrapError(error: unknown, code: ErrorCode, message: string, context: ErrorContext = {}): never {
  if (error instanceof SheetDeltaError) throw error;
  throw new SheetDeltaError(code, message, context, { cause: error });
}
export function assertRecord(value: unknown, label: string): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('INVALID_OPTIONS', `${label} must be an object.`, { option: label });
}
