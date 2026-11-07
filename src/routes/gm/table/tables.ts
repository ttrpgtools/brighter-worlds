import { getPersistedCollectionContext } from '$lib/data/persisted-collection.svelte';
import type { CustomRolltableDef } from '$lib/types';

const TABLES_KEY = 'bw-gm-tables';
export const getTables = getPersistedCollectionContext<CustomRolltableDef>(TABLES_KEY);

export function addTable(tables: ReturnType<typeof getTables>, item: CustomRolltableDef) {
  tables.appendItem(item);
}

export function updateTable(tables: ReturnType<typeof getTables>, item: CustomRolltableDef) {
  tables.updateItem(item);
}

export function removeTable(
  tables: ReturnType<typeof getTables>,
  item: CustomRolltableDef | string,
) {
  tables.removeItem(item);
}

export function clearTables(tables: ReturnType<typeof getTables>) {
  tables.clear();
}
