<script setup lang="ts">
import { ref, shallowRef, onBeforeUnmount } from "vue";
import type { WorkerImportResult } from "sheetdelta-core/worker";
import {
  importSupplier,
  downloadReport,
  repairSupplier,
  generateSupplierReport,
} from "./shared";
const file = ref<File>(),
  format = ref<"csv" | "excel">("csv"),
  sheet = ref("Data"),
  phase = ref("Choose a file"),
  busy = ref(false),
  result = shallowRef<WorkerImportResult>();
const editRow = ref(1),
  editColumn = ref("qty"),
  editValue = ref("");
async function repair() {
  if (!result.value) return;
  const task = new AbortController();
  controller = task;
  busy.value = true;
  try {
    const next = await repairSupplier(
      result.value,
      editRow.value,
      editColumn.value,
      editValue.value,
      task.signal,
      (p) => {
        if (controller === task) phase.value = p;
      },
    );
    if (controller === task) {
      result.value = next;
      phase.value = `${next.result.summary.accepted} accepted / ${next.result.summary.total} rows`;
    }
  } catch (error) {
    if (controller === task)
      phase.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (controller === task) {
      busy.value = false;
      controller = null;
    }
  }
}
const replacementInput = ref<HTMLInputElement>();
function selectIssue(row: number, column: string) {
  if (!result.value) return;
  editRow.value = row;
  editColumn.value = column;
  editValue.value = String(
    result.value.result.original.rows[row - 1][column] ?? "",
  );
  replacementInput.value?.focus();
  replacementInput.value?.scrollIntoView({ block: "center" });
}
async function download() {
  if (!result.value || busy.value) return;
  const previous = result.value;
  if (previous.report) {
    downloadReport(previous.report);
    return;
  }
  const task = new AbortController();
  controller = task;
  busy.value = true;
  try {
    const report = await generateSupplierReport(previous, task.signal, (p) => {
      if (controller === task) phase.value = p;
    });
    if (controller === task) {
      result.value = { ...previous, report };
      downloadReport(report);
      phase.value = `${previous.result.summary.accepted} accepted / ${previous.result.summary.total} rows`;
    }
  } catch (error) {
    if (controller === task)
      phase.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (controller === task) {
      controller = null;
      busy.value = false;
    }
  }
}
let controller: AbortController | null = null;
onBeforeUnmount(() => {
  controller?.abort();
  controller = null;
});
function cancel() {
  controller?.abort();
}
function choose(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0];
  result.value = undefined;
  phase.value = "Choose Import to validate";
}
async function start() {
  if (!file.value) return;
  controller?.abort();
  const task = new AbortController();
  controller = task;
  busy.value = true;
  result.value = undefined;
  try {
    const value = await importSupplier(
      file.value,
      format.value,
      sheet.value,
      task.signal,
      (p) => {
        if (controller === task) phase.value = p;
      },
    );
    if (controller === task) {
      result.value = value;
      phase.value = `${value.result.summary.accepted} accepted / ${value.result.summary.total} rows`;
    }
  } catch (error) {
    if (controller === task)
      phase.value = error instanceof Error ? error.message : String(error);
  } finally {
    if (controller === task) {
      busy.value = false;
      controller = null;
    }
  }
}
</script>
<template>
  <p class="eyebrow">02 / VUE</p>
  <h2>Supplier import</h2>
  <label
    >File<input
      type="file"
      accept=".csv,.xlsx,.xls"
      :disabled="busy"
      @change="choose" /></label
  ><label
    >Format<select v-model="format" :disabled="busy">
      <option value="csv">CSV</option>
      <option value="excel">Excel</option>
    </select></label
  ><label v-if="format === 'excel'"
    >Sheet<input v-model="sheet" :disabled="busy"
  /></label>
  <div class="actions">
    <button :disabled="!file || busy" @click="start">Import</button
    ><button class="secondary" :disabled="!busy" @click="cancel">Cancel</button>
  </div>
  <p role="status" aria-live="polite">{{ phase }}</p>
  <template v-if="result"
    ><p>
      {{ result.result.summary.errors }} errors ·
      {{ result.result.summary.warnings }} warnings
    </p>
    <fieldset :disabled="busy">
      <legend>Repair a source cell</legend>
      <p>
        Data row counts from 1, excluding the header. Enter an exact source
        column and a replacement value.
      </p>
      <label
        >Data row<input
          type="number"
          min="1"
          :max="result.result.original.rows.length"
          v-model.number="editRow"
      /></label>
      <label
        >Source column<select v-model="editColumn">
          <option
            v-for="h in result.result.original.headers"
            :key="h"
            :value="h"
          >
            {{ h }}
          </option>
        </select></label
      >
      <label
        >Replacement value<input ref="replacementInput" v-model="editValue"
      /></label>
      <button :disabled="busy" @click="repair">Apply and revalidate</button>
    </fieldset>
    <ul>
      <li v-for="(issue, i) in result.result.issues.slice(0, 20)" :key="i">
        Row {{ issue.source?.sourceRow ?? "—" }} · {{ issue.column }}:
        {{ issue.message }}
        <button
          v-if="issue.row && issue.source?.sourceColumn"
          class="secondary issue-edit"
          :disabled="busy"
          @click="selectIssue(issue.row, issue.source.sourceColumn)"
        >
          Edit row {{ issue.source.sourceRow ?? issue.row }} ·
          {{ issue.column }}
        </button>
      </li>
    </ul>
    <button class="secondary" @click="download" :disabled="busy">
      Download repair workbook
    </button></template
  >
</template>
