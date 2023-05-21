import type { DieValue } from "$lib/types";

export async function sendToDiscord(name: string, result: number, label: string, hook: string, dice: DieValue[] = []) {
  const diceStr = dice.length ? ` (${dice.map(s => `d${s}`).join(' | ')})` : ``;
  const content = `**${result}**${diceStr}${label ? ` — ` : ``}${label}`;
  const username = `BWO: ${name}`;
  if (!hook.startsWith('https://')) return false;
  const res = await fetch(hook, {
    method: 'POST',
    mode: 'cors',
    body: JSON.stringify({username, content}),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return res.status === 204;
}