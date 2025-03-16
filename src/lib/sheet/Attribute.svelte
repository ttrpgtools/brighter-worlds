<script lang="ts">
  import type { Attr, Attribute, DieMod, DieRollSet, DieValue } from '$lib/types';
  import DieSelector from './DieSelector.svelte';
  import RollSelector from './RollSelector.svelte';
  import Button from '$lib/ui/button.svelte';
  interface Props {
    name: Attr;
    value?: Attribute<DieValue, 0>;
    ondamage: (type: Attr, mod: DieMod | undefined) => void | Promise<void>;
    onchange: () => void;
    onroll: (data: { dice: DieRollSet; name: string }) => void;
  }

  let {
    name,
    value = $bindable({ current: 4, max: 4 }),
    onchange,
    ondamage,
    onroll
  }: Props = $props();

  function takeDamage(data: { dice: DieRollSet; name: string }) {
    ondamage(name, data.dice.mod);
  }
  let displayName = $derived(name.toUpperCase());
</script>

<div class="grid grid-cols-5 items-center">
  <RollSelector label="{displayName} Save" die={value.current || 4} {onroll}>
    {#snippet children({ events })}
      <button
        use:events
        type="button"
        title="Roll {displayName} Save"
        class="font-subtitle text-xl bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full px-2 pt-2 pb-1 w-16 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
        >{displayName}</button
      >
    {/snippet}
  </RollSelector>

  <div class="col-span-3 flex gap-1 items-center">
    <div class="relative">
      <DieSelector
        bind:current={() => value.current, (v) => (value = { ...value, current: v })}
        nullable
        invalid={value.current > value.max}
      />
    </div>
    <span class="text-2xl text-center">/</span>
    <DieSelector bind:current={() => value.max, (v) => (value = { ...value, max: v })} />
  </div>
  <div class="flex justify-end text-right">
    <RollSelector label="" direction={-1} die={value.current || 4} onroll={takeDamage}>
      {#snippet children({ cprops })}
        <Button icon="damage" {...cprops} title="Take {displayName} Damage" />
      {/snippet}
    </RollSelector>
  </div>
</div>
