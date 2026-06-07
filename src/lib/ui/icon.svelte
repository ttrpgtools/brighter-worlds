<script lang="ts">
  import { cn } from '$lib/util/tw';

  type IconProps = {
    icon: string;
    class?: string;
  };
  let { icon, class: className }: IconProps = $props();

  let href = $derived(`/img/icons.svg?7.9#${icon}`);
</script>

{#if icon}
  <svg preserveAspectRatio="xMidYMid meet" class={cn(`m-0 mt-0! inline-block size-4`, className)}
    ><use xlink:href={href} {href} /></svg
  >
{/if}
