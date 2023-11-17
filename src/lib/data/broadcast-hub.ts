import { writable, type Updater, type Readable } from "svelte/store";

type RollCallback = (ev: (id: string, name: string) => void) => void;
interface RollCallRequest {
  type: 'request'
}
interface RollCallHere {
  type: 'here';
  id: string;
  name: string;
}
interface RollCallBye {
  type: 'bye';
  id: string;
  name: string;
}
type RollCallMsg = RollCallRequest | RollCallHere | RollCallBye;


const ROLL_CALL_ID = 'bwo-roll-call';
let rollcallChannel: BroadcastChannel | undefined;
const rollcallbacks = new Set<RollCallback>();

function handleRequests(ev: MessageEvent<RollCallMsg>) {
  if (ev?.data?.type === 'request') {
    rollcallbacks.forEach(rcb => rcb((id, name) => rollcallChannel?.postMessage({
      type: 'here',
      id,
      name,
    })));
  }
}

function handleResponses(updater: (this: void, updater: Updater<Map<string, {name: string; count: number;}>>) => void) {
  return function(ev: MessageEvent<RollCallMsg>) {
    if (ev?.data?.type === 'here') {
      const {id, name} = ev.data;
      if (!id || !name) return;
      updater(list => {
        if (!list.has(id)) {
          list.set(id, {name, count: 1});
        } else {
          const oldcount = list.get(id)?.count;
          list.set(id, {name, count: (oldcount ?? 0) + 1})
        }
        return list;
      });
    } else if (ev?.data?.type === 'bye') {
      const {id, name} = ev.data;
      updater(list => {
        if (list.has(id)) {
          const oldcount = list.get(id)?.count;
          if (!oldcount || (oldcount <= 1)) {
            list.delete(id);
          } else {
            list.set(id, {name, count: oldcount - 1})
          }
        }
        return list;
      })
    }
  }
}

function setupChannel(updater?: (this: void, updater: Updater<Map<string, {name: string; count: number;}>>) => void) {
  if (!rollcallChannel) {
    rollcallChannel = new BroadcastChannel(ROLL_CALL_ID);
    rollcallChannel.onmessage = updater ? handleResponses(updater) : handleRequests;
  }
}

export function requestRollCall() {
  // At the moment doesn't handle being call more than once.
  const { update, subscribe } = writable<Map<string, {name: string; count: number;}>>(new Map());
  setupChannel(update);
  rollcallChannel?.postMessage({ type: 'request' });
  return { subscribe } as Readable<Map<string, {name: string; count: number;}>>;
}

export function rerequest() {
  rollcallChannel?.postMessage({ type: 'request' });
}

export function registerForRollCall(fn: RollCallback) {
  setupChannel();
  if (!rollcallbacks.has(fn)) rollcallbacks.add(fn);
  fn((id, name) => rollcallChannel?.postMessage({
    type: 'here',
    id,
    name,
  }));
  return () => {
    fn((id, name) => rollcallChannel?.postMessage({
      type: 'bye',
      id,
      name,
    }));
    rollcallbacks.delete(fn);
  }
}
