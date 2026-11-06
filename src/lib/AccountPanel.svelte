<script lang="ts">
  import { resolve } from '$app/paths';
  import type { accountSummary } from '$lib/server/ankh';
  let { account }: { account: ReturnType<typeof accountSummary> } = $props();
  const messages: Record<string, string> = {
    sign_in_required: 'Sign in to use account storage.',
    invitation_required: 'This account needs an invitation to use Brighter Worlds account storage.',
    access_denied: 'This account does not have access to Brighter Worlds account storage.',
    grant_expired: 'Access to Brighter Worlds account storage has expired.',
  };
</script>

<main class="mx-auto max-w-xl px-6 py-12 space-y-6">
  <h1 class="font-title text-3xl">TTRPG Tools account</h1>
  <p>
    Your local sheets and backups are available without signing in. Signing in does not upload them.
  </p>
  {#if account.state === 'unconfigured' || account.state === 'unavailable'}
    <p role="status">
      Account services are currently unavailable. You can continue with local sheets.
    </p>
  {:else if account.user}
    <div
      class="flex items-center gap-3 rounded-xl border border-purple-300 dark:border-purple-700 p-4"
    >
      {#if account.user.avatar}<img
          src={account.user.avatar}
          alt=""
          class="size-12 rounded-full"
        />{/if}
      <div>
        <p class="font-bold">{account.user.displayName}</p>
        {#if account.user.email}<p>{account.user.email}</p>{/if}
      </div>
    </div>
    {#if account.accessUnavailable}
      <p role="status">Account access could not be checked. Try again in a moment.</p>
    {:else if !account.allowed}
      <p role="status">
        {messages[account.reason ?? ''] ?? 'Account storage is unavailable for this account.'}
      </p>
    {:else if !account.storageConfigured}
      <p role="status">Account storage is currently unavailable.</p>
    {/if}
    <div class="flex flex-wrap items-center gap-4">
      <a
        class="underline text-purple-700 dark:text-purple-300"
        href={account.accountUrl}
        rel="external"
        data-sveltekit-reload>Manage shared profile</a
      >
      <form method="POST" action={resolve('/auth/logout')}>
        <button class="rounded-full bg-purple-200 dark:bg-purple-900 px-4 py-2" type="submit"
          >Sign out</button
        >
      </form>
    </div>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      To use another account, sign out and sign in again.
    </p>
  {:else}
    <div class="flex flex-wrap gap-4 text-purple-700 dark:text-purple-300 underline">
      <a href={resolve('/auth/login')} data-sveltekit-reload>Sign in</a>
      <a href={resolve('/auth/signup')} data-sveltekit-reload>Create an account</a>
    </div>
  {/if}
  <a
    class="inline-block underline text-purple-700 dark:text-purple-300"
    href={resolve('/character')}>Local characters and backups</a
  >
</main>
