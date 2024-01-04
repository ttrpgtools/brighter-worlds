export function distinctUntilChanged<T>(handler: (x: T) => void, select?: (x: T) => unknown) {
  let init = false;
  let last: unknown;
  const sel = select ? select : (x: T) => x;
  return function internalHandler(x: T) {
    const curr = sel(x);
    if (!init || last !== curr) {
      init = true;
      last = curr;
      handler(x);
    }
  }
}