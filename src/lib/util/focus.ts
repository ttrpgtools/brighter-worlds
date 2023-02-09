const TABBABLE = 'input,textarea,select,button';
const SELECTABLE = new Set(['INPUT', 'TEXTAREA']);
export function focusFirst(node: HTMLElement) {
	const input = node.querySelector(TABBABLE);
  if (input != null) {
    (input as HTMLElement).focus();
    if (SELECTABLE.has(input.tagName)) {
      (input as HTMLInputElement).select();
    }
  }
}
