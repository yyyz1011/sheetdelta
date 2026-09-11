/// <reference lib="webworker" />
import { installImportWorker } from "sheetdelta-core/worker";
// Register application-owned row/table/batch rules here when needed.
installImportWorker(self);
