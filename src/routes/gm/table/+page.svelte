<script lang="ts">
  import Disclosable from "$lib/Disclosable.svelte";
  import { getNpcInstance, encounters } from "$lib/data/encounter-manager";
  import type { CustomRolltableDef, RolltableOption, TableRoll } from "$lib/types";
  import { isEncounter, isNpc } from "$lib/util/validate";
  import CustomRolltable from "../CustomRolltable.svelte";
  import SidebarSection from "../SidebarSection.svelte";
  import RolltableDialog from "../RolltableDialog.svelte";
  import { addEncounter, addItem, addNpc, addLocalRoll, getPlaymat, getRollLog } from "../playmat";
  import type { PageData } from "./$types";
  import { getNpcs } from "../bestiary/npcs";
  import { getRelics } from "../reliquary/relics";
  import { addTable, getTables, removeTable, updateTable } from "./tables";
  import Icon from "$lib/Icon.svelte";
  import { id } from "$lib/rolling/id";

  export let data: PageData;

  const bestiary = getNpcs();
  $: allNpcs = data.npcs.concat($bestiary);
  const relicList = getRelics();
  const encList = encounters.list
  

  let tableDialog: RolltableDialog;

  const encounterOpts: RolltableOption[] = [
    { type: 'text', value: 'Encounter', trigger: 1 },
    { type: 'text', value: 'Signs of an Encounter', trigger: [2, 3] },
    { type: 'text', value: 'Nothing', trigger: [4, 6] },
  ];

  const reactionOpts: RolltableOption[] = [
    { type: 'text', value: 'Extremely positive', trigger: [2, 3] },
    { type: 'text', value: 'Positive', trigger: [4, 6] },
    { type: 'text', value: 'Neutral', trigger: 7 },
    { type: 'text', value: 'Negative', trigger: [8, 10] },
    { type: 'text', value: 'Extremely negative', trigger: [11, 12] },
  ];

  let encounterTable: CustomRolltable;
  let reactionTable: CustomRolltable;
  const customTables: Record<string, CustomRolltable> = {};

  let mat = getPlaymat();
  let log = getRollLog();

  let tables = getTables();

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

  async function fullEncounterRoll(table: CustomRolltableDef) {
    const encRoll = await encounterTable.getResult();
    if (encRoll) {
      addOption(encRoll);
      if (encRoll.value.length && encRoll.value[0].value === 'Nothing') {
        return;
      }
      const [reactionRoll, roll] = await Promise.all([reactionTable.getResult(), customTables[table.id].getResult()]);
      const reaction = (reactionRoll && reactionRoll.value.length) ? ` (${reactionRoll.value[0].value})` : '';
      if (reactionRoll) addOption(reactionRoll);
      if (roll && roll.value.length) {
        const res = roll.value[0];
        addLocalRoll(log, getRollResult(roll));
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
<RolltableDialog bind:this={tableDialog} npcList={allNpcs} encList={$encList} relicList={$relicList} />
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Roll Tables" open addable on:click={addCustom}>
    {#each $tables as table}
    <div class="relative group/table">
      <button type="button" on:click={() => remove(table)} class="hidden absolute top-2 left-2 text-lg z-20 rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/table:flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
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