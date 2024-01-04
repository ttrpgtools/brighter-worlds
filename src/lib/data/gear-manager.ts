import equipment from '$data/equipment.json';
import type { Item, StartingGear } from '../types';
import { writable } from 'svelte/store';
import { id } from '$lib/rolling/id';

const gear = {
  starting: equipment.starting.map(e => ({id: id(), ...e, bulky: e.bulky ?? false} as Item)),
  str: {...equipment.str, items: equipment.str.items.map(e => ({id: id(), ...e, bulky: e.bulky ?? false} as Item))},
  dex: {...equipment.dex, items: equipment.dex.items.map(e => ({id: id(), ...e, bulky: false} as Item))},
  wil: {...equipment.wil, items: equipment.wil.items.map(e => ({id: id(), ...e, bulky: false} as Item))},
} as StartingGear;

class GearManager {
  public list = writable(gear);

  loadList() {
    // Why are you so empty?
  }

}

export const gearManager = new GearManager();
