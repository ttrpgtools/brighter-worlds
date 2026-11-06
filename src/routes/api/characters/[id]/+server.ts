import { deleteSheet, getSheet, updateSheet } from '$lib/server/sheet-api';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = getSheet;
export const PUT: RequestHandler = updateSheet;
export const DELETE: RequestHandler = deleteSheet;
