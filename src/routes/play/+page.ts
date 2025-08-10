import type { PageLoad } from './$types';

export const load: PageLoad = async function ({ params, url }) {
  return {
    layout: { showFooter: false, showMenu: false }
  };
};
