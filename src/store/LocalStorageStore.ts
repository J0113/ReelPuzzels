import {
  DEFAULT_PROGRESS,
  hydrate,
  type Progress,
  type ProgressStore,
} from "./ProgressStore";

/**
 * Browser localStorage implementation. Methods are async so this is a drop-in
 * match for a future network-backed store.
 */
export class LocalStorageStore implements ProgressStore {
  constructor(private readonly key = "rp_progress") {}

  async load(): Promise<Progress> {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return { ...DEFAULT_PROGRESS };
      return hydrate(JSON.parse(raw) as Partial<Progress>);
    } catch {
      return { ...DEFAULT_PROGRESS };
    }
  }

  async save(progress: Progress): Promise<void> {
    try {
      localStorage.setItem(this.key, JSON.stringify(progress));
    } catch {
      /* quota / disabled storage — ignore, in-memory state still holds */
    }
  }
}
