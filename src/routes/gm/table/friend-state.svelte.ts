import { browser } from '$app/environment';
import { get as kvget, set as kvset } from 'idb-keyval';
import { getContext, hasContext, setContext } from 'svelte';
import { id } from '$lib/rolling/id';
import { roll } from '$lib/rolling/roll';
import { snapshotState } from '$lib/util/snapshot.svelte';
import type { DieValue } from '$lib/types';
import { stepUp } from '$lib/dice';

const FRIENDS_KEY = 'bw-gm-friends';
const FRIENDS_CONTEXT = 'bw-gm-friends-context';

export interface FriendSlot {
  id: string;
  index: number;
  name: string;
  notes?: string;
  sourceNpcId?: string;
}

export interface FriendRoster {
  id: string;
  die: DieValue;
  slots: FriendSlot[];
}

export interface FriendRollResult {
  roll: number;
  die: DieValue;
  friend?: FriendSlot;
  empty: boolean;
}

function initialRoster(): FriendRoster {
  return {
    id: 'default',
    die: 4,
    slots: [],
  };
}

function normalizeDie(die: number): DieValue {
  if (die === 4 || die === 6 || die === 8 || die === 10 || die === 12) return die;
  return 4;
}

function normalizeRoster(roster: FriendRoster | null | undefined): FriendRoster {
  if (!roster) return initialRoster();
  return {
    id: roster.id || 'default',
    die: normalizeDie(roster.die),
    slots: (roster.slots ?? [])
      .filter((slot) => slot.name)
      .map((slot) => ({
        id: slot.id || id(),
        index: slot.index,
        name: slot.name,
        notes: slot.notes,
        sourceNpcId: slot.sourceNpcId,
      })),
  };
}

export class FriendsState {
  roster: FriendRoster = $state(initialRoster());
  ready = $state(false);
  lastRoll: FriendRollResult | undefined = $state();

  #loaded = false;

  constructor() {
    if (browser) {
      kvget<FriendRoster>(FRIENDS_KEY).then((value) => {
        this.roster = snapshotState(normalizeRoster(value));
        this.#loaded = true;
        this.ready = true;
      });
    } else {
      this.#loaded = true;
      this.ready = true;
    }

    $effect(() => {
      const snapshot = snapshotState(this.roster);
      if (browser && this.#loaded) {
        kvset(FRIENDS_KEY, snapshot);
      }
    });
  }

  getSlot(index: number) {
    return this.roster.slots.find((slot) => slot.index === index);
  }

  upsertSlot(slot: Partial<FriendSlot> & { index: number; name: string }) {
    const nextSlot: FriendSlot = {
      id: slot.id || this.getSlot(slot.index)?.id || id(),
      index: slot.index,
      name: slot.name.trim(),
      notes: slot.notes?.trim(),
      sourceNpcId: slot.sourceNpcId,
    };

    if (!nextSlot.name) {
      this.removeSlot(slot.index);
      return;
    }

    const slots = this.roster.slots.filter((current) => current.index !== slot.index);
    this.roster = {
      ...this.roster,
      slots: [...slots, nextSlot].sort((a, b) => a.index - b.index),
    };
    this.stepUpIfFull();
  }

  removeSlot(index: number) {
    this.roster = {
      ...this.roster,
      slots: this.roster.slots.filter((slot) => slot.index !== index),
    };
  }

  rollFriend() {
    const result = roll(this.roster.die);
    const friend = this.getSlot(result);
    this.lastRoll = {
      roll: result,
      die: this.roster.die,
      friend,
      empty: !friend,
    };
    return this.lastRoll;
  }

  stepUpIfFull() {
    if (this.roster.die === 12) return;
    const filled = Array.from({ length: this.roster.die }, (_, i) => i + 1).every((index) =>
      this.getSlot(index),
    );
    if (filled) {
      this.roster = {
        ...this.roster,
        die: stepUp(this.roster.die),
      };
    }
  }
}

export function getFriends() {
  let friends: FriendsState;
  if (!hasContext(FRIENDS_CONTEXT)) {
    friends = new FriendsState();
    setContext(FRIENDS_CONTEXT, friends);
  } else {
    friends = getContext(FRIENDS_CONTEXT);
  }
  return friends;
}
