<script lang="ts">
  interface Props {
    title?: string;
    inside?: boolean;
    class?: string | undefined;
    headerPadding?: boolean;
    header?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let {
    title = '',
    inside = false,
    headerPadding = true,
    class: classProp = undefined,
    header,
    children,
  }: Props = $props();

  let needHeader = $derived(!!title || header);
</script>

<div
  class:divide-y={needHeader}
  class="relative divide-gray-200 dark:divide-gray-600 rounded-lg bg-white {inside
    ? `shadow-none`
    : `shadow-xl`} dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 flex flex-col ring-gray-900/5 {classProp}"
>
  {#if header}
    {#if headerPadding}
      <div
        class={[
          inside ? `pb-5` : `px-4 py-5 sm:px-6`,
          'flex flex-wrap items-center justify-between sm:flex-nowrap',
        ]}
      >
        {@render header()}
      </div>
    {:else}
      {@render header()}
    {/if}
  {:else if title}
    <div class={inside ? `pb-5` : `px-4 py-5 sm:px-6`}>
      <div class="flex flex-wrap items-center justify-between sm:flex-nowrap">
        <h3 class="text-xl font-subtitle leading-6 flex-1">{title}</h3>
      </div>
    </div>
  {/if}
  <div
    class="{inside
      ? `pt-5`
      : `px-4 py-5 sm:px-6`} flex flex-col flex-1 overflow-y-auto overflow-x-hidden"
  >
    {@render children?.()}
  </div>
</div>
