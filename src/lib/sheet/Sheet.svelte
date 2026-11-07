<script lang="ts">
  import type { Character } from '$lib/types';
  interface Props {
    character: Character;
  }

  let { character }: Props = $props();
</script>
