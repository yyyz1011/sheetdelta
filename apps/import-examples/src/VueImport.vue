<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import type { ImportSession, ImportSessionState } from "sheetdelta-core/session";
import type { ImportCellEdit } from "sheetdelta-core/import";
import { downloadReport, errorText, openSupplierSession, supplierFields, targets } from "./shared";

const file = ref<File>();
const format = ref<"csv" | "excel">("csv");
const headerRow = ref(1);
const session = shallowRef<ImportSession>();
const sheet = ref("");
const mapping = ref<Record<string, string>>({});
const state = shallowRef<ImportSessionState>();
const phase = ref("Choose a file");
const busy = ref(false);
const edits = ref<ImportCellEdit[]>([]);
const editRow = ref(1);
const editColumn = ref("");
const editValue = ref("");
const collected = ref<number>();
const replacement = ref<HTMLInputElement>();
let controller: AbortController | null = null;
let report: Uint8Array | undefined;
const selected = computed(() => session.value?.inspection.sheets.find((item) => item.name === sheet.value));
const headers = computed(() => selected.value?.headers ?? []);
const stage = computed(() => state.value ? (state.value.valid ? 4 : 3) : session.value ? 2 : file.value ? 1 : 0);
const progress = ["File", "Map", "Validate", "Deliver"];

const autoMap = (values: string[]) => Object.fromEntries(targets.map(({ key }) => [key, values.find((header) => header.toLowerCase() === key) ?? values[0] ?? ""]));
async function run<T>(job: (signal: AbortSignal) => Promise<T>) {
  const task = new AbortController(); controller = task; busy.value = true;
  try { return await job(task.signal); }
  catch (error) { phase.value = errorText(error); }
  finally { if (controller === task) { controller = null; busy.value = false; } }
}
function reset() { state.value = undefined; edits.value = []; collected.value = undefined; report = undefined; }
function choose(event: Event) {
  session.value?.close(); session.value = undefined; reset();
  file.value = (event.target as HTMLInputElement).files?.[0]; phase.value = "Open the file to inspect it";
}
function cancel() { controller?.abort(); }
async function open() {
  if (!file.value) return;
  session.value?.close(); session.value = undefined; reset();
  const opened = await run((signal) => openSupplierSession(file.value!, format.value, headerRow.value, signal, (value) => phase.value = value));
  if (!opened) return;
  const first = opened.inspection.sheets[0]; session.value = opened; sheet.value = first.name;
  mapping.value = autoMap(first.headers); editColumn.value = first.headers[0] ?? "";
  phase.value = `${opened.inspection.sheets.length} sheet · ${first.rowCount} rows inspected`;
}
function chooseSheet() {
  const next = selected.value!; mapping.value = autoMap(next.headers); editColumn.value = next.headers[0] ?? ""; reset(); phase.value = `${next.rowCount} rows ready to map`;
}
async function validate() {
  if (!session.value) return;
  const next = await run((signal) => session.value!.prepare(sheet.value, { fields: supplierFields(mapping.value) }, { signal, mode: "valid-rows", onProgress: (event) => phase.value = event.phase }));
  if (!next) return; state.value = next; edits.value = []; collected.value = undefined; report = undefined;
  phase.value = `${next.summary.accepted} accepted / ${next.summary.total} rows`;
}
function queueEdit() {
  if (!editColumn.value || editRow.value < 1) return;
  edits.value = [...edits.value.filter((edit) => edit.row !== editRow.value || edit.column !== editColumn.value), { row: editRow.value, column: editColumn.value, value: editValue.value }]; editValue.value = "";
}
function selectIssue(row: number, column: string, value: unknown) {
  editRow.value = row; editColumn.value = column; editValue.value = String(value ?? "");
  replacement.value?.focus(); replacement.value?.scrollIntoView({ block: "center" });
}
async function applyEdits() {
  if (!session.value || !edits.value.length) return;
  const portableEdits = edits.value.map((edit) => ({ ...edit }));
  const next = await run((signal) => session.value!.repair(portableEdits, { signal, mode: "valid-rows", onProgress: (event) => phase.value = event.phase }));
  if (!next) return; state.value = next; edits.value = []; collected.value = undefined; report = undefined;
  phase.value = `${next.summary.accepted} accepted / ${next.summary.total} rows`;
}
async function download() {
  if (!session.value) return;
  const bytes = report ?? await run((signal) => session.value!.report({ signal, onProgress: (event) => phase.value = event.phase }));
  if (!bytes) return; report = bytes; downloadReport(bytes);
  phase.value = `${state.value?.summary.accepted ?? 0} accepted / ${state.value?.summary.total ?? 0} rows`;
}
async function collect() {
  if (!session.value) return; const result = await run((signal) => session.value!.result({ signal }));
  if (!result) return; collected.value = result.rows.length; phase.value = `${result.rows.length} rows collected for submission`;
}
onBeforeUnmount(() => { controller?.abort(); session.value?.close(); });
</script>

