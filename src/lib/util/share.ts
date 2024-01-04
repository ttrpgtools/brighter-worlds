import { COLOR_DANGER, COLOR_ITEM, COLOR_MAGIC, COLOR_NPC, COLOR_OK, COLOR_ROLL, COLOR_SCENE, COLOR_WARN, ENCOUNTER_ROLL_NO, ENCOUNTER_ROLL_YES } from "$lib/const";
import type { Cta, DieValue, DiscordEmbed, Entity, Item, Magic } from "$lib/types";
import { wrap } from "./array";
import { encode } from "./b64";

export function formatRoll(name: string, result: number, label: string, dice: DieValue[] = [], character?: string) {
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
  return discordItem;
}

export function formatScene(item: Entity) {
  const discordItem: DiscordEmbed = {
    title: '',//item.name,
    fields: [],
    footer: { text: 'Scene' },
    color: COLOR_SCENE,
  };
  if (item.desc) discordItem.description = item.desc;
  if (item.image && typeof item.image === 'string') discordItem.image = { url: item.image };
  return discordItem;
}

export function formatNpc(item: Entity) {
  const discordItem: DiscordEmbed = {
    title: item.name,
    fields: [],
    footer: { text: 'NPC' },
    color: COLOR_NPC,
  };
  if (item.desc) discordItem.description = item.desc;
  if (item.image && typeof item.image === 'string') discordItem.image = { url: item.image };
  return discordItem;
}

function createObtainItemUrl(item: Item) {
  const payload = JSON.stringify(item);
  const enc = encode(payload);
  const url = new URL('/character/obtain', window.location.href);
  url.searchParams.set('item', enc);
  return url.href;
}

export function formatItem(item: Item, name = '') {
  const discordItem: DiscordEmbed = {
    title: item.name,
    fields: [],
    color: COLOR_ITEM,
    url: createObtainItemUrl(item),
  };
  if (item.desc) discordItem.description = item.desc;
  if (item.image && typeof item.image === 'string') discordItem.image = { url: item.image };
  if (name) discordItem.author = { name };
  if (item.quantity) discordItem.fields.push({ name: 'Quantity', value: `${item.quantity}`});
  if (item.bulky) discordItem.fields.push({ name: 'Bulky', value: 'true', inline: true });
  if (item.armor) discordItem.fields.push({ name: 'Armor', value: `${item.armor}`, inline: true });
  if (item.damage) discordItem.fields.push({ name: 'Damage', value: wrap(item.damage).map(d => `d${d}`).join(' | '), inline: true });
  return discordItem;
}

export function formatMagic(item: Magic, name = '') {
  const discordItem: DiscordEmbed = {
    title: item.name,
    fields: [],
    color: COLOR_MAGIC,
    //url: createObtainItemUrl(item),
  };
  if (item.desc) discordItem.description = item.desc;
  if (item.image && typeof item.image === 'string') discordItem.image = { url: item.image };
  if (name) discordItem.author = { name };
  if (item.type) discordItem.fields.push({ name: 'Type', value: `${item.type}`});
  if (item.damage) discordItem.fields.push({ name: 'Damage', value: wrap(item.damage).map(d => `d${d}`).join(' | '), inline: true });
  return discordItem;
}

export function formatCta(cta: Cta[], title?: string) {
  const discord: DiscordEmbed = {
    fields: [],
    cta,
    color: COLOR_ROLL,
    title,
  };
  return discord;
}

export function formatEncounterRoll(type: string, reaction?: string, label?: string) {
  const discord: DiscordEmbed = {
    fields: [],
    color: type === ENCOUNTER_ROLL_NO ? COLOR_OK : (type === ENCOUNTER_ROLL_YES ? COLOR_DANGER : COLOR_WARN),
    title: type,
  };
  if (reaction) {
    discord.fields.push({ name: 'Reaction', value: reaction });
  }
  if (label) {
    discord.fields.push({ name: 'Result', value: label });
  }
  return discord;
}
