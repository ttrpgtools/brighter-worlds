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

  let mat = getPlaymat();
  let log = getRollLog();

  let tables = getTables();

  function addRich(ev: CustomEvent<TableRoll<RolltableOption>>) {
    const roll = ev.detail;
    if (!roll.value.length) return;
    const first = roll.value[0];
    addLocalRoll(log, {
      result: roll.roll,
      dice: roll.dice ?? [],
      label: `${roll.title}: ${first.type === 'text' ? first.value : first.value.name}`
    });
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
</script>
<RolltableDialog bind:this={tableDialog} npcList={allNpcs} encList={$encList} relicList={$relicList} />
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Roll Tables" open addable on:click={addCustom}>
    {#each $tables as table}
    <div class="relative group/table">
      <button type="button" on:click={() => removeTable(tables, table)} class="hidden absolute top-2 left-2 text-lg z-20 rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/table:flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
      <CustomRolltable options={table.options} title={table.name} formula={table.formula} on:click={() => editTable(table)} on:roll={addRich} />
    </div>
    {/each}
  </SidebarSection>
  <SidebarSection title="Core Game Tables" open>
    <CustomRolltable options={encounterOpts} title="Dungeon Encounter Roll" formula="d6" on:roll={addRich} />
    <CustomRolltable options={reactionOpts} title="Reaction Roll" formula="2d6" on:roll={addRich} />
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