import type { RemoteMessage } from "$lib/types";
import { createBroadcastStore } from "./broadcast-store";
import { browser } from "$app/environment";
import { writable, type Writable } from "svelte/store";

const ROLL_CHANNEL = 'bwo-roll-channel';

let broadcast: Writable<RemoteMessage>;
if (browser) {
  broadcast = createBroadcastStore<RemoteMessage>(ROLL_CHANNEL);
} else {
  broadcast = writable<RemoteMessage>();
}

export { broadcast };
