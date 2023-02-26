import { add } from "./hold"

export function onClickOutside(fn: (event: Event) => void, light = false): (node: HTMLElement) => (() => void) {
  return node => {
    function handler(event: Event) {
      if ((event as PointerEvent).pointerType === '') return; // ignore space as click
      if (!node.contains(event.target as Node) && node.clientWidth) {
        if (!light) {
          event.preventDefault();
          event.stopPropagation();
        }
        fn(event);
      }
    }

    return add(document.documentElement, 'click', handler, true)
  }
}