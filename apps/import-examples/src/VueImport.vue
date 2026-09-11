<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import type { WorkerImportResult } from "sheetdelta-core/worker";
import { importSupplier, downloadReport } from "./shared";
const file = ref<File>(),
  format = ref<"csv" | "excel">("csv"),
  sheet = ref("Data"),
  phase = ref("Choose a file"),
  busy = ref(false),
  result = ref<WorkerImportResult>();
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
    <ul>
      <li v-for="(issue, i) in result.result.issues.slice(0, 20)" :key="i">
        Row {{ issue.source?.sourceRow ?? "—" }} · {{ issue.column }}:
        {{ issue.message }}
      </li>
    </ul>
    <button
      v-if="result.report"
      class="secondary"
      @click="downloadReport(result.report)"
    >
      Download repair workbook
    </button></template
  >
</template>
