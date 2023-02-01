<script>
  import Beast from "$lib/entities/Beast.svelte";
</script>
<svelte:head>
  <title>Bestiary :: Brighter Worlds</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2 min-h-screen">
  <h2 class="font-title text-4xl text-center">The Creatures of a Brighter World</h2>
  <div class="font-symbol text-6xl">A</div>
  <p class="text-center">
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
  </p>
</main>