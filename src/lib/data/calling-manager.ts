import callings from '$data/callings.json';
import type { Calling } from '../types';
import { writable } from 'svelte/store';

const callingList = callings as Calling[];

class CallingManager {
  public list = writable(callingList);

  loadList() {

  }

}

export const callingManager = new CallingManager();
