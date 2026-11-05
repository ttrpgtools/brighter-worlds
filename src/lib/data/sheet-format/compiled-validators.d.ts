import type { SheetDocumentV1, SheetBundleV1 } from './types';
import type { BrowserBackupV1 } from './game-data';
export interface ValidationError {
  instancePath?: string;
  message?: string;
}
export type SchemaValidator<T> = ((value: unknown) => value is T) & {
  errors?: ValidationError[] | null;
};
export const validateSheet: SchemaValidator<SheetDocumentV1>;
export const validateBundle: SchemaValidator<SheetBundleV1>;
export const validateGame: SchemaValidator<BrowserBackupV1>;
