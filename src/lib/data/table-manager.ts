import tables from '$data/tables.json';
import type { CallingEnhancements } from '../types';
import { JsonDataManager } from './base-manager';

const tableList = tables as CallingEnhancements[];

class CallingEnhancementManager extends JsonDataManager<CallingEnhancements> {

}

export const enhancementManager = new CallingEnhancementManager(tableList);
