<script lang="ts">
  import { Die } from '$lib/dice';
  import { roll } from '$lib/rolling/roll';
  import type { DieValue } from '$lib/types';
  import Button from '$lib/ui/button.svelte';
  import Card from '$lib/ui/card.svelte';
  import type { FriendRollResult } from './friend-state.svelte';

  interface Props {
    onlog?: (label: string, result: number, dice?: DieValue[]) => void;
    rollFriend?: () => Promise<FriendRollResult | undefined>;
  }

  interface TravelResult {
    weatherDie: number;
    activityDie: number;
    encounter: boolean;
    weather: string;
    hexActivity: string;
  }

  interface TravelEncounterResult {
    subjectDie: number;
    subjectRolls: number[];
    activityDie: number;
    subject: string;
    activity: string;
    intensified: boolean;
    roadAdjusted: boolean;
    withSubjectDie?: number;
    withSubject?: string;
  }

  let { onlog, rollFriend }: Props = $props();

  let travel: TravelResult | undefined = $state();
  let encounter: TravelEncounterResult | undefined = $state();
  let preRolledWeather: number | undefined = $state();
  let road = $state(false);

  const weatherResults = [
    'Weather: 1',
    'Weather: 2',
    'Weather: 3',
    'Weather: 4',
    'Weather: 5',
    'Weather: 6',
  ];

  const hexActivity = [
    'Recent activity, roll Encounter',
    'Nearby activity, roll Encounter',
    'Weather on the horizon, pre-roll weather',
    'Local normality',
    'Local normality',
    'Local weirdness',
  ];

  const encounterSubjects = [
    'Friend!',
    'Friend!',
    'Local Quest',
    'A Local',
    'Wildlife or a Local',
    'Wildlife',
  ];

  const encounterActivities = [
    'Traveling',
    'Hanging Out',
    'In Trouble',
    'Working',
    'Special',
    'With...',
  ];

  function d6() {
    return roll(6);
  }

  function rollSubject() {
    const first = d6();
    if (!road) {
      return { value: first, rolls: [first], roadAdjusted: false };
    }
    const second = d6();
    return {
      value: Math.min(first, second),
      rolls: [first, second],
      roadAdjusted: true,
    };
  }

  function rollTravel() {
    const weatherDie = preRolledWeather ?? d6();
    const activityDie = d6();
    travel = {
      weatherDie,
      activityDie,
      encounter: weatherDie === activityDie,
      weather: weatherResults[weatherDie - 1],
      hexActivity: hexActivity[activityDie - 1],
    };
    encounter = undefined;
    preRolledWeather = undefined;

    onlog?.(
      `Travel Roll: ${travel.weather}; ${travel.hexActivity}`,
      weatherDie + activityDie,
      [6, 6],
    );

    if (activityDie === 3) {
      preRollWeather();
    }
  }

  function preRollWeather() {
    preRolledWeather = d6();
    onlog?.(`Weather: ${preRolledWeather}`, preRolledWeather, [6]);
  }

  function rollEncounter() {
    const subject = rollSubject();
    const activityDie = d6();
    const withSubjectDie = activityDie === 6 ? d6() : undefined;
    const withSubject = withSubjectDie ? encounterSubjects[withSubjectDie - 1] : undefined;

    encounter = {
      subjectDie: subject.value,
      subjectRolls: subject.rolls,
      activityDie,
      subject: encounterSubjects[subject.value - 1],
      activity: encounterActivities[activityDie - 1],
      intensified: subject.value === activityDie,
      roadAdjusted: subject.roadAdjusted,
      withSubjectDie,
      withSubject,
    };

    const roadNote = subject.roadAdjusted ? `; road rolls ${subject.rolls.join(', ')}` : '';
    const withNote = withSubject ? ` ${withSubject}` : '';
    const intensifiedNote = encounter.intensified ? '; intensified' : '';
    onlog?.(
      `Travel Encounter: ${encounter.subject} ${encounter.activity}${withNote}${intensifiedNote}${roadNote}`,
      encounter.subjectDie + activityDie,
      [6, 6],
    );
  }

  async function handleFriendRoll() {
    await rollFriend?.();
  }

  function hasFriendResult() {
    return encounter?.subject === 'Friend!' || encounter?.withSubject === 'Friend!';
  }
</script>

<Card>
  {#snippet header()}
    <div class="pr-2">
      <h3 class="text-xl font-subtitle leading-6">Travel Rolls</h3>
      {#if preRolledWeather}
        <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Next weather: {preRolledWeather}
        </div>
      {/if}
    </div>
    <Button icon="d6" onclick={rollTravel}>Roll</Button>
  {/snippet}

  <div class="flex flex-col gap-4">
    <label class="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        bind:checked={road}
        class="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
      />
      <span>Road encounter: roll subject twice and keep lower</span>
    </label>

    {#if travel}
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div class="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Die which={6} />
            Light die
          </div>
          <div class="text-lg font-medium">{travel.weather}</div>
        </div>
        <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <div class="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Die which={6} />
            Dark die
          </div>
          <div class="text-lg font-medium">{travel.hexActivity}</div>
        </div>
      </div>

      {#if travel.encounter}
        <div
          class="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm dark:border-purple-800 dark:bg-purple-950"
        >
          Matching dice: a Travel Encounter occurs.
        </div>
      {/if}

      <div class="flex flex-wrap gap-2">
        {#if travel.encounter || travel.activityDie === 1 || travel.activityDie === 2}
          <Button size="sm" icon="nav-encounter" onclick={rollEncounter}>Encounter</Button>
        {/if}
        <Button size="sm" variant="outline" icon="d6" onclick={preRollWeather}>
          Pre-roll weather
        </Button>
      </div>
    {:else}
      <div class="text-sm text-gray-600 dark:text-gray-300">
        Roll when traveling to a neighboring hex.
      </div>
    {/if}

    {#if encounter}
      <div class="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h4 class="font-medium">Travel Encounter</h4>
          {#if encounter.intensified}
            <span
              class="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-900 dark:bg-purple-900 dark:text-purple-100"
              >Intensified</span
            >
          {/if}
        </div>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <div class="text-sm text-gray-600 dark:text-gray-300">
              Subject {#if encounter.roadAdjusted}({encounter.subjectRolls.join(', ')} keep lower){/if}
            </div>
            <div class="text-lg font-medium">{encounter.subject}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600 dark:text-gray-300">Activity</div>
            <div class="text-lg font-medium">
              {encounter.activity}{#if encounter.withSubject}: {encounter.withSubject}{/if}
            </div>
          </div>
        </div>
        {#if hasFriendResult() && rollFriend}
          <div class="mt-3">
            <Button size="sm" icon="person" onclick={handleFriendRoll}>Roll Friend</Button>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</Card>
