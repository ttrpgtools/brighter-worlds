import callings from '$data/callings.json';
import type { Calling } from '../types';
import { writable } from 'svelte/store';
import { id } from '$lib/rolling/id';

const callingList = callings.map(c => ({
  ...c,
  abilities: c.abilities.map(a => ({...a, id: id()})),
  equipment: c.equipment.map(e => ({...e, id: id()})),
})) as Calling[];

class CallingManager {
  public list = writable(callingList);

  loadList() {
    // Why are you so empty?
  }

}

export const callingManager = new CallingManager();
