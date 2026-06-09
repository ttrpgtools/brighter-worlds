export function createRuneProxy<T extends object>(value: T): T {
  const proxy = $state(value);
  return proxy;
}
