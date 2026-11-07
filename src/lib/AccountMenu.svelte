<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import { afterNavigate } from '$app/navigation';
  import { resolve } from '$app/paths';
  import Icon from '$lib/ui/icon.svelte';
  import AccountAvatar from '$lib/AccountAvatar.svelte';
  import { getAccountSession } from '$lib/data/account-session';

  const session = getAccountSession();
  let account = $derived($session.account);
  let unavailable = $derived(!$session.account && !!$session.epoch);
  let logoutForm: HTMLFormElement | undefined;
  const itemClass =
    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-gray-900 dark:text-white data-highlighted:bg-purple-500 data-highlighted:text-white';
  let label = $derived.by(() =>
    account?.user ? `${account.user.displayName}'s account` : 'Account',
  );

  const refresh = () => session.refresh();
  // A client refresh also works on prerendered reference pages without embedding a profile in HTML.
  afterNavigate(() => {
    void refresh();
  });
</script>

<svelte:window
  onfocus={() => {
    void refresh();
  }}
/>

<form bind:this={logoutForm} method="POST" action={resolve('/auth/logout')} hidden></form>
<DropdownMenu.Root
  onOpenChange={(open) => {
    if (open) void refresh();
  }}
>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        aria-label={label}
        title={account?.user ? `Signed in as ${account.user.displayName}` : 'TTRPG Tools account'}
        class="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-300 shadow-lg hover:bg-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-purple-700 dark:shadow-purple-400/20 dark:hover:bg-purple-800"
      >
        {#if account?.user}
          <AccountAvatar user={account.user} />
        {:else}
          <Icon icon="user" class="size-4" />
        {/if}
      </button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      align="end"
      sideOffset={8}
      class="z-50 w-64 rounded-xl bg-white p-1 shadow-xl ring-1 ring-purple-500/10 dark:bg-gray-900 dark:shadow-purple-400/20"
    >
      {#if account?.user}
        <p
          class="break-words border-b border-purple-100 px-3 py-2 font-subtitle text-xl dark:border-purple-900"
        >
          {account.user.displayName}
        </p>
        <DropdownMenu.Item class={itemClass} textValue="Your characters">
          {#snippet child({ props })}<a {...props} href={resolve('/character')}>Your characters</a
            >{/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item class={itemClass} textValue="Account and profile">
          {#snippet child({ props })}<a {...props} href={resolve('/account')}>Account and profile</a
            >{/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item class={itemClass} textValue="Manage shared profile">
          {#snippet child({ props })}<a
              {...props}
              href={account?.accountUrl}
              rel="external"
              data-sveltekit-reload>Manage shared profile</a
            >{/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          class={itemClass}
          textValue="Sign out"
          onSelect={() => logoutForm?.requestSubmit()}>Sign out</DropdownMenu.Item
        >
      {:else if unavailable || account?.state === 'unavailable' || account?.state === 'unconfigured'}
        <p class="px-3 py-2" role="status">Account services are currently unavailable.</p>
        <DropdownMenu.Item class={itemClass} textValue="Account details">
          {#snippet child({ props })}<a {...props} href={resolve('/account')}>Account details</a
            >{/snippet}
        </DropdownMenu.Item>
      {:else if account}
        <DropdownMenu.Item class={itemClass} textValue="Sign in">
          {#snippet child({ props })}<a
              {...props}
              href={resolve('/auth/login')}
              data-sveltekit-reload>Sign in</a
            >{/snippet}
        </DropdownMenu.Item>
        <DropdownMenu.Item class={itemClass} textValue="Create an account">
          {#snippet child({ props })}<a
              {...props}
              href={resolve('/auth/signup')}
              data-sveltekit-reload>Create an account</a
            >{/snippet}
        </DropdownMenu.Item>
      {:else}
        <p class="px-3 py-2" role="status">Checking sign-in…</p>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
