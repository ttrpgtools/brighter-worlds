import type { DieValue, Entity, Item, Magic, RemoteMessage } from "$lib/types";
import { createBroadcastStore } from "./broadcast-store";
import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";
import { formatItem, formatMagic, formatNpc, formatRoll, formatScene } from "$lib/util/share";
import { id } from "$lib/rolling/id";

const ROLL_CHANNEL = 'bwo-roll-channel';

let broadcast: Writable<RemoteMessage>;
if (browser) {
  broadcast = createBroadcastStore<RemoteMessage>(ROLL_CHANNEL);
} else {
  broadcast = writable<RemoteMessage>();
}

export { broadcast };

export function broadcastRoll(name: string, result: number, label: string, dice: DieValue[] = [], character?: string) {
  const roll = formatRoll(name, result, label, dice, character);
  broadcast.set({id: id(), name: character ?? '', type: 'embed', embed: roll});
}

export async function broadcastScene(item: Entity) {
  const scene = formatScene(item);
  broadcast.set({id: id(), name: '', type: 'embed', embed: scene});
}

export async function broadcastMagic(item: Magic, name = '') {
  const magic = formatMagic(item, name);
  broadcast.set({id: id(), name, type: 'embed', embed: magic});
}

export async function broadcastNpc(item: Entity) {
  const npc = formatNpc(item);
  broadcast.set({id: id(), name: '', type: 'embed', embed: npc});
}

export async function broadcastItem(item: Item, name = '') {
  const relic = formatItem(item, name);
  broadcast.set({id: id(), name, type: 'embed', embed: relic});
}
