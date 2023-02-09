
type WantsKbdEv = (ev: KeyboardEvent) => void;
type Action = () => void;

export const onEnter = (fn: WantsKbdEv | Action) => (ev: KeyboardEvent) => {
  if (ev.key === 'Enter') {
    fn(ev);
  }
}
