import { createAnkhRedirect } from '$lib/server/ankh';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = (event) => createAnkhRedirect(event, 'signup');
