
// type KeyOfType<T, V> = keyof {
//   [P in keyof T as T[P] extends V? P: never]: any
// }
type KeyOfType<T, U> = {[P in keyof T]: T[P] extends U ? P: never}[keyof T]

export const ASCENDING = 1;
export const DESCENDING = -1;
export function sortByNumber<T>(prop: KeyOfType<T, number>, dir = ASCENDING) {
  return function cmp(a: T, b: T) {
    return ((a[prop] as number) - (b[prop] as number)) * dir;
  }
}
