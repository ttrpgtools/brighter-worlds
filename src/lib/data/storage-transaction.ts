import { createStore, type UseStore } from 'idb-keyval';

// Same database/object store used by idb-keyval's default connection.
export const sheetDatabase = createStore('keyval-store', 'keyval');
export const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Storage request failed.'));
  });

/** Only await IDB requests inside run; external I/O can close the transaction. */
export function transaction<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T> | T,
  database: UseStore = sheetDatabase,
): Promise<T> {
  return database(mode, async (store) => {
    const tx = store.transaction;
    const completed = new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onabort = tx.onerror = () => reject(tx.error ?? new Error('Storage transaction aborted.'));
    });
    // Attach immediately so an abort during run cannot create an unhandled rejection.
    void completed.catch(() => {});
    try {
      const result = await run(store);
      await completed;
      return result;
    } catch (error) {
      try {
        tx.abort();
      } catch {
        /* Transaction may already have aborted. */
      }
      await completed.catch(() => {});
      throw error;
    }
  });
}
