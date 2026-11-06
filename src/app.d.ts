/* eslint-disable @typescript-eslint/no-unused-vars */
import type { DndEvent, Item } from 'svelte-dnd-action';
import type { AnkhService, AnkhUser, AppAccessDecision } from '$lib/server/ankh';
import type { AegisService } from '$lib/server/aegis';
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    interface Error {
      code?: string;
      reason?: string;
    }
    interface Locals {
      user?: AnkhUser;
      access?: AppAccessDecision;
      permissions: Set<string>;
      authState?: 'unconfigured' | 'signed-out' | 'authenticated' | 'unavailable';
      ankhCookies?: Map<string, string>;
    }
    // interface PageData {}
    interface Platform {
      env: { AUTH?: AnkhService; STORE?: AegisService };
    }
  }
  interface HTMLElementEventMap {
    tap: CustomEvent<PointerEvent>;
    hold: CustomEvent<PointerEvent>;
  }

  namespace svelteHTML {
    interface HTMLAttributes<T> {
      'on:consider'?: (
        event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T },
      ) => void;
      'on:finalize'?: (
        event: CustomEvent<DndEvent<ItemType>> & { target: EventTarget & T },
      ) => void;
    }
  }
  interface Window {
    fathom?: {
      trackEvent: (evt: string, opt?: { _value: number }) => void;
    };
  }
}

export {};
