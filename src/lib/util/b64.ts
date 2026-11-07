export function decode(base64: string) {
  const binString = window.atob(base64);
  const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0) ?? 0);
  return new TextDecoder().decode(bytes);
}

export function encode(text: string) {
  const bytes = new TextEncoder().encode(text);
  const binString = String.fromCodePoint(...bytes);
  return window.btoa(binString);
}
