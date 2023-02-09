
export function taphold(node: HTMLElement, interval = 500) {
  let intervalIds: NodeJS.Timeout[] = [] // save interval id

  const handler = () => {
    node.dispatchEvent(new CustomEvent("taphold"));
  };

  const stopHandler = () => {
    intervalIds.map(id => clearTimeout(id));
    intervalIds = [];
  }

  const tapAndHold = (event: MouseEvent | TouchEvent) => {
    // right click
    if ('button' in event && event.button === 2) {
      return;
    }
    handler() // tap
    intervalIds.push(setTimeout(() => handler(), interval)) // hold


    // stop handler when document mouseup.
    document.addEventListener("mouseup", stopHandler, { once: true });
    document.addEventListener("touchend", stopHandler, { once: true });
  }


  if ('ontouchstart' in document.documentElement) {
    node.addEventListener("touchstart", tapAndHold)
  } else {
    node.addEventListener("mousedown", tapAndHold)
  }

  return {
    update(newInterval: number) {
      interval = newInterval;
    },
    destroy() {
      node.removeEventListener("mousedown", tapAndHold);
      node.removeEventListener("touchstart", tapAndHold);
    }
  };
}
