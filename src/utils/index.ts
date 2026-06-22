import type { Cardinality } from '../types';

export { renderTextWithLinks } from './renderWithLinks';

export const errStr = (err: unknown, fallback: string) => {
  const message = err instanceof Error
    ? err.message
    : typeof err === 'string'
      ? err
      : fallback;
  return message;
};

export function determineCardinality(thisDef: string, targetDef: string | undefined): Cardinality {
  if (targetDef === undefined) {
    return (thisDef.includes('{') || thisDef.includes('[') || thisDef.includes('thing<')) ? 'N:0' : '1:0';
  }
  const thisIsMany = thisDef.endsWith('}');
  const targetIsMany = targetDef.endsWith('}');

  if (thisIsMany && targetIsMany) return 'N:N';
  if (thisIsMany && !targetIsMany) return 'N:1';
  if (!thisIsMany && targetIsMany) return '1:N';
  return '1:1';
}

export function isDialogOpen() {
  const radixDialogExists = document.querySelector('[data-state="open"][class*="DialogContent"]');
  const radixOverlayExists = document.querySelector('[class*="DialogOverlay"]');
  return radixDialogExists || radixOverlayExists;
}
