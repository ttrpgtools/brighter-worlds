import { COLOR_ITEM, COLOR_ROLL, COLOR_SCENE } from "$lib/const";
import type { DieValue, Entity, Item } from "$lib/types";
import { wrap } from "./array";

interface DiscordEmbed {
  title?: string;
  author?: { name: string, icon_url?: string; };
  description?: string;
  color?: number;
  footer?: { text: string; icon_url?: string; }
  image?: { url: string };
  fields: { name: string, value: string, inline?: boolean }[];
}
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
  const diceStr = dice.length ? dice.map(s => `d${s}`).join(' | ') : ``;
  const discordItem: DiscordEmbed = {
    fields: [
      { name: `${result}`, value: diceStr, inline: true }
    ],
    color: COLOR_ROLL,
  };
  if (!character || name !== character) {
    discordItem.author = { name };
  }
  if (label) discordItem.fields.push({ name: 'Description', value: label, inline: true });
  return await sendEmbed(discordItem, hook, character);
}

export async function sendSceneToDiscord(item: Entity, hook: string) {
  const discordItem: DiscordEmbed = {
    title: '',//item.name,
    fields: [],
    footer: { text: 'Scene' },
    color: COLOR_SCENE,
  };
  if (item.desc) discordItem.description = item.desc;
  if (item.image && typeof item.image === 'string') discordItem.image = { url: item.image };
  return await sendEmbed(discordItem, hook);
}

export async function sendItemToDiscord(item: Item, hook: string) {
  const discordItem: DiscordEmbed = {
    title: item.name,
    fields: [],
    color: COLOR_ITEM,
  };
  if (item.desc) discordItem.description = item.desc;
  if (item.image && typeof item.image === 'string') discordItem.image = { url: item.image };
  if (item.quantity) discordItem.fields.push({ name: 'Quantity', value: `${item.quantity}`});
  if (item.bulky) discordItem.fields.push({ name: 'Bulky', value: 'true', inline: true });
  if (item.armor) discordItem.fields.push({ name: 'Armor', value: `${item.armor}`, inline: true });
  if (item.damage) discordItem.fields.push({ name: 'Damage', value: wrap(item.damage).map(d => `d${d}`).join(' | '), inline: true });
  return await sendEmbed(discordItem, hook);
}