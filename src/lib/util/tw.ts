import { twMerge, type ClassNameValue as TwMergeClassNameValue } from 'tailwind-merge';
import type { ClassValue as TailwindVariantsClassValue } from 'tailwind-variants';

export function cn(...inputs: ClassNameValue[]) {
  return twMerge(...(inputs as TwMergeClassNameValue[]));
}

type ClassNameValue = TwMergeClassNameValue | TailwindVariantsClassValue;

export { type ClassNameValue };
