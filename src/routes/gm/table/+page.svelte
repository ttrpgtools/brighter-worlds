<script lang="ts">
  import Disclosable from "$lib/Disclosable.svelte";
  import RollableTable from "$lib/RollableTable.svelte";
  import type { TableRoll } from "$lib/types";
  import ReactionRolls from "../ReactionRolls.svelte";
  import SidebarSection from "../SidebarSection.svelte";
  import { addRoll, getPlaymat } from "../playmat";

  const encounterOpts = ['Encounter', 'Signs of an Encounter', 'Signs of an Encounter', 'Nothing', 'Nothing', 'Nothing'];

  const mat = getPlaymat();

  function add(ev: CustomEvent<TableRoll<string>>) {
    const roll = ev.detail;
    addRoll(mat, {
      result: roll.roll,
      dice: roll.dice ?? [],
      label: `${roll.title}: ${roll.value}`
    });
  }
</script>
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Roll Tables">
    <p>Coming soon...</p>
  </SidebarSection>
  <SidebarSection title="Core Game Tables" open>
    <RollableTable options={encounterOpts} title="Dungeon Encounter Roll" on:roll={add} />
    <ReactionRolls />
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