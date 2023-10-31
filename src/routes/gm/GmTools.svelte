<script lang="ts">
  import DiceDialog from "$lib/DiceDialog.svelte";
  import Icon from "$lib/Icon.svelte";
  import IconButton from "$lib/IconButton.svelte";
  import { getEncountersSettings } from "$lib/data/encounter-manager";
  import { hostSession, type Session } from "$lib/data/p2p";
  import { roll } from "$lib/rolling/roll";
  import DamageDialog from "$lib/sheet/DamageDialog.svelte";
  import Roller from "$lib/sheet/Roller.svelte";
  import SheetSettings from "$lib/sheet/SheetSettings.svelte";
  import type { DamageDetails, DieValue, Entity, Item, NpcInstance, RemoteEmbedMessage } from "$lib/types";
  import { armor } from "$lib/util/character";
  import { sendToDiscord, sendSceneToDiscord, sendItemToDiscord, sendNpcToDiscord } from "$lib/util/discord";
  import type { Readable } from "svelte/store";
  import { addLocalRoll, addRemoteRoll, getRollLog } from "./playmat";
  import { formatItem, formatNpc, formatRoll, formatScene } from "$lib/util/share";
  import { id } from "$lib/rolling/id";

  let dice: DiceDialog;
  let damageDialog: DamageDialog;
  let settingsDialog: SheetSettings;

  const encountersSettings = getEncountersSettings();
  const log = getRollLog();
  let gameId: Readable<string>;
  let playerCount: Readable<number>;
  
  function showRoll(sides: DieValue[], label: string = '', name = 'NPC') {
    const best = sides.reduce((p, c) => Math.max(roll(c), p), 0);
    
    label = label || sides.map(s => `d${s}`).join(',');
    if ($encountersSettings?.rollToBridge) {
      const roll = formatRoll(name, best, label, sides);
      roll.title = name;
      session?.send({id: id(), name: '', type: 'embed', embed: roll});
    }
    if ($encountersSettings?.rollToDiscord) {
      sendToDiscord(name, best, label, $encountersSettings.discordWebhook, sides);
    }

    dice.show(`${best}`, sides, label);
    console.log(`${label} =`, best);

    addLocalRoll(log, {
      dice: sides,
      result: best,
      label: `${name}: ${label}`,
    });
  }

  export async function takeDamage(npc: NpcInstance) {
    const chinfo: DamageDetails = {
      armor: armor(npc.attacks) + (npc.armor || 0),
      statuses: new Set(npc.status ? [npc.status] : []),
      grit: npc.grit.current,
      dice: {str: npc.str.current, dex: npc.dex.current, wil: npc.wil.current}
    };

    const results = await damageDialog.getDamage(chinfo);

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
      sendToDiscord(npc.name, results.save, `${results.type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`, $encountersSettings.discordWebhook, results.dice, npc.name);
    }
    if ($encountersSettings?.rollToBridge && results.save) {
      const roll = formatRoll(npc.name, results.save, `${results.type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`, results.dice, npc.name);
      roll.title = npc.name;
      session?.send({id: id(), name: '', type: 'embed', embed: roll});
    }
    dice.show('Damage', results.dice, results.msg);

    if (results.save) {
      addLocalRoll(log, {
        dice: results.dice,
        result: results.save,
        label: `${npc.name}: ${results.type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`,
      });
    }
  }

  export function basicRoll(ev: CustomEvent<{ dice: DieValue[], name: string }>, npcname = 'NPC') {
    const { dice, name } = ev.detail;
    showRoll(dice, name, npcname);
  }

  export function shareScene(scene: Entity) {
    if ($encountersSettings?.rollToDiscord) {
      sendSceneToDiscord(scene, $encountersSettings.discordWebhook);
    }
    if ($encountersSettings?.rollToBridge) {
      session?.send({id: id(), name: '', type: 'embed', embed: formatScene(scene)});
    }
  }

  export function shareNpc(npc: Entity) {
    if ($encountersSettings?.rollToDiscord) {
      sendNpcToDiscord(npc, $encountersSettings.discordWebhook);
    }
    if ($encountersSettings?.rollToBridge) {
      session?.send({id: id(), name: '', type: 'embed', embed: formatNpc(npc)});
    }
  }

  export function shareItem(item: Item) {
    if ($encountersSettings?.rollToDiscord) {
      sendItemToDiscord(item, $encountersSettings.discordWebhook);
    }
    if ($encountersSettings?.rollToBridge) {
      session?.send({id: id(), name: '', type: 'embed', embed: formatItem(item)});
    }
  }

  function handleData(ev: Event) {
		const evt = ev as CustomEvent<{name: string; data: RemoteEmbedMessage;}>;
		console.log(evt);
    if (evt && evt.detail && evt.detail.data) {
      addRemoteRoll(log, evt.detail.data);
      session?.send(evt.detail.data);
    }
	}

  function handleJoin(ev: Event) {
    const evt = ev as CustomEvent<{name: string; connection: { send: (data: any) => void}}>;
    if (evt && evt.detail) {
      addRemoteRoll(log, {
        embed: {
          title: `${evt.detail.name || 'Player'} joined.`,
          fields: []
        }
      });
      evt.detail.connection?.send({
        id: id(),
        name: '',
        type: 'embed',
        embed: {
          fields: [],
          title: 'Game joined. Welcome to Brighter Worlds',
        }
      });
    }
  }

  function handleLeave(ev: Event) {
    const evt = ev as CustomEvent<{name: string;}>;
    if (evt && evt.detail) {
      addRemoteRoll(log, {
        embed: {
          title: `${evt.detail.name || 'Player'} left.`,
          fields: []
        }
      });
    }
  }

  let session: Session | undefined;
  function createSession() {
    session = hostSession();
		gameId = session.id;
    playerCount = session.count;
		session.addEventListener('data', handleData);
		session.addEventListener('join', handleJoin);
		session.addEventListener('leave', handleLeave);
  }
</script>
<DiceDialog bind:this={dice} />
<DamageDialog bind:this={damageDialog} />

<SheetSettings bind:this={settingsDialog} bind:settings={$encountersSettings} title="GM Settings" />
<Roller on:roll={(ev) => showRoll([ev.detail], 'Custom Roll', 'GM')} />

<IconButton icon="cog" on:click={() => settingsDialog.open()}/>
{#if $encountersSettings?.rollToDiscord}
  <Icon icon="discord" />
{/if}
{#if $encountersSettings?.rollToBridge}
<IconButton icon="broadcast" on:click={createSession}/>
<div class="font-sans text-sm">{$gameId ?? ''} {#if $gameId}({$playerCount}){/if}</div>
{/if}