<template>
  <div class="panel-heading"><p class="eyebrow">VUE / PERSISTENT WORKER</p><h2>Supplier intake</h2></div>
  <ol class="pipeline" aria-label="Import stages"><li v-for="(label, index) in progress" :key="label" :class="index < stage ? 'done' : index === stage ? 'current' : ''"><span>{{ index + 1 }}</span>{{ label }}</li></ol>
  <div class="input-grid">
    <label>File<input type="file" accept=".csv,.xlsx,.xls" :disabled="busy" @change="choose" /></label>
    <label>Format<select v-model="format" :disabled="busy || Boolean(session)"><option value="csv">CSV</option><option value="excel">Excel</option></select></label>
    <label>Header row<input v-model.number="headerRow" type="number" min="1" :disabled="busy || Boolean(session)" /></label>
  </div>
  <div class="actions"><button :disabled="!file || busy" @click="open">Open file</button><button class="secondary" :disabled="!busy" @click="cancel">Cancel</button></div>
  <p role="status" aria-live="polite">{{ phase }}</p>
  <div v-if="session && selected" class="work-section">
    <div class="section-title"><span>02</span><div><h3>Map the source</h3><p>Choose a sheet and connect its headers to the fields your app expects.</p></div></div>
    <label v-if="session.inspection.sheets.length > 1">Worksheet<select v-model="sheet" aria-label="Worksheet" @change="chooseSheet"><option v-for="item in session.inspection.sheets" :key="item.name">{{ item.name }}</option></select></label>
    <div class="mapping-grid"><label v-for="target in targets" :key="target.key"><span>{{ target.label }}</span><select v-model="mapping[target.key]" :aria-label="`${target.label} source`"><option value="">Select a header</option><option v-for="header in headers" :key="header">{{ header }}</option></select></label></div>
    <div class="table-wrap"><table><thead><tr><th>#</th><th v-for="header in headers" :key="header">{{ header }}</th></tr></thead><tbody><tr v-for="(row, index) in selected.preview" :key="index"><td>{{ selected.rowNumbers[index] }}</td><td v-for="header in headers" :key="header">{{ row[header] ?? '' }}</td></tr></tbody></table></div>
    <button :disabled="busy || Object.values(mapping).some(value => !value)" @click="validate">Validate mapping</button>
  </div>
  <div v-if="state" class="work-section">
    <div class="section-title"><span>03</span><div><h3>Repair in batches</h3><p>{{ state.summary.errors }} errors · {{ state.summary.warnings }} warnings · {{ state.changeCount }} cleaned values</p></div></div>
    <div class="metrics"><b>{{ state.summary.total }}<small>rows</small></b><b>{{ state.summary.accepted }}<small>accepted</small></b><b :class="state.summary.errors ? 'danger' : 'safe'">{{ state.summary.errors }}<small>errors</small></b></div>
    <ul v-if="state.issues.length" class="issues"><li v-for="(issue, index) in state.issues.slice(0, 20)" :key="index"><div><b>Row {{ issue.source?.sourceRow ?? '—' }} · {{ issue.column ?? 'row' }}</b><span>{{ issue.message }}</span></div><button v-if="issue.row && issue.source?.sourceColumn" class="secondary issue-edit" @click="selectIssue(issue.row, issue.source.sourceColumn, issue.sourceValue)">Queue fix</button></li></ul>
    <fieldset :disabled="busy"><legend>Batch correction</legend><div class="repair-grid"><label>Data row<input v-model.number="editRow" aria-label="Data row" type="number" min="1" :max="state.summary.total" /></label><label>Source column<select v-model="editColumn" aria-label="Source column"><option v-for="header in headers" :key="header">{{ header }}</option></select></label><label>Replacement value<input ref="replacement" v-model="editValue" aria-label="Replacement value" /></label></div><div class="actions"><button class="secondary" @click="queueEdit">Add to batch</button><button :disabled="!edits.length" @click="applyEdits">Apply {{ edits.length || '' }} changes</button></div><p v-if="edits.length" class="queue">Queued: {{ edits.map(edit => `row ${edit.row} / ${edit.column}`).join(' · ') }}</p></fieldset>
    <div class="delivery"><button class="secondary" :disabled="busy" @click="download">Download repair workbook</button><button :disabled="busy || !state.summary.accepted" @click="collect">Collect accepted rows</button><strong v-if="collected !== undefined">{{ collected }} rows ready</strong></div>
  </div>
</template>
