import type { PageLoad } from "./$types";

export const load: PageLoad = async function() {
  return {
    layout: { showFooter: false, showMenu: false }
  };
}

export const ssr = false;
