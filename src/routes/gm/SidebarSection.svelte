<script lang="ts">
  import Button from '$lib/ui/button.svelte';
  interface Props {
    title?: string;
    open?: boolean;
    gap?: string;
    addable?: boolean;
    class?: string | undefined;
    onclick?: () => void;
    children?: import('svelte').Snippet;
  }

  let {
    title = 'Summary',
    open = $bindable(false),
    gap = 'gap-4',
    addable = false,
    class: classProp = undefined,
    onclick,
    children,
  }: Props = $props();
</script>

<details bind:open class="relative group/section flex flex-col {classProp}">
  <summary
    class="py-4 flex items-center gap-3 cursor-pointer border-b border-gray-200 dark:border-gray-600 group-open/section:mb-4"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="-top-0.5 relative w-4 h-4 text-purple-500 transition duration-300 group-open/section:rotate-90"
      viewBox="0 0 512 512"
      fill="currentColor"
      ><path
        d="M0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM240 128L368 256 240 384l-32 0 0-256 32 0z"
      /></svg
    >
    <h3 class="text-xl font-subtitle leading-6 flex-1">{title}</h3>
    {#if addable}
      <Button class="border-0" icon="plus" size="tight" iconClass="size-4" {onclick} />
    {/if}
  </summary>
  <div class="flex flex-col {gap}">
    {@render children?.()}
  </div>
</details>
