function sanitize(value: string, pattern: RegExp): string {
  return value.replace(pattern, '_').replace(/^_+|_+$/g, '');
}

export function planningFilename(year: number, profileLabel: string): string {
  return `Planing_${year}_${sanitize(profileLabel, /[^a-zA-Z0-9]+/g).toUpperCase()}.xlsx`;
}

export function forecastFilename(startYear: number, profileLabel: string): string {
  return `${sanitize(`Previsionnel_${startYear}_${profileLabel}`, /[^a-zA-Z0-9_]+/g)}.xlsx`;
}
