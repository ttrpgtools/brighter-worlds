<script lang="ts">
  import type { Calling } from '$lib/types';
  import MenuLink from '$lib/MenuLink.svelte';
  import CallingSummary from './CallingSummary.svelte';
  import { STEP, getWizard } from './wizard.svelte';
  import type { PageData } from './$types';
  import HomeLink from '$lib/HomeLink.svelte';
  import { track } from '$lib/util/track';
  import { page } from '$app/state';
  import { getAccountSession } from '$lib/data/account-session';
  import Icon from '$lib/ui/icon.svelte';
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const [wizard, builder] = getWizard();
  const session = getAccountSession();
  const accountMode = $derived(page.url.searchParams.get('storage') === 'account');
  let starting = $state(false);
  let error = $state('');

  if (wizard.current !== STEP.CALLING) {
    wizard.send('reset');
  }

  async function startWizard(calling: Calling) {
    if (starting) return;
    starting = true;
    error = '';
    try {
      if (accountMode) {
        await session.refresh();
        const account = session.current().account;
        if (!account?.allowed || !account.user)
          throw new Error(
            'Sign in to an account with storage access before creating an account character.',
          );
        builder.configure('account', account.user.id);
      } else builder.configure('local');
      track(`start wizard: ${calling.name}`);
      wizard.send('setCalling', calling, data.spells, data.rituals);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'The character could not be started.';
    } finally {
      starting = false;
    }
  }
</script>

<HomeLink />
<div class="max-w-prose text-center mb-4 text-2xl font-subtitle">
  Find your Calling adventurer! What drives you forward?
</div>
<div class="max-w-prose text-left mb-6 text-md">
  All characters are generalists. Everyone can swing a sword, sneak around, or cast a spell (given
  access to a Grimoire). These Callings define the things that put you ahead of the pack, give you
  an extra edge or let you break the rules.
</div>
<p class="mb-6 flex max-w-prose items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
  <Icon icon={accountMode ? 'cloud' : 'desktop'} />
  {accountMode
    ? 'This character and its companions will save to your account.'
    : 'This character will be stored in this browser. You can save it online later.'}
</p>
{#if error}<p role="alert" class="mb-4 text-red-700 dark:text-red-300">{error}</p>{/if}
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 max-w-7xl">
  {#each data.list as calling (calling.id)}
    <CallingSummary {calling} onclick={() => startWizard(calling)} />
  {/each}
</div>
<MenuLink href="/" icon="logo-leaf">Home</MenuLink>
