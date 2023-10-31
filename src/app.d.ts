/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DndEvent, Item } from 'svelte-dnd-action';
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
	interface HTMLElementEventMap {
		'tap': CustomEvent<PointerEvent>;
		'hold': CustomEvent<PointerEvent>;
	}
	
	namespace svelteHTML {
		interface HTMLAttributes<T> {
			'on:consider'?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void;
			'on:finalize'?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void;
		}
	}
}

export {};
