<script lang="ts">
  import DiceDialog from '$lib/DiceDialog.svelte';
  import Icon from '$lib/ui/icon.svelte';
  import Button from '$lib/ui/button.svelte';
  import { getEncountersSettings } from '$lib/data/encounter-manager';
  import { broadcast } from '$lib/data/channel-child';
  import { Formula, roll } from '$lib/rolling/roll';
  import DamageDialog from '$lib/sheet/DamageDialog.svelte';
  import Roller from '$lib/sheet/Roller.svelte';
  import SheetSettings from '$lib/sheet/SheetSettings.svelte';
  import type {
    DamageDetails,
    DieMod,
    DieValue,
    DiscordEmbed,
    Entity,
    Item,
    NpcInstance,
    RemoteEmbedMessage,
  } from '$lib/types';
  import { armor } from '$lib/util/character';
  import {
    sendToDiscord,
    sendSceneToDiscord,
    sendItemToDiscord,
    sendNpcToDiscord,
  } from '$lib/util/discord';
  import { addLocalRoll, addRemoteRoll, getRollLog } from './playmat';
  import { formatCta, formatItem, formatNpc, formatRoll, formatScene } from '$lib/util/share';
  import { id } from '$lib/rolling/id';
  import { rollRequests, rollResponses } from './gmtools';
  import { onMount } from 'svelte';

  let dice: DiceDialog | undefined = $state();
  let damageDialog: DamageDialog | undefined = $state();
  let settingsDialog: SheetSettings | undefined = $state();

  const encountersSettings = getEncountersSettings();
  const log = getRollLog();

  onMount(() => {
    const unsub = rollRequests.subscribe((roll) => {
      const cta = formatCta(
        [
          {
            label: `Roll ${roll.formula}`,
            id: id(),
            type: 'roll',
            formula: roll.formula,
            meta: roll.name,
          },
        ],
        'Can someone...',
      );
      const rem = { id: id(), name: '', type: 'embed' as const, embed: cta };
      addRemoteRoll(log, rem);
      if ($encountersSettings?.rollToBridge !== false) {
        publish(rem);
      }
    });
    // The store retains a value for persistence callers; a newly opened GM page must not
    // process that old value as a fresh roll response.
    let initial = true;
    const stopBroadcast = broadcast.subscribe((message) => {
      if (initial) {
        initial = false;
        return;
      }
      if (message?.type !== 'embed' || sent.has(message.id)) return;
      addRemoteRoll(log, message);
      handleCtaReply(message.embed);
    });
    return () => {
      unsub();
      stopBroadcast();
    };
  });

  function showRoll(sides: DieValue[], label: string = '', name = 'NPC') {
    const best = sides.reduce((p, c) => Math.max(roll(c), p), 0);

    label = label || sides.map((s) => `d${s}`).join(',');
    if ($encountersSettings?.rollToBridge !== false) {
      const roll = formatRoll(name, best, label, sides);
      roll.title = name;
      publish({ id: id(), name: '', type: 'embed', embed: roll });
    }
    if ($encountersSettings?.rollToDiscord) {
      sendToDiscord(name, best, label, $encountersSettings.discordWebhook, sides);
    }

    dice?.show(`${best}`, sides, label);
    console.log(`${label} =`, best);

    addLocalRoll(log, {
      dice: sides,
      result: best,
      label: `${name}: ${label}`,
    });
  }

  export function formulaRoll(formula: string, label?: string, name: string = 'GM') {
    const f = new Formula(formula);
    const value = f.roll();
    const roll = formatRoll(name, value, label ?? formula, f.dice);
    roll.title = name;
    if ($encountersSettings?.rollToBridge !== false) {
      publish({ id: id(), name, embed: roll, type: 'embed' });
    }
    if ($encountersSettings?.rollToDiscord) {
      sendToDiscord(name, value, label ?? formula, $encountersSettings.discordWebhook, f.dice);
    }
    dice?.show(`${value}`, f.dice, `${label ?? formula}`);
    addLocalRoll(log, {
      dice: f.dice,
      result: value,
      label: `${name}: ${label ?? formula}`,
    });
    return value;
  }

  export async function takeDamage(npc: NpcInstance, mod?: DieMod) {
    const chinfo: DamageDetails = {
      mod,
      armor: armor(npc.attacks) + (npc.armor || 0),
      statuses: new Set(npc.status ? [npc.status] : []),
      grit: npc.grit.current,
      dice: { str: npc.str.current, dex: npc.dex.current, wil: npc.wil.current },
    };

    const results = await damageDialog?.getDamage(chinfo);

    if (results == null) return;

    if (results.statuses != null) {
      npc.status = results.statuses.size > 0 ? Array.from(results.statuses.values())[0] : '';
    }
    if (results.grit != null) {
      npc.grit.current = results.grit;
    }
    if (results.die != null) {
      npc[results.type].current = results.die;
    }
    if ($encountersSettings?.rollToDiscord && results.save) {
      sendToDiscord(
        npc.name,
        results.save,
        `${results.type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`,
        $encountersSettings.discordWebhook,
        results.dice,
        npc.name,
      );
    }
    if ($encountersSettings?.rollToBridge !== false && results.save) {
      const roll = formatRoll(
        npc.name,
        results.save,
        `${results.type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`,
        results.dice,
        npc.name,
      );
      roll.title = npc.name;
      publish({ id: id(), name: '', type: 'embed', embed: roll });
    }
    dice?.show('Damage', results.dice, results.msg);

    if (results.save) {
      addLocalRoll(log, {
        dice: results.dice,
        result: results.save,
        label: `${npc.name}: ${results.type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`,
      });
    }
  }

  export function basicRoll(data: { dice: DieValue[]; name: string }, npcname = 'NPC') {
    const { dice, name } = data;
    showRoll(dice, name, npcname);
  }

  export function shareScene(scene: Entity) {
    if ($encountersSettings?.rollToDiscord) {
      sendSceneToDiscord(scene, $encountersSettings.discordWebhook);
    }
    if ($encountersSettings?.rollToBridge !== false) {
      publish({ id: id(), name: '', type: 'embed', embed: formatScene(scene) });
    }
  }

  export function shareNpc(npc: Entity) {
    if ($encountersSettings?.rollToDiscord) {
      sendNpcToDiscord(npc, $encountersSettings.discordWebhook);
    }
    if ($encountersSettings?.rollToBridge !== false) {
      publish({ id: id(), name: '', type: 'embed', embed: formatNpc(npc) });
    }
  }

  export function shareItem(item: Item) {
    if ($encountersSettings?.rollToDiscord) {
      sendItemToDiscord(item, $encountersSettings.discordWebhook);
    }
    if ($encountersSettings?.rollToBridge !== false) {
      publish({ id: id(), name: '', type: 'embed', embed: formatItem(item) });
    }
  }

  function handleCtaReply(embed: DiscordEmbed) {
    if (embed.meta && embed.fields.length > 0) {
      const value = parseInt(embed.fields[0].name, 10);
      if (Number.isFinite(value)) rollResponses.emit({ id: embed.meta, result: value });
    }
  }

  // This is transport bookkeeping, not reactive UI state. Do not reflect a received event
  // back to the channel or log our own local rolls twice.
  const sent = new Set<string>();
  function publish(message: RemoteEmbedMessage) {
    sent.add(message.id);
    if (sent.size > 1000) sent.delete(sent.values().next().value!);
    broadcast.set(message);
  }
</script>

<DiceDialog bind:this={dice} />
<DamageDialog bind:this={damageDialog} />

<SheetSettings bind:this={settingsDialog} bind:settings={$encountersSettings} title="GM Settings" />
<Roller onroll={(die) => showRoll([die], 'Custom Roll', 'GM')} />

<Button size="icon" icon="cog" onclick={() => settingsDialog?.open()} />
{#if $encountersSettings?.rollToDiscord}
  <Icon icon="discord" />
{/if}
