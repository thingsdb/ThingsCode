export { renderTextWithLinks } from './renderWithLinks';

export const errStr = (err: unknown, fallback: string) => {
  const message = err instanceof Error
    ? err.message
    : typeof err === 'string'
      ? err
      : fallback;
  return message;
};

type Cardinality = '1:1' | '1:N' | 'N:1' | 'N:N';

export function determineCardinality(thisDef: string, targetDef: string): Cardinality {
  const thisIsMany = thisDef.indexOf('{') !== -1;
  const targetIsMany = targetDef.trim().indexOf('{') !== -1;

  if (thisIsMany && targetIsMany) return 'N:N';
  if (thisIsMany && !targetIsMany) return 'N:1';
  if (!thisIsMany && targetIsMany) return '1:N';
  return '1:1';
}

