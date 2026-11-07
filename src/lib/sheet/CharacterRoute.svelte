<script lang="ts">
  import { onMount, type ComponentProps } from 'svelte';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';
  import CharacterSheet from './CharacterSheet.svelte';
  import { readPromotion } from '$lib/data/account-promotion';
  let { data }: { data: ComponentProps<typeof CharacterSheet>['data'] } = $props();
  let ready = $state(false);
  let error = $state('');
  onMount(async () => {
    try {
      const promoted = !data.owner ? await readPromotion(data.id) : undefined;
      if (promoted) {
        await goto(
          resolve('/character/[id]', { id: promoted.id }) +
            `?account=${encodeURIComponent(promoted.owner)}`,
          {
            replaceState: true,
          },
        );
        return;
      }
      ready = true;
    } catch {
      error = 'This character’s storage could not be checked. Reload to try again.';
    }
  });
</script>

{#if error}<p class="p-8" role="alert">{error}</p>{:else if ready}<CharacterSheet {data} />{/if}
