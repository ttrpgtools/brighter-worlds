<script lang="ts">
  let {
    user,
    size = 'sm',
  }: {
    user: { displayName: string; avatar?: string | null };
    size?: 'sm' | 'lg';
  } = $props();

  let failedAvatar: string | undefined = $state();
  let avatar = $derived(user.avatar?.trim());
  let initials = $derived.by(() => {
    const names = user.displayName.trim().split(/\s+/).filter(Boolean);
    const parts = names.length > 1 ? [names[0], names[names.length - 1]] : names;
    return (
      parts
        .map((name) => Array.from(name)[0])
        .join('')
        .toUpperCase() || 'U'
    );
  });
</script>

<span
  aria-hidden="true"
  class={[
    'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-300 font-subtitle text-gray-900 dark:bg-purple-700 dark:text-white',
    size === 'lg' ? 'size-12 text-xl' : 'size-9 text-base',
  ]}
>
  {#if avatar && avatar !== failedAvatar}
    <img
      src={avatar}
      alt=""
      class="size-full object-cover"
      onerror={(event) => {
        failedAvatar = event.currentTarget.getAttribute('src') ?? undefined;
      }}
    />
  {:else}
    {initials}
  {/if}
</span>
