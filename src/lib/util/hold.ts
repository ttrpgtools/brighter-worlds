export function add<T extends keyof HTMLElementEventMap>(node: HTMLElement, evt: T, handler: (ev: HTMLElementEventMap[T]) => void, capture?: boolean): () => void;
export function add(node: HTMLElement, evt: string, handler: EventListenerOrEventListenerObject, capture?: boolean): () => void;
export function add(node: HTMLElement, evt: string, handler: EventListenerOrEventListenerObject, capture?: boolean): () => void {
  node.addEventListener(evt, handler, capture);
  return () => node.removeEventListener(evt, handler, capture);
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
  const DELAY = 600;

  function done(isClose: boolean, time: number, ev: PointerEvent) {
    console.log('DONE');
    timer = undefined;
    runAll(unsubs);
    if (isClose) {
      console.log('IS CLOSE');
      setTimeout(() => node.dispatchEvent(new CustomEvent(time > DELAY ? 'hold' : 'tap', {detail: ev})), 250);
    }
    //document.documentElement.addEventListener('click', nope, {capture: true, once: true});
  }
  
  function downHandler(ev: PointerEvent) {
    //ev.preventDefault();
    const {clientX, clientY} = ev;
    const startTime = Date.now();
    let currX = clientX;
    let currY = clientY;
    if (ev.target != null && 'disabled' in ev.target && ev.target.disabled) return;
    console.log('DOWN');
    if (timer) clearTimeout(timer);
    unsubs.push(add(node, 'pointerup', ev => {
      console.log('UP');
      if (timer) {
        clearTimeout(timer);
        console.log('UP CLEARED');
      }
      done(close(clientX, clientY, ev.clientX, ev.clientY), Date.now() - startTime, ev);
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
    //timer = setTimeout(() => done(close(clientX, clientY, currX, currY)), DELAY);
  }

  const removeDownHandler = add(node, 'pointerdown', downHandler);
  return {
    destroy() {
      removeDownHandler();
    }
  }
}