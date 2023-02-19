import {micromark} from 'micromark';

export function renderSafe(markdown: string) {
  return micromark(markdown);
}
