import type { OfficialVacationsData } from '../../domain/vacations';
import type { OfficialVacationsSource } from '../../ports/OfficialVacationsSource';
import { DataGouvClient } from './DataGouvClient';
import { DatasetSearchLoader, DilaSimulatorLoader, OfficialVacationsLoader, ZonesCsvLoader } from './loaders';

/** Tries each loader in order and returns the first successful result. */
export class ChainedOfficialVacationsSource implements OfficialVacationsSource {
  constructor(private readonly loaders: OfficialVacationsLoader[]) {}

  async getOfficialVacations(): Promise<OfficialVacationsData | null> {
    for (const loader of this.loaders) {
      const data = await loader.load();
      if (data) return data;
    }
    return null;
  }
}

/** Caches successful results of another source for a limited time. */
export class CachedOfficialVacationsSource implements OfficialVacationsSource {
  private cache: { timestamp: number; data: OfficialVacationsData } | null = null;

  constructor(
    private readonly source: OfficialVacationsSource,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  async getOfficialVacations(): Promise<OfficialVacationsData | null> {
    const now = this.now();
    if (this.cache && now - this.cache.timestamp < this.ttlMs) return this.cache.data;

    const data = await this.source.getOfficialVacations();
    if (data) this.cache = { timestamp: now, data };
    return data;
  }
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function createDataGouvOfficialVacationsSource(client = new DataGouvClient()): OfficialVacationsSource {
  return new CachedOfficialVacationsSource(
    new ChainedOfficialVacationsSource([
      new DilaSimulatorLoader(client),
      new ZonesCsvLoader(client),
      new DatasetSearchLoader(client),
    ]),
    ONE_DAY_MS,
  );
}
