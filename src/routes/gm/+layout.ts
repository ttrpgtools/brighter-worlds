import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async function() {
  return {
    layout: { showFooter: false }
  };
}
