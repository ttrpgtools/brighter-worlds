import type { CharacterChoice, EnhancementChoice, EquipmentChoice, LinkedSheetChoice, MagicChoice } from "$lib/types";

export const onlyEquipment = (choice: CharacterChoice): choice is EquipmentChoice => choice.choose === 'equipment';
export const onlyLinked = (choice: CharacterChoice): choice is LinkedSheetChoice => choice.choose === 'linked';
export const onlyEnhancement = (choice: CharacterChoice): choice is EnhancementChoice => choice.choose === 'enhancement';
export const onlyMagic = (choice: CharacterChoice): choice is MagicChoice => choice.choose === 'magic';
