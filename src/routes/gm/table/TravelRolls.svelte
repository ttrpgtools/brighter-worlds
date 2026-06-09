<script lang="ts">
  import { Die } from '$lib/dice';
  import type { DieValue, DiscordEmbed } from '$lib/types';
  import Card from '$lib/ui/card.svelte';
  import Toggle from '$lib/ui/toggle.svelte';
  import type { FriendRollResult } from './friend-state.svelte';
  import {
    d6,
    encounterActivities,
    encounterSubjects,
    isFriendResult,
    rollTravel as getTravelRoll,
    rollTravelSubject,
    type TravelResult,
    type TravelEncounterResult,
    type EncounterInfo,
  } from './hexcrawl';
  import { formatTravelEncounterRoll, formatTravelRoll } from '$lib/util/share';
  import { weather } from './weather.svelte';

  interface Props {
    onlog?: (label: string, result: number, dice?: DieValue[]) => void;
    onembed?: (embed: DiscordEmbed) => void;
    onencounter?: (travel: TravelResult, enc: EncounterInfo) => void;
    rollFriend?: () => Promise<FriendRollResult | undefined>;
  }

  let { onlog, onencounter, onembed, rollFriend }: Props = $props();

  let road = $state(false);

  function encounterContext(travel: TravelResult) {
    if (travel.encounter) return 'Here and now';
    if (travel.activityDie === 1) return 'Recent activity';
    if (travel.activityDie === 2) return 'Nearby activity';
    return '';
  }

  function shouldRollEncounter(travel: TravelResult) {
    return travel.encounter || travel.activityDie === 1 || travel.activityDie === 2;
  }

  async function rollTravel() {
    const travel = getTravelRoll(weather.upcoming);
    weather.upcoming = undefined;

    onembed?.(formatTravelRoll(travel));

    if (travel.activityDie === 3) {
      preRollWeather();
    }

    if (shouldRollEncounter(travel)) {
      await rollEncounter(travel);
    }
  }

  function preRollWeather() {
    weather.preroll();
    if (weather.upcoming) {
      onlog?.(`Prerolled Weather: ${weather.upcomingLabel}`, weather.upcoming, [6]);
    }
  }

  async function rollEncounter(travel: TravelResult) {
    const subject = rollTravelSubject(road);
    const activityDie = d6();
    const withSubjectDie = activityDie === 6 ? d6() : undefined;
    const withSubject = withSubjectDie ? encounterSubjects[withSubjectDie - 1] : undefined;
    const result = isFriendResult(encounterSubjects[subject.value - 1])
      ? (await rollFriend?.())?.friend?.name
      : undefined;
    const withResult = isFriendResult(withSubject)
      ? (await rollFriend?.())?.friend?.name
      : undefined;

    const encounter: TravelEncounterResult = {
      subjectDie: subject.value,
      subjectRolls: subject.rolls,
      activityDie,
      subject: encounterSubjects[subject.value - 1],
      activity: encounterActivities[activityDie - 1],
      intensified: subject.value === activityDie,
      roadAdjusted: subject.roadAdjusted,
      result,
      withSubjectDie,
      withSubject,
      withResult,
    };
    onencounter?.(travel, {
      subject: encounter.subject,
      withSubject: encounter.withSubject ?? '',
      activity: encounter.activity,
      tableRoll: undefined,
      withRoll: undefined,
      intensified: encounter.intensified,
      roadRolls: encounter.subjectRolls,
    });
  }
</script>

<Card>
  {#snippet header()}
    <div class="pr-2">
      <h3 class="text-xl font-subtitle leading-6">Travel Rolls</h3>
    </div>
    <button
      type="button"
      aria-label="Roll travel"
      title="Roll travel"
      onclick={rollTravel}
      class="inline-flex items-center gap-1 rounded-md bg-purple-300 p-1 shadow-sm transition hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-800"
    >
      <Die which={6} size="h-5 w-5" />
      <Die which={6} size="h-5 w-5" />
    </button>
  {/snippet}

  <div class="flex flex-col gap-2">
    <label class="flex items-center justify-between gap-3 text-sm">
      <span>On the road</span>
      <Toggle bind:value={road} />
    </label>
    {#if weather.upcomingLabel}
      <div class="text-xs text-gray-600 dark:text-gray-300">
        Upcoming weather: {weather.upcomingLabel}
      </div>
    {/if}
  </div>
</Card>
