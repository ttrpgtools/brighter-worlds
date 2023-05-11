<script lang="ts">
  import { newList } from "$lib/data/sheet-manager";
  import { setContext } from "svelte";
  const list = newList();
  setContext('sheet-list', list);
</script>
<slot></slot>