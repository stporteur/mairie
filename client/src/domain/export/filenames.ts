function sanitize(value: string, pattern: RegExp): string {
  return value.replace(pattern, '_').replace(/^_+|_+$/g, '');
}

export function planningFilename(year: number, profileLabel: string, extension: 'xlsx' | 'pdf' = 'xlsx'): string {
  return `Planing_${year}_${sanitize(profileLabel, /[^a-zA-Z0-9]+/g).toUpperCase()}.${extension}`;
}

export function forecastFilename(startYear: number, profileLabel: string, extension: 'xlsx' | 'pdf' = 'xlsx'): string {
  return `${sanitize(`Previsionnel_${startYear}_${profileLabel}`, /[^a-zA-Z0-9_]+/g)}.${extension}`;
}

export function forecastComparisonFilename(startYear: number, extension: 'xlsx' | 'pdf' = 'xlsx'): string {
  return `Comparatif_${startYear}.${extension}`;
}
