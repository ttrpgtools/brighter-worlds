import type { DieValue, DiscordEmbed, Entity, Item } from "$lib/types";
import { formatItem, formatNpc, formatRoll, formatScene } from "./share";


/* interface DiscordWebhookMessage {
  username?: string;
  'avatar_url'?: string;
  'allowed_mentions'?: { parse: string[] };
  embeds: DiscordEmbed[];
} */

async function discordRequest(body: string, hook: string) {
  if (!hook.startsWith('https://')) return false;
  const res = await fetch(hook, {
    method: 'POST',
    mode: 'cors',
    body,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  return res.status === 204;
}

async function sendEmbed(embed: DiscordEmbed, hook: string, user?: string) {
  const body = JSON.stringify({
    username: user ?? 'Brighter Worlds',
    avatar_url: 'https://brighterworlds.app/apple-touch-icon.png',
    allowed_mentions: {
      parse: []
    },
    embeds: [
      embed
    ]
  });
  return await discordRequest(body, hook);
}

export async function sendToDiscord(name: string, result: number, label: string, hook: string, dice: DieValue[] = [], character?: string) {
  const roll = formatRoll(name, result, label, dice, character);
  return await sendEmbed(roll, hook, character);
}

export async function sendSceneToDiscord(item: Entity, hook: string) {
  const scene = formatScene(item);
  return await sendEmbed(scene, hook);
}

export async function sendNpcToDiscord(item: Entity, hook: string) {
  const npc = formatNpc(item);
  return await sendEmbed(npc, hook);
}

export async function sendItemToDiscord(item: Item, hook: string) {
  const relic = formatItem(item);
  return await sendEmbed(relic, hook);
}