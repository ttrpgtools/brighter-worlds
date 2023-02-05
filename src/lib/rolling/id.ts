import { browserCrypto } from "./browser-crypto";
import { string } from "./string";

export function id(len = 9) {
  return string()(browserCrypto, len);
}