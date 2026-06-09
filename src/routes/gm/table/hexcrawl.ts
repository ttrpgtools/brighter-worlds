import { roll } from '$lib/rolling/roll';
import type { RolltableOption, TableRoll } from '$lib/types';
import { weatherResults } from './weather.svelte';

export const hexActivity = [
  'Recent activity',
  'Nearby activity',
  'Weather on the horizon',
  'Local normality',
  'Local normality',
  'Local weirdness',
];

export const encounterSubjects = [
  'Friend!',
  'Friend!',
  'Local Quest',
  'A Local',
  'Wildlife or a Local',
  'Wildlife',
];

export const encounterActivities = [
  'Traveling',
  'Hanging Out',
  'In Trouble',
  'Working',
  'Special',
  'With...',
];

export interface TravelResult {
  weatherDie: number;
  activityDie: number;
  encounter: boolean;
  weather: string;
  hexActivity: string;
  usedPreRolledWeather: boolean;
}

export interface TravelSubjectRoll {
  value: number;
  rolls: number[];
  roadAdjusted: boolean;
}

export interface TravelEncounterResult {
  subjectDie?: number;
  subjectRolls: number[];
  activityDie: number;
  subject: string;
  activity: string;
  intensified: boolean;
  roadAdjusted: boolean;
  result?: string;
  withSubjectDie?: number;
  withSubject?: string;
  withResult?: string;
}

export type EncounterInfo = {
  subject: string;
  withSubject: string;
  tableRoll: TableRoll<RolltableOption> | undefined;
  withRoll: TableRoll<RolltableOption> | undefined;
  activity: string;
  intensified: boolean;
  roadRolls?: number[];
};

export function d6() {
  return roll(6);
}

export function rollTravel(preRolledWeather?: number): TravelResult {
  const weatherDie = preRolledWeather ?? d6();
  const activityDie = d6();
  return {
    weatherDie,
    activityDie,
    encounter: weatherDie === activityDie,
    weather: weatherResults[weatherDie - 1],
    hexActivity: hexActivity[activityDie - 1],
    usedPreRolledWeather: preRolledWeather != null,
  };
}

export function rollTravelSubject(road: boolean): TravelSubjectRoll {
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

export function isFriendResult(value: string | undefined) {
  return value?.trim().toLowerCase() === 'friend!';
}
