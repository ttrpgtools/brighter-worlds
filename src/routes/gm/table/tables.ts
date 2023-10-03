import { getContextStore } from "$lib/data/settings";
import { id } from "$lib/rolling/id";
import type { CustomRolltableDef } from "$lib/types";
import { update } from "$lib/util/array";

const TABLES_KEY = 'bw-gm-tables';
export const getTables = getContextStore<CustomRolltableDef[]>(TABLES_KEY, []);

export function addTable(tables: ReturnType<typeof getTables>, item: CustomRolltableDef) {
  const newId = id();
  item.id = newId;
  tables.update(list => [...list, item]);
}

export function updateTable(tables: ReturnType<typeof getTables>, item: CustomRolltableDef) {
  tables.update(list => update(list, item));
}

export function removeTable(tables: ReturnType<typeof getTables>, item: CustomRolltableDef | string) {
  const id = typeof(item) === 'string' ? item : item.id;
  tables.update(list => list.filter(x => x.id !== id));
}

export function clearTables(tables: ReturnType<typeof getTables>) {
  tables.set([]);
}
