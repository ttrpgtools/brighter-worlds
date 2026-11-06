import { createAnkhLogoutRedirect } from '$lib/server/ankh';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = createAnkhLogoutRedirect;
