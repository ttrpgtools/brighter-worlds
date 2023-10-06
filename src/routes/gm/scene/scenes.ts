import { getContextStore } from "$lib/data/settings";
import { id } from "$lib/rolling/id";
import type { Entity } from "$lib/types";
import { update } from "$lib/util/array";

const SCENES_KEY = 'bw-gm-scenes';
export const getScenes = getContextStore<Entity[]>(SCENES_KEY, []);

export function addScene(scenes: ReturnType<typeof getScenes>, item: Entity) {
  const newId = id();
  item.id = newId;
  scenes.update(list => [...list, item]);
}

export function updateScene(scenes: ReturnType<typeof getScenes>, item: Entity) {
  scenes.update(list => update(list, item));
}

export function removeScene(scenes: ReturnType<typeof getScenes>, item: Entity | string) {
  const id = typeof(item) === 'string' ? item : item.id;
  scenes.update(list => list.filter(x => x.id !== id));
}

export function clearScene(scenes: ReturnType<typeof getScenes>) {
  scenes.set([]);
}