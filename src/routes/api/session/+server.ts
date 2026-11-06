import { accountSummary } from '$lib/server/ankh';
import { json, type RequestHandler } from '@sveltejs/kit';
export const GET: RequestHandler = (event) =>
  json(accountSummary(event), { headers: { 'Cache-Control': 'no-store' } });
