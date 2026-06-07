<script lang="ts">
  import { Combobox } from 'bits-ui';
  import type { Named } from './types';

  export type T = $$Generic<Named>;
  interface Props {
    options: T[];
    selectedValue?: T | undefined;
    textValue?: string;
    placeholder?: string;
    onselect: (item: T) => void;
    children?: import('svelte').Snippet<[{ value: T; active: boolean; selected: boolean }]>;
  }

  let {
    options,
    selectedValue = undefined,
    textValue = $bindable(''),
    placeholder = '',
    onselect,
    children: childrenProp,
  }: Props = $props();

  let selectedName = $state('');

  $effect(() => {
    if (selectedValue) selectedName = selectedValue.name;
  });

  let filtered = $derived(
    options.filter((opt) =>
      opt.name
        .toLowerCase()
        .replace(/\s+/g, '')
        .includes(textValue.toLowerCase().replace(/\s+/g, '')),
    ),
  );

  function selectName(name: string) {
    selectedName = name;
    const selected = options.find((opt) => opt.name === name);
    if (selected) onselect(selected);
  }

  function handleInput(ev: Event) {
    textValue = ev.currentTarget instanceof HTMLInputElement ? ev.currentTarget.value : '';
  }
</script>

<div>
  <div class="relative mt-1">
    <Combobox.Root
      type="single"
      bind:value={selectedName}
      inputValue={textValue}
      items={options.map((opt) => ({ value: opt.name, label: opt.name }))}
      onValueChange={selectName}
    >
      <Combobox.Input
        {placeholder}
        data-1p-ignore
        type="text"
        class="w-full rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
        oninput={handleInput}
      />
      <Combobox.Trigger
        type="button"
        aria-label="Open"
        class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
      >
        <svg
          class="h-5 w-5 text-purple-700 dark:text-purple-300"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fill-rule="evenodd"
            d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
            clip-rule="evenodd"
          />
        </svg>
      </Combobox.Trigger>
      <Combobox.Content
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-900 py-1 text-base shadow-lg dark:shadow-purple-400/20 ring-1 ring-black dark:ring-gray-500 ring-opacity-5 focus:outline-none sm:text-sm"
      >
        {#each filtered as value}
          <Combobox.Item
            value={value.name}
            label={value.name}
            class="relative cursor-default select-none py-2 px-3 text-gray-900 dark:text-white data-[highlighted]:bg-purple-700 data-[highlighted]:text-white dark:data-[highlighted]:bg-purple-300 dark:data-[highlighted]:text-gray-900"
          >
            {#snippet children({ selected, highlighted })}
              <div class="flex gap-2">
                {#if childrenProp}
                  {@render childrenProp({ value, active: highlighted, selected })}
                {:else}
                  {#if selected}<span>&bull;</span>
                  {/if}{value.name}
                {/if}
              </div>
            {/snippet}
          </Combobox.Item>
        {:else}
          <div class="relative cursor-default select-none py-2 pl-10 pr-4">
            <span class="block truncate font-normal">Nothing found</span>
          </div>
        {/each}
      </Combobox.Content>
    </Combobox.Root>
  </div>
</div>
