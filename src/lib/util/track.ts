import { browser } from '$app/environment';

export function track(evt: string) {
  if (browser && window) {
    window.fathom?.trackEvent(evt);
  }
}
