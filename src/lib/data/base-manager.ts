import type { Identifiable } from "$lib/types";

export class JsonDataManager<T extends Identifiable> {
  protected table: Map<string, T>;
  constructor(data: T[]) {
    this.table = new Map<string, T>(data.map(x => ([x.id, x])));
  }

  getAll(): T[] {
    return Array.from(this.table.values());
  }

  getById(id: string): T | undefined {
    return this.table.get(id);
  }
}