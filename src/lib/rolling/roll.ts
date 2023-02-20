import { die } from './die';
import { browserCrypto } from './browser-crypto';

export function roll(sides: number) {
  return die(sides)(browserCrypto);
}

export function rolls(sides: number, count = 5) {
  const roller = die(sides);
  return Array.from(Array(count), () => roller(browserCrypto))
}
