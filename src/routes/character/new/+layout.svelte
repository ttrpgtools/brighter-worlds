<script lang="ts">
  import { getWizard, STEP } from './wizard.svelte';
  import Button from '$lib/ui/button.svelte';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  const [wizard, builder] = getWizard();
</script>

<svelte:head>
  <title>New Character :: Brighter Worlds Online</title>
</svelte:head>
<main class="px-8 pb-8 pt-16 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Create a Brighter Worlds Character</h2>
  <div class="font-symbol text-6xl">A</div>
  {#if wizard.current === STEP.DONE}
    <div class="max-w-lg space-y-4 py-12 text-center" aria-busy={builder.working}>
      {#if builder.working}<p role="status">
          Creating your {builder.storage === 'account' ? 'account' : 'local'} character…
        </p>
      {:else if builder.error}<p role="alert">{builder.error}</p>
        <div class="flex justify-center gap-3">
          <Button onclick={() => builder.finish()}>Try again</Button><Button
            variant="outline"
            onclick={() => builder.backup()}>Download draft</Button
          >
        </div>{/if}
    </div>
  {:else}
    {#if builder.error}<p role="alert" class="max-w-prose mb-4 text-red-700 dark:text-red-300">
        {builder.error}
      </p>{/if}
    {@render children?.()}
  {/if}
</main>
