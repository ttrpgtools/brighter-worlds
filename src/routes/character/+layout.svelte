<script lang="ts">
  import { createSheetCache, getList } from "$lib/data/sheet-manager";
  getList();
  createSheetCache();
</script>
<slot></slot>