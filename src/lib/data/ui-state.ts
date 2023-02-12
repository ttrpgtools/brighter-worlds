import { lazyFactory } from "./storage";


export const tabManager = lazyFactory<Record<string, number>>('bw-tab-manager', {});
