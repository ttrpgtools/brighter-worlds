import { createSheet, listSheets } from '$lib/server/sheet-api';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = listSheets;
export const POST: RequestHandler = createSheet;
