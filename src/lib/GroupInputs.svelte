<script lang="ts">
  import { id } from './rolling/id';
  import type { Named } from './types';
  import { defined } from './util/array';

  const baseId = id();

  type T = $$Generic<Named>;
  interface Props {
    max?: number;
    options: T[];
    selected: T[];
    hideUnavailable?: boolean;
    children?: import('svelte').Snippet<[any]>;
  }

  let {
    max = 1,
    options,
    selected = $bindable(),
    hideUnavailable = false,
    children,
  }: Props = $props();
  let optionMap = $derived(new Map(options.map((x) => [x.name, x])));
  let onlyDeselect = $derived(selected.length === max);
  let selection = $derived(new Set<string>(selected.map((x) => x.name)));
</script>

<div class="mx-auto w-full max-w-md">
  <fieldset class="flex flex-col gap-3">
    {#each options as opt (opt.name)}
      {#if !hideUnavailable || !onlyDeselect || selection.has(opt.name)}
        <div class="relative">
          <input
            id={`${baseId}-${opt.name}`}
            disabled={onlyDeselect && !selection.has(opt.name)}
            class="absolute opacity-0 w-0 h-0 peer"
            type="checkbox"
            bind:checked={
              () => selection.has(opt.name),
              (c) => {
                if (c) {
                  selection.add(opt.name);
                } else {
                  selection.delete(opt.name);
                }
                selected = Array.from(selection.values())
                  .map((x) => optionMap.get(x))
                  .filter(defined);
              }
            }
            name="type"
            value={opt.name}
          />
          <label
            for={`${baseId}-${opt.name}`}
            class="[&_.desc]:text-gray-600 dark:[&_.desc]:text-gray-400 peer-checked:[&_.desc]:text-purple-200 dark:peer-checked:[&_.desc]:text-purple-800 peer-disabled:cursor-not-allowed peer-disabled:text-gray-500 peer-focus:ring-2 peer-focus:ring-purple-500 peer-focus:ring-offset-white dark:peer-focus:ring-offset-gray-900 peer-focus:ring-opacity-60 peer-focus:ring-offset-2 hover:ring-2 hover:ring-purple-500 hover:ring-offset-white dark:hover:ring-offset-gray-900 hover:ring-opacity-60 hover:ring-offset-2 bg-white dark:bg-gray-900 relative flex cursor-pointer rounded-lg px-5 py-4 shadow-lg dark:shadow-purple-400/20 focus:outline-none peer-checked:bg-purple-800/75 peer-checked:text-white dark:peer-checked:bg-purple-300/75 dark:peer-checked:text-gray-900"
          >
            <div class="flex w-full items-center justify-between">
              <div class="flex items-center">
                <div class="text-sm">
                  <p class="font-bold">{opt.name}</p>
                  <div class="desc">
                    {@render children?.({ opt })}
                  </div>
                </div>
              </div>
              <div class="shrink-0 text-white dark:text-gray-900">
                <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
                  <circle cx="12" cy="12" r="12" fill="currentColor" opacity="0.2" /><path
                    d="M7 13l3 3 7-7"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
          </label>
        </div>
      {/if}
    {/each}
  </fieldset>
</div>
