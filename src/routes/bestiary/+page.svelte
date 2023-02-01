<script>
  import Beast from "$lib/entities/Beast.svelte";
  import MenuLink from "$lib/MenuLink.svelte";
</script>
<svelte:head>
  <title>Bestiary :: Brighter Worlds</title>
</svelte:head>
<main class="p-4 sm:p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">The Creatures of Brighter Worlds</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
    <Beast stats={{
      name: 'Alligator',
      grit: 3,
      str: 8,
      dex: 6,
      wil: 6,
      attacks: [{ name: 'Bite', damage: 8}],
      notes: [
        'Strange aquatic, reptilian predators.',
        'Seem to know more than they should. Hate falsehoods.'
      ],
      wants: 'To be left alone and to eat anyone who doesn’t respect that.',
      found: '1d6 (1: Basking, 2: Napping, 3: Hissing, 4-5: Lying in Ambush, 6: Aggressing)'
    }} />
    <Beast stats={{
      name: `Fire God's Shame`,
      grit: 3,
      str: 4,
      dex: 8,
      wil: 6,
      attacks: [
        { name: 'Peck', damage: 6, desc: 'sets cloth smoldering on Direct Damage.'},
        { name: 'Death Flare', damage: 8, blast: true, desc: 'releases a blast of flame when killed.'}
      ],
      notes: [
        'Constantly ornery and aggressive, goose-like creature.',
        'Popular with travelers as its death flare cooks its meat perfectly.'
      ],
      wants: 'Respect and bread crumbs.',
      found: 'Harassing random passersby.'
    }} />
  </div>
  <MenuLink href="/">Home</MenuLink>
</main>