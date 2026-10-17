export interface DatasetResource {
  latest?: string;
  format?: string;
  id?: string;
  title?: string;
  url?: string;
}

export interface Dataset {
  page?: string;
  uri?: string;
  slug?: string;
  resources?: DatasetResource[];
}

export interface DatasetSearchResult {
  data?: Dataset[];
}

type FetchFunction = (url: string) => Promise<Response>;

const DATA_GOUV_API = 'https://www.data.gouv.fr/api/1/datasets';

export class DataGouvClient {
  constructor(private readonly fetchFn: FetchFunction | undefined = globalThis.fetch?.bind(globalThis)) {}

  private async get(url: string): Promise<Response> {
    if (!this.fetchFn) throw new Error('Fetch is not available');
    const response = await this.fetchFn(url);
    if (!response.ok) throw new Error(`Fetch ${url} failed: ${response.status}`);
    return response;
  }

  async fetchJson(url: string): Promise<unknown> {
    return (await this.get(url)).json();
  }

  async fetchText(url: string): Promise<string> {
    return (await this.get(url)).text();
  }

  async fetchDatasetBySlug(slug: string): Promise<Dataset> {
    return (await this.fetchJson(`${DATA_GOUV_API}/${slug}/`)) as Dataset;
  }

  async searchDatasets(query: string): Promise<DatasetSearchResult | null> {
    const url = `${DATA_GOUV_API}/?q=${encodeURIComponent(query)}&rows=10`;
    return (await this.fetchJson(url)) as DatasetSearchResult | null;
  }
}

export function datasetLabel(dataset: Dataset): string | undefined {
  return dataset.page || dataset.uri || dataset.slug;
}
