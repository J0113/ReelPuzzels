import { LocalStorageStore } from "./LocalStorageStore";
import type { ProgressStore } from "./ProgressStore";

/**
 * The single app-wide progress store. To move progress server-side later, swap
 * this one line for `new HttpProgressStore(apiBaseUrl)` — every consumer goes
 * through the `ProgressStore` interface, so nothing else changes.
 */
export const store: ProgressStore = new LocalStorageStore();

export * from "./ProgressStore";
