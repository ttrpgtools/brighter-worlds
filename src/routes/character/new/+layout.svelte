<script lang="ts">
  import { getWizard } from "./wizard";
  getWizard();
</script>
<svelte:head>
  <title>New Character :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Create a Brighter Worlds Character</h2>
  <div class="font-symbol text-6xl">A</div>
  <slot></slot>
</main>