import { die } from './die';
import { browserCrypto } from './browser-crypto';

export function roll(sides: number) {
  return die(sides)(browserCrypto);
}