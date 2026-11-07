<script lang="ts">
  import Button from '$lib/ui/button.svelte';
  import DeleteButton from '$lib/DeleteButton.svelte';

  interface Props {
    name: string;
    kind: 'scene' | 'NPC' | 'item';
    onshare: () => void;
    onremove: () => void;
  }

  let { name, kind, onshare, onremove }: Props = $props();
</script>

<div class="flex shrink-0 items-center gap-1">
  <Button
    size="icon-sm"
    icon="share"
    iconClass="size-5"
    title={`Share ${kind} ${name}`}
    aria-label={`Share ${kind} ${name}`}
    onclick={onshare}
  />
  <DeleteButton
    compact
    size="size-5"
    label={`Remove ${kind} ${name} from Mat`}
    confirmText="Click again to remove from mat."
    onconfirm={onremove}
  />
</div>
