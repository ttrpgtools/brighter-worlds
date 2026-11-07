<script lang="ts">
  import { createSheetCache, getList } from '$lib/data/sheet-manager';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  getList();
  createSheetCache();
</script>

{@render children?.()}
