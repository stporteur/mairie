import type { VacationSource } from '@shared/types/vacations';

export type VacationSourceLabel =
  | { kind: 'estimated'; text: string }
  | { kind: 'local'; text: string }
  | { kind: 'link'; text: string; url: string }
  | { kind: 'text'; text: string };

export function describeVacationSource(source: VacationSource): VacationSourceLabel {
  if (source.estimated) {
    return {
      kind: 'estimated',
      text: source.local
        ? 'données locales complétées par estimation — à vérifier'
        : source.resource
          ? 'données officielles complétées par estimation — à vérifier'
          : 'dates estimées — à vérifier',
    };
  }
  if (source.local) return { kind: 'local', text: 'données locales' };
  if (source.resource && source.resource.url) {
    return { kind: 'link', text: source.resource.title || source.resource.url, url: source.resource.url };
  }
  return { kind: 'text', text: source.dataset || 'source officielle' };
}
