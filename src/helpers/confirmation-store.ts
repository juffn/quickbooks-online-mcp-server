/**
 * In-memory store for pending write confirmations.
 * Entries expire after 30 minutes to prevent stale approvals.
 */

const TTL_MS = 30 * 60 * 1000; // 30 minutes

interface StoreEntry<T> {
  payload: T;
  expiresAt: number;
}

class ConfirmationStore<T> {
  private store = new Map<string, StoreEntry<T>>();

  set(id: string, payload: T): void {
    this.store.set(id, {
      payload,
      expiresAt: Date.now() + TTL_MS,
    });
  }

  get(id: string): T | null {
    const entry = this.store.get(id);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(id);
      return null;
    }
    return entry.payload;
  }

  delete(id: string): void {
    this.store.delete(id);
  }
}

export const journalEntryConfirmations = new ConfirmationStore<any>();
