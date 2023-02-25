export function add<T extends keyof HTMLElementEventMap>(node: HTMLElement, evt: T, handler: (ev: HTMLElementEventMap[T]) => void): () => void;
export function add(node: HTMLElement, evt: string, handler: EventListenerOrEventListenerObject): () => void;
export function add(node: HTMLElement, evt: string, handler: EventListenerOrEventListenerObject): () => void {
  node.addEventListener(evt, handler);
  return () => node.removeEventListener(evt, handler);
}

function runAll(fns: (() => void)[]) {
  while (fns.length) fns.shift()?.();
}

function nope(ev: Event) {
  console.log('NOPE');
  ev.stopPropagation();
  ev.stopImmediatePropagation();
  ev.preventDefault();
}

const DELTA = 4;
function close(x: number, y: number, xp: number, yp: number) {
  return Math.abs(x - xp) < DELTA && Math.abs(y - yp) < DELTA;
}

export function hold(node: HTMLElement) {
  let timer: NodeJS.Timeout | undefined;
  const unsubs: (() => void)[] = [];

  function done(isClose: boolean) {
    console.log('DONE');
    timer = undefined;
    runAll(unsubs);
    if (isClose) {
      console.log('IS CLOSE');
      node.dispatchEvent(new CustomEvent('hold'));
    }
    document.documentElement.addEventListener('click', nope, {capture: true, once: true});
  }
  
  const DELAY = 600;
  function downHandler(ev: PointerEvent) {
    const {clientX, clientY} = ev;
    let currX = clientX;
    let currY = clientY;
    if (ev.target != null && 'disabled' in ev.target && ev.target.disabled) return;
    console.log('DOWN');
    if (timer) clearTimeout(timer);
    unsubs.push(add(node, 'pointerup', () => {
      console.log('UP');
      if (timer) {
        clearTimeout(timer);
        console.log('UP CLEARED');
      }
      runAll(unsubs);
    }));
    unsubs.push(add(node, 'lostpointercapture', () => {
      console.log('LOST');
      if (timer) {
        clearTimeout(timer);
        console.log('LOST CLEARED');
      }
      runAll(unsubs);
    }));
    unsubs.push(add(node, 'pointermove', ev => {
      currX = ev.clientX;
      currY = ev.clientY;
    }));
    timer = setTimeout(() => done(close(clientX, clientY, currX, currY)), DELAY);
  }

  const removeDownHandler = add(node, 'pointerdown', downHandler);
  return {
    destroy() {
      removeDownHandler();
    }
  }
}