import { roll } from '$lib/rolling/roll';

export const weatherResults = [
  'Calmest',
  'Calmer',
  'Calm',
  'Intensify',
  'Intensify More',
  'Intensify Most',
];

export function getWeatherModifier(value: number): string {
  return weatherResults[value - 1];
}

class Weather {
  upcoming: number | undefined = $state(undefined);
  upcomingLabel = $derived(this.upcoming == null ? undefined : weatherResults[this.upcoming - 1]);

  preroll() {
    this.upcoming = roll(6);
  }
}

export const weather = new Weather();
