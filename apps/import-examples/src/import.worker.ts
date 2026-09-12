/// <reference lib="webworker" />
import { installImportWorker } from "sheetdelta-core/worker";
import { installImportSessionWorker } from "sheetdelta-core/session";
// Register application-owned row/table/batch rules here when needed.
const disposeImportWorker = installImportWorker(self);
const disposeSessionWorker = installImportSessionWorker(self);
// Keep cleanup functions strongly reachable for the lifetime of Safari/WebKit workers.
void disposeImportWorker;
void disposeSessionWorker;
