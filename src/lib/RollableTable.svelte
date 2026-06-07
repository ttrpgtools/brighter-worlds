<script lang="ts">
  import { hasTrigger, isSimpleRollFormula } from './util/validate';
  import Card from './ui/card.svelte';
  import Die, { knownDie } from './dice/Die.svelte';
  import { roll, rollFormula, rolls } from './rolling/roll';
  import type { TableRoll } from './types';

  type T = $$Generic;
  interface Props {
    options: T[];
    title: string;
    die?: number | undefined;
    formula?: string | undefined;
    once?: boolean;
    onroll?: (roll: TableRoll<T>) => void;
    onclick?: () => void;
    children?: import('svelte').Snippet<[any]>;
  }

  let {
    options,
    title,
    die = undefined,
    formula = undefined,
    once = false,
    onclick,
    onroll,
    children,
  }: Props = $props();

  let rolled: number = $state(0);
  let highlighted = $state(new Set<number>());

  function alt(i: number, h: Set<number>) {
    const last = i === options.length - 1 ? 'rounded-b-lg' : '';
    return h.has(i)
      ? `bg-purple-700 text-white dark:bg-purple-300 dark:text-gray-900 ${last}`
      : i % 2 !== 0
        ? `bg-gray-200 dark:bg-gray-800 ${last}`
        : last;
  }

  function formulaDie() {
    return advanced && isSimpleRollFormula(formula ?? '')
      ? parseInt(formula?.replace(/1?d/, '') ?? '0', 10)
      : 0;
  }

  function snap(r: number) {
    if (r < 0) return 0;
    if (!advanced && r > sides) return sides;
    return r;
  }

  const SHUFFLE_DELAY = 90;
  function waitFor(spot: number) {
    return new Promise<number>((res) => setTimeout(() => res(spot), SHUFFLE_DELAY));
  }

  function* waitOn(spots: number[]) {
    while (spots.length) {
      yield waitFor(spots.pop() ?? 0);
    }
  }

  async function doShuffle(spots: number[]) {
    for await (const offset of waitOn(spots)) {
      shuffle = offset;
    }
  }

  const SHUFFLE_COUNT = 10;
  let shuffle = $state(0);
  export async function getResult(
    preRoll?: number,
    animate = false,
  ): Promise<TableRoll<T> | undefined> {
    shuffle = 0;
    highlighted = new Set();
    if (preRoll != null) {
      rolled = snap(preRoll);
    } else {
      rolled = 0;
      const final = advanced ? rollFormula(formula ?? '') : roll(sides);
      if (animate) {
        const shuffles = rolls(options.length, SHUFFLE_COUNT);
        // Await Animation
        await doShuffle(shuffles);
      }
      rolled = final;
      shuffle = 0;
      console.log(`Rolled = ${rolled}`);
    }
    const [selected, indices] = !advanced
      ? [[options[rolled - 1]], [rolled - 1]]
      : options.reduce(
          (p, opt, ci) => {
            const trigger = hasTrigger(opt) ? opt.trigger : ci + 1;
            const range = Array.isArray(trigger);
            if (
              (range && trigger[0] <= rolled && rolled <= trigger[1]) ||
              (!range && trigger === rolled)
            ) {
              p[0].push(opt);
              p[1].push(ci);
            }
            return p;
          },
          [[], []] as [T[], number[]],
        );
    highlighted = new Set(indices);
    if (selected != null) {
      console.log('dieSides', dieSides);
      if (knownDie(dieSides)) {
        return { roll: rolled, value: selected, title, dice: [dieSides] };
      }
      return { roll: rolled, value: selected, title, total: dieSides };
    }
  }
  export async function rollTable(preRoll?: number) {
    const troll = await getResult(preRoll, true);
    if (troll) onroll?.(troll);
  }
  let advanced = $derived(formula != null && formula.length);
  let sides = $derived(Math.min(die ?? options.length, options.length));
  let dieSides = $derived(advanced ? formulaDie() : sides);
  let dieLabel = $derived(
    knownDie(dieSides) ? '' : dieSides !== 0 ? `d${dieSides}` : formula || 'Roll',
  );
</script>

<Card>
  {#snippet header()}
    <div class="pr-2">
      <button type="button" {onclick}
        ><h3 class="text-xl font-subtitle leading-6">{title}</h3></button
      >
    </div>
    <div class="shrink-0">
      <div class="flex gap-4 items-center">
        <button
          type="button"
          onclick={() => (!once || rolled === 0) && rollTable()}
          disabled={once && rolled > 0}
          class="relative inline-flex items-center {knownDie(dieSides)
            ? `rounded-full`
            : `rounded-md`} disabled:cursor-not-allowed bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
          >{#if knownDie(dieSides)}<Die which={dieSides} />{:else}{dieLabel}{/if}</button
        >
      </div>
    </div>
  {/snippet}
  <ul class="-mx-4 -my-5 sm:-mx-6 rounded-b-lg relative">
    <div
      class="absolute py-2 px-4 sm:px-6 border-2 border-purple-400 dark:border-purple-600 w-full"
      class:rounded-b-lg={shuffle === options.length}
      class:hidden={shuffle === 0}
      style:transform={`translateY(${(shuffle - 1) * 100}%)`}
    >
      &nbsp;
    </div>
    {#each options as opt, oi}
      <li class="py-2 px-4 sm:px-6 border-2 border-transparent {alt(oi, highlighted)}">
        {#if children}{@render children({ opt })}{:else}{opt}{/if}
      </li>
    {/each}
  </ul>
</Card>
