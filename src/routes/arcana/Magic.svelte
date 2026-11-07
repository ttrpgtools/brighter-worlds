<script lang="ts">
  import type { UsableEntity } from '$lib/types';
  interface Props {
    magic: UsableEntity;
  }

  let { magic }: Props = $props();
</script>

<h4 class="font-bold text-lg">{magic.name}</h4>
<p class="mb-5">{magic.desc}</p>
