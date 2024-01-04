<script lang="ts">
  export let icon: string | undefined;
  export let size: string = '1rem';
  let clazz = '';
  export { clazz as class };
  $: href = `/img/icons.svg?9#${icon}`;
</script>
{#if icon}
<svg preserveAspectRatio="xMidYMid meet" class="inline-block m-0 !mt-0 {clazz}" style:height={size} style:width={size}><use xlink:href={href}/></svg>
{/if}
