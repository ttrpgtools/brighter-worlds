import type { PageLoad } from "./$types";

export const load: PageLoad = async function({params, url}) {
  return {
    id: params.id,
    query: url.search,
    layout: { showFooter: false, showMenu: false }
  };
}
