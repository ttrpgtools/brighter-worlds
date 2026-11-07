import { accountSummary } from '$lib/server/ankh';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = accountSummary;
export const prerender = false;
