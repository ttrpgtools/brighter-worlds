<script lang="ts">
  import Disclosable from "$lib/Disclosable.svelte";
  import { getNpcInstance, encounters } from "$lib/data/encounter-manager";
  import type { CustomRolltableDef, DiscordEmbed, RolltableOption, TableRoll } from "$lib/types";
  import { isEncounter, isNpc } from "$lib/util/validate";
  import CustomRolltable from "../CustomRolltable.svelte";
  import SidebarSection from "../SidebarSection.svelte";
  import RolltableDialog from "../RolltableDialog.svelte";
  import { addEncounter, addItem, addNpc, addLocalRoll, getPlaymat, getRollLog, addRemoteRoll } from "../playmat";
  import type { PageData } from "./$types";
  import { getNpcs } from "../bestiary/npcs";
  import { getRelics } from "../reliquary/relics";
  import { addTable, getTables, removeTable, updateTable } from "./tables";
  import Icon from "$lib/Icon.svelte";
  import { id } from "$lib/rolling/id";
  import { rollRequests, rollResponses } from "../gmtools";
  import { ENCOUNTER_ROLL_NO, ENCOUNTER_ROLL_SIGNS, ENCOUNTER_ROLL_YES, REACTION_ROLL_NEG, REACTION_ROLL_NEUTRAL, REACTION_ROLL_POS, REACTION_ROLL_VNEG, REACTION_ROLL_VPOS } from "$lib/const";
  import { formatEncounterRoll } from "$lib/util/share";
  import { onMount } from "svelte";

  export let data: PageData;

  const bestiary = getNpcs();
  $: allNpcs = data.npcs.concat($bestiary);
  const relicList = getRelics();
  const encList = encounters.list
  

  let tableDialog: RolltableDialog;

  const encounterOpts: RolltableOption[] = [
    { type: 'text', value: ENCOUNTER_ROLL_YES, trigger: 1 },
    { type: 'text', value: ENCOUNTER_ROLL_SIGNS, trigger: [2, 3] },
    { type: 'text', value: ENCOUNTER_ROLL_NO, trigger: [4, 6] },
  ];

  const reactionOpts: RolltableOption[] = [
    { type: 'text', value: REACTION_ROLL_VPOS, trigger: [2, 3] },
    { type: 'text', value: REACTION_ROLL_POS, trigger: [4, 6] },
    { type: 'text', value: REACTION_ROLL_NEUTRAL, trigger: 7 },
    { type: 'text', value: REACTION_ROLL_NEG, trigger: [8, 10] },
    { type: 'text', value: REACTION_ROLL_VNEG, trigger: [11, 12] },
  ];

  let encounterTable: CustomRolltable;
  let reactionTable: CustomRolltable;
  const customTables: Record<string, CustomRolltable> = {};

  let mat = getPlaymat();
  let log = getRollLog();

  let tables = getTables();

  onMount(() => {
    const unsub = rollResponses.subscribe(({id, result}) => {
      if (customTables[id]) {
        customTables[id].rollTable(result);
      }
    });
    return () => unsub();
  });

  function getRollResult(roll: TableRoll<RolltableOption>) {
    const first = roll.value[0];
    return {
      result: roll.roll,
      dice: roll.dice ?? [],
      label: `${roll.title}: ${first.type === 'text' ? first.value : first.value.name}`
    };
  }

  function addOption(roll: TableRoll<RolltableOption>) {
    if (!roll.value.length) return;
    const first = roll.value[0];
    addLocalRoll(log, getRollResult(roll));
    if (first.type === 'entity') {
      const ent = first.value;
      if (isNpc(ent)) {
        const inst = getNpcInstance(ent);
        addNpc(mat, inst);
      } else if (isEncounter(ent)) {
        addEncounter(mat, ent);
      } else {
        addItem(mat, ent);
      }
    }
  }

  function addRemote(embed: DiscordEmbed) {
    addRemoteRoll(log, { embed });
  }

  function addRich(ev: CustomEvent<TableRoll<RolltableOption>>) {
    const roll = ev.detail;
    addOption(roll);
  }

  async function addCustom() {
    const newTable = await tableDialog.getNew();
    if (newTable) {
      addTable(tables, newTable);
    }
  }

  async function editTable(table: CustomRolltableDef) {
    const result = await tableDialog.edit(table);
    if (result) {
      updateTable(tables, result);
    }
  }

  function remove(table: CustomRolltableDef) {
    removeTable(tables, table);
    delete customTables[table.id];
  }

  function requestRoll(table: CustomRolltableDef) {
    rollRequests.emit({name: table.id, formula: table.formula});
  }

  async function fullEncounterRoll(table: CustomRolltableDef) {
    const encRoll = await encounterTable.getResult();
    if (encRoll) {
      const type = encRoll.value.length > 0 && encRoll.value[0].type === 'text' ? encRoll.value[0].value : '';
      if (type === 'Nothing') {
        addRemote(formatEncounterRoll(type));
        return;
      }
      const [reactionRoll, roll] = await Promise.all([reactionTable.getResult(), customTables[table.id].getResult()]);
      const reaction = (reactionRoll && reactionRoll.value.length) ? ` (${reactionRoll.value[0].value})` : '';
      if (roll && roll.value.length) {
        const res = roll.value[0];
        const label = res.type === 'entity' ? res.value.name : res.value;
        addRemote(formatEncounterRoll(type, reaction, label));
        if (res.type === 'entity') {
          const ent = res.value;
          if (isNpc(ent)) {
            const inst = getNpcInstance(ent);
            inst.name = `${inst.name}${reaction}`;
            addNpc(mat, inst);
          } else if (isEncounter(ent)) {
            const inst = {...ent, id: id(), name: `${ent.name}${reaction}`};
            addEncounter(mat, inst);
          } else {
            addItem(mat, ent);
          }
        }
      }
    }
  }
</script>
<svelte:head>
  <title>Tables :: Brighter Worlds Online</title>
</svelte:head>
<RolltableDialog bind:this={tableDialog} npcList={allNpcs} encList={$encList} relicList={$relicList} />
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Roll Tables" open addable on:click={addCustom}>
    {#each $tables as table}
    <div class="relative group/table">
      <button type="button" on:click={() => remove(table)} class="hidden absolute top-2 left-2 text-lg z-20 rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/table:flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
      <button type="button" on:click={() => requestRoll(table)} class="hidden absolute top-2 left-1/2 -translate-x-1/2 text-lg z-20 rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/table:flex items-center justify-center"><Icon icon="broadcast"/></button>
      <button type="button" on:click={() => fullEncounterRoll(table)} class="hidden absolute top-2 right-2 text-lg z-20 rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/table:flex items-center justify-center"><Icon icon="nav-encounter"/></button>
      <CustomRolltable options={table.options} title={table.name} formula={table.formula} on:click={() => editTable(table)} on:roll={addRich} bind:this={customTables[table.id]} />
    </div>
    {/each}
  </SidebarSection>
  <SidebarSection title="Core Game Tables" open>
    <CustomRolltable options={encounterOpts} title="Dungeon Encounter Roll" formula="d6" on:roll={addRich} bind:this={encounterTable} />
    <CustomRolltable options={reactionOpts} title="Reaction Roll" formula="2d6" on:roll={addRich} bind:this={reactionTable} />
  </SidebarSection>

  <SidebarSection title="Pending">
    <Disclosable title="Travel Rolls">
      Coming soon...
    </Disclosable>
    
    <Disclosable title="Friends!">
      Coming soon...
    </Disclosable>
  </SidebarSection>
</div>