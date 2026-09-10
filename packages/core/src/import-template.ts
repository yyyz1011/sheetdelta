import { fail, assertRecord } from './errors.js';
import { cleanTable } from './clean.js';
import { validateTable } from './validate.js';
import { importFile, mapImportHeaders, type ImportField, type ImportOptions, type ImportSchema } from './import.js';

/** Portable configuration only. Callbacks, files, credentials and business data are not stored. */
export interface ImportTemplate {
  version: 1;
  id: string;
  revision: number;
  format: 'csv' | 'excel';
  headerRow?: number;
  sheet?: string;
  delimiter?: string;
  encoding?: string;
  values?: 'display' | 'raw';
  fields: readonly ImportField[];
  allowUnknownColumns?: boolean;
}
export interface TemplateImportOptions extends Omit<ImportOptions, 'format'> {
  rowRules?: ImportSchema['rowRules'];
  tableRules?: ImportSchema['tableRules'];
  batchRules?: ImportSchema['batchRules'];
}
const MAX_JSON = 1024 * 1024;
function jsonValue(value: unknown, active = new Set<object>(), depth = 0): void {
  if (depth > 32) fail('INVALID_OPTIONS', 'Template nesting exceeds 32 levels.');
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number' && Number.isFinite(value)) return;
  if (!value || typeof value !== 'object' || active.has(value)) fail('INVALID_OPTIONS', 'Templates require finite, acyclic JSON values; callbacks and undefined are not serializable.');
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) fail('INVALID_OPTIONS', 'Templates require plain JSON objects.');
  active.add(value);
  if (Object.getOwnPropertySymbols(value).length) fail('INVALID_OPTIONS', 'Template symbol properties are not supported.');
  for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(value))) if (!('value' in descriptor)) fail('INVALID_OPTIONS', 'Template accessors are not supported.');
  for (const child of Array.isArray(value) ? value : Object.values(value)) jsonValue(child, active, depth + 1);
  active.delete(value);
}
function keys(value: unknown, allowed: readonly string[], label: string): asserts value is Record<string, unknown> {
  assertRecord(value, label);
  for (const key of Object.keys(value as object)) if (!allowed.includes(key)) fail('INVALID_OPTIONS', `Unknown ${label} property: ${key}.`);
}
function boolean(value: unknown, label: string) { if (value !== undefined && typeof value !== 'boolean') fail('INVALID_OPTIONS', `${label} must be boolean.`); }
function checked(value: unknown): ImportTemplate {
  jsonValue(value);
  keys(value, ['version','id','revision','format','headerRow','sheet','delimiter','encoding','values','fields','allowUnknownColumns'], 'template');
  if (value.version !== 1) fail('INVALID_OPTIONS', 'Unsupported template version; expected 1.');
  if (typeof value.id !== 'string' || !value.id.trim() || !Number.isSafeInteger(value.revision) || (value.revision as number) < 1) fail('INVALID_OPTIONS', 'Template id and positive integer revision are required.');
  if (value.format !== 'csv' && value.format !== 'excel') fail('INVALID_OPTIONS', 'Template format must be csv or excel.');
  if (value.headerRow !== undefined && (!Number.isSafeInteger(value.headerRow) || (value.headerRow as number) < 1 || (value.headerRow as number) > 1048576)) fail('INVALID_OPTIONS', 'Template headerRow must be an Excel-range one-based row.');
  boolean(value.allowUnknownColumns, 'allowUnknownColumns');
  if (value.format === 'csv') {
    if (value.sheet !== undefined || value.values !== undefined) fail('INVALID_OPTIONS', 'CSV templates cannot specify sheet or values.');
    if (value.delimiter !== undefined && (typeof value.delimiter !== 'string' || !value.delimiter || /[\r\n"\uFEFF]/.test(value.delimiter))) fail('INVALID_OPTIONS', 'Invalid template delimiter.');
    if (value.encoding !== undefined) {
      if (typeof value.encoding !== 'string' || !value.encoding) fail('INVALID_OPTIONS', 'Invalid template encoding.');
      try { new TextDecoder(value.encoding); } catch { fail('INVALID_OPTIONS', 'Unsupported template encoding.'); }
    }
  } else {
    if (value.delimiter !== undefined || value.encoding !== undefined) fail('INVALID_OPTIONS', 'Excel templates cannot specify delimiter or encoding.');
    if (value.sheet !== undefined && (typeof value.sheet !== 'string' || !value.sheet.trim())) fail('INVALID_OPTIONS', 'Invalid template sheet.');
    if (value.values !== undefined && value.values !== 'display' && value.values !== 'raw') fail('INVALID_OPTIONS', 'Invalid template values policy.');
  }
  if (!Array.isArray(value.fields)) fail('INVALID_OPTIONS', 'Template fields must be an array.');
  for (const field of value.fields) {
    keys(field, ['key','aliases','source','requiredColumn','clean','rule'], 'field');
    if (field.clean !== undefined) {
      keys(field.clean, ['trim','case','emptyValue','type','dictionary'], 'clean');
      boolean(field.clean.trim, 'trim');
      if (field.clean.case !== undefined && !['lower','upper'].includes(field.clean.case as string)) fail('INVALID_OPTIONS', 'Invalid clean case.');
      if (field.clean.type !== undefined && !['string','number','boolean'].includes(field.clean.type as string)) fail('INVALID_OPTIONS', 'Invalid clean type.');
      if (field.clean.dictionary !== undefined) {
        keys(field.clean.dictionary, ['entries','unknown'], 'dictionary');
        if (!Array.isArray(field.clean.dictionary.entries)) fail('INVALID_OPTIONS', 'Dictionary entries must be an array.');
        for (const entry of field.clean.dictionary.entries) keys(entry, ['from','to'], 'dictionary entry');
      }
    }
    if (field.rule !== undefined) {
      keys(field.rule, ['required','type','unique','min','max','minLength','maxLength','enum','pattern'], 'rule');
      for (const bound of ['min','max','minLength','maxLength']) if (field.rule[bound] !== undefined && typeof field.rule[bound] !== 'number') fail('INVALID_OPTIONS', `Invalid rule ${bound}.`);
      boolean(field.rule.required, 'required'); boolean(field.rule.unique, 'unique');
      if (field.rule.type !== undefined && !['string','number','boolean','date'].includes(field.rule.type as string)) fail('INVALID_OPTIONS', 'Invalid rule type.');
      if (field.rule.pattern !== undefined && typeof field.rule.pattern !== 'string') fail('INVALID_OPTIONS', 'Pattern must be a string.');
      if (field.rule.enum !== undefined && (!Array.isArray(field.rule.enum) || field.rule.enum.some(v => v !== null && !['string','number','boolean'].includes(typeof v)))) fail('INVALID_OPTIONS', 'Enum must contain JSON primitives.');
    }
  }
  const template = value as unknown as ImportTemplate;
  mapImportHeaders(['__template_validation__'], template.fields);
  cleanTable([], Object.fromEntries(template.fields.filter(f => f.clean !== undefined).map(f => [f.key, f.clean!])));
  validateTable([], Object.fromEntries(template.fields.filter(f => f.rule !== undefined).map(f => [f.key, f.rule!])));
  return template;
}
/** Validate and serialize a version-1 template; never silently drop unsupported configuration. */
export function serializeImportTemplate(template: ImportTemplate): string {
  const json = JSON.stringify(checked(template));
  if (json.length > MAX_JSON || new TextEncoder().encode(json).length > MAX_JSON) fail('LIMIT_EXCEEDED', 'Template exceeds 1 MiB of JSON.');
  return json;
}
/** Parse an independently owned, validated template. Unknown versions/properties fail explicitly. */
export function parseImportTemplate(json: string): ImportTemplate {
  if (typeof json !== 'string') fail('INVALID_OPTIONS', 'Template JSON must be text.');
  if (json.length > MAX_JSON || new TextEncoder().encode(json).length > MAX_JSON) fail('LIMIT_EXCEEDED', 'Template exceeds 1 MiB of JSON.');
  let value: unknown;
  try { value = JSON.parse(json); } catch { fail('INVALID_OPTIONS', 'Invalid template JSON.'); }
  return checked(value);
}
/** Apply saved layout and fields; runtime rules and cancellation remain application-owned. */
export async function importWithTemplate(input: string | ArrayBuffer | Uint8Array, template: ImportTemplate, options: TemplateImportOptions = {}) {
  const saved = parseImportTemplate(serializeImportTemplate(template));
  assertRecord(options, 'options');
  const { rowRules, tableRules, batchRules, ...runtime } = options;
  return importFile(input, { fields: saved.fields, allowUnknownColumns: saved.allowUnknownColumns, rowRules, tableRules, batchRules }, {
    ...runtime, format: saved.format, sheet: saved.sheet,
    csv: { headerRow: saved.headerRow, delimiter: saved.delimiter, encoding: saved.encoding },
    excel: { headerRow: saved.headerRow, values: saved.values },
  });
}
