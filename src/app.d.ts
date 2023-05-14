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

	namespace svelte.JSX {
		interface HTMLAttributes<T> {
			onconsider?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void;
			onfinalize?: (event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T }) => void;
		}
	}
}

export {};
