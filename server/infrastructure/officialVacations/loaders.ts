import type { OfficialVacationsData } from '../../domain/vacations';
import { DataGouvClient, datasetLabel } from './DataGouvClient';
import { normalizeYearsFromJson, parseVacationsCsv } from './vacationsParsing';

/** One strategy to obtain official vacations; returns null when it cannot. */
export interface OfficialVacationsLoader {
  load(): Promise<OfficialVacationsData | null>;
}

export class DilaSimulatorLoader implements OfficialVacationsLoader {
  constructor(private readonly client: DataGouvClient) {}

  async load(): Promise<OfficialVacationsData | null> {
    try {
      const dataset = await this.client.fetchDatasetBySlug('simulateur-calendrier-des-vacances-scolaires');
      for (const resource of dataset.resources ?? []) {
        const format = (resource.format || '').toLowerCase();
        const looksLikeData = format.includes('json')
          || (resource.title && resource.title.toLowerCase().includes('donnees'));
        if (!looksLikeData) continue;

        const url = resource.latest || resource.url;
        if (!url) continue;
        try {
          const years = normalizeYearsFromJson(await this.client.fetchJson(url));
          if (years) {
            return { years, source: { dataset: datasetLabel(dataset), resource: { id: resource.id, title: resource.title, url } } };
          }
        } catch {
          // Try the next resource.
        }
      }
    } catch {
      // Fall through to the next strategy.
    }
    return null;
  }
}

export class ZonesCsvLoader implements OfficialVacationsLoader {
  constructor(private readonly client: DataGouvClient) {}

  async load(): Promise<OfficialVacationsData | null> {
    try {
      const dataset = await this.client.fetchDatasetBySlug('vacances-scolaires-par-zones');
      for (const resource of dataset.resources ?? []) {
        const format = (resource.format || '').toLowerCase();
        if (!(format.includes('csv') || (resource.url && resource.url.includes('raw.githubusercontent.com')))) continue;
        if (!resource.url) continue;

        const years = await this.parseCsv(resource.url);
        if (years && Object.keys(years).length) {
          return {
            years,
            source: { dataset: datasetLabel(dataset), resource: { id: resource.id, title: resource.title || resource.url, url: resource.url } },
          };
        }
      }
    } catch {
      // Fall through to the next strategy.
    }
    return null;
  }

  private async parseCsv(url: string) {
    try {
      return parseVacationsCsv(await this.client.fetchText(url));
    } catch {
      return null;
    }
  }
}

export class DatasetSearchLoader implements OfficialVacationsLoader {
  constructor(private readonly client: DataGouvClient) {}

  async load(): Promise<OfficialVacationsData | null> {
    try {
      const result = await this.client.searchDatasets('vacances scolaires calendrier scolaire');
      if (!result || !result.data) return null;

      for (const dataset of result.data) {
        for (const resource of dataset.resources ?? []) {
          if (!resource || !resource.url) continue;
          const format = (resource.format || '').toLowerCase();
          if (!(format.includes('json') || resource.url.endsWith('.json'))) continue;
          try {
            const years = normalizeYearsFromJson(await this.client.fetchJson(resource.url));
            if (years) {
              return {
                years,
                source: { dataset: datasetLabel(dataset), resource: { id: resource.id, title: resource.title, url: resource.url } },
              };
            }
          } catch {
            // Try the next resource.
          }
        }
      }
    } catch {
      // Network or parsing error: no official data.
    }
    return null;
  }
}
