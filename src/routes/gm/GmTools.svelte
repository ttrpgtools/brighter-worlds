<script lang="ts">
  import DiceDialog from "$lib/DiceDialog.svelte";
  import Icon from "$lib/Icon.svelte";
  import IconButton from "$lib/IconButton.svelte";
  import { getEncountersSettings } from "$lib/data/encounter-manager";
  import { roll } from "$lib/rolling/roll";
  import DamageDialog from "$lib/sheet/DamageDialog.svelte";
  import Roller from "$lib/sheet/Roller.svelte";
  import SheetSettings from "$lib/sheet/SheetSettings.svelte";
  import type { DamageDetails, DieValue } from "$lib/types";
  import { armor } from "$lib/util/character";
  import { sendToDiscord } from "$lib/util/discord";

  let dice: DiceDialog;
  let damageDialog: DamageDialog;
  let settingsDialog: SheetSettings;

  const encountersSettings = getEncountersSettings();

  function showRoll(sides: DieValue[], label: string = '', name = 'NPC') {
    const best = sides.reduce((p, c) => Math.max(roll(c), p), 0);
    
    label = label || sides.map(s => `d${s}`).join(',');
    // if ($encountersSettings?.rollToBridge) {
    //   broadcast.set({id: $character.id, name: $character.name, type: 'roll', dice: sides, result: best, label});
    // }
    if ($encountersSettings?.rollToDiscord) {
      sendToDiscord(name, best, label, $encountersSettings.discordWebhook, sides);
    }

    dice.show(`${best}`, sides, label);
    console.log(`${label} =`, best);
  }

  async function takeDamage(ev: CustomEvent<{ type: 'str' | 'dex' | 'wil' }>, eindex: number, nindex: number) {
    const type = ev.detail.type;
    const npc = $list[eindex].npcs[nindex];
    const chinfo: DamageDetails = {
      type,
      armor: armor(npc.attacks) + (npc.armor || 0),
      statuses: new Set(npc.status ? [npc.status] : []),
      grit: npc.grit.current,
      die: npc[type].current,
    };

    const results = await damageDialog.getDamage(chinfo);

    if (results == null) return;

    if (results.statuses != null) {
      $list[eindex].npcs[nindex].status = results.statuses.size > 0 ? Array.from(results.statuses.values())[0] : '';
    }
    if (results.grit != null) {
      $list[eindex].npcs[nindex].grit.current = results.grit;
    }
    if (results.die != null) {
      $list[eindex].npcs[nindex][type].current = results.die;
    }
    if ($encountersSettings?.rollToDiscord && results.save) {
      sendToDiscord(npc.name, results.save, `${type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`, $encountersSettings.discordWebhook, results.dice);
    }
    dice.show('Damage', results.dice, results.msg);
  }

  function basicRoll(ev: CustomEvent<{ dice: DieValue[], name: string }>, npcname = 'NPC') {
    const { dice, name } = ev.detail;
    showRoll(dice, name, npcname);
  }
</script>
<DiceDialog bind:this={dice} />
<DamageDialog bind:this={damageDialog} />
<SheetSettings bind:this={settingsDialog} bind:settings={$encountersSettings} />
<Roller on:roll={(ev) => showRoll([ev.detail])} />

  <IconButton icon="cog" on:click={() => settingsDialog.open()}/>
  {#if $encountersSettings?.rollToDiscord}
    <Icon icon="discord" />
  {/if}