<script lang="ts">
  import type { DiscordEmbed } from "$lib/types";
  import { toNiceTimestamp } from "$lib/util/format";
  import { createEventDispatcher } from "svelte";

  export let embed: DiscordEmbed;
  export let name = '';
  export let time: Date | undefined = undefined;
  export let showMeta = false;
/*
export interface DiscordEmbed {
  title?: string;
  author?: { name: string, icon_url?: string; };
  description?: string;
  url?: string;
  color?: number;
  footer?: { text: string; icon_url?: string; }
  image?: { url: string };
  fields: { name: string, value: string, inline?: boolean }[];
}
*/
  $: color = `#${(embed.color ?? 0).toString(16)}`;
  const dispatch = createEventDispatcher();

  function openBig() {
    dispatch('imageclick', embed.image?.url);
  }
</script>
<div class="rounded border-l-4 relative shadow dark:bg-gray-900 bg-gray-200 border-gray-500  p-3 flex flex-col gap-2 group" style="border-color: {color};">
  <button type="button" on:click={() => dispatch('delete')} class="opacity-0 transition-opacity absolute top-3 right-4 text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover:opacity-100 flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
  {#if time}<time class="absolute top-3 right-12 text-gray-700 dark:text-gray-300 bg-gray-200/90 dark:bg-gray-900/90 rounded-sm px-2 opacity-0 transition-opacity group-hover:opacity-100">{toNiceTimestamp(time)}</time>{/if}
  {#if embed.title ?? name}<h3 class="font-bold flex items-center gap-3">{#if embed.url}<a href={embed.url} target="_blank" class="text-purple-600 dark:text-purple-300 underline" rel="noreferrer">{embed.title ?? name}</a>{:else}{embed.title ?? name}{/if}
    {#if embed.author}
    <span class="inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ring-gray-700 dark:ring-gray-200">
      <svg class="h-1.5 w-1.5" fill={color} viewBox="0 0 6 6" aria-hidden="true">
        <circle cx="3" cy="3" r="3" />
      </svg>
      {embed.author.name}
    </span>
    {/if}</h3>{/if}
  {#if embed.description}<p>{embed.description}</p>{/if}
  {#if embed.fields && embed.fields.length}
  <div class="flex gap-4 text-sm">
    {#each embed.fields as f}
    <div class="flex flex-col gap-1">
      <div class="font-bold">{f.name}</div>
      <div class="">{f.value}</div>
    </div>
    {/each}
  </div>
  {/if}
  {#if embed.image}
  <button type="button" on:click={openBig}><img src={embed.image.url} alt={`Image of ${embed.title}`} class="max-w-xs rounded-sm"></button>
  {/if}
  {#if embed.cta}
  <div class="flex gap-4 text-sm">
    {#each embed.cta as c}
    <button type="button" on:click={() => dispatch('cta', c)} class="rounded-md px-2 py-1 bg-purple-300 dark:bg-purple-700">{c.label}{#if showMeta}&nbsp;({c.meta}){/if}</button>
    {/each}
  </div>
  {/if}
  {#if embed.meta && showMeta}<p class="opacity-75 italic">{embed.meta}</p>{/if}
</div>