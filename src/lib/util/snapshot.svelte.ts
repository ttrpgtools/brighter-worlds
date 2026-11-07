export function snapshotState<T>(value: T): T {
  return $state.snapshot(value) as T;
}
