// Lightweight fetcher for official school vacations from data.gouv.fr
// Attempts to find a dataset mentioning "vacances scolaires" and use a JSON resource if available.

const DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

let cache = { ts: 0, data: null };

async function fetchJson(url) {
  const f = globalThis.fetch || (await import('node-fetch')).default;
  const res = await f(url);
  if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
  return res.json();
}

async function fetchDataGouvDatasets() {
  const q = encodeURIComponent('vacances scolaires calendrier scolaire');
  const url = `https://www.data.gouv.fr/api/1/datasets/?q=${q}&rows=10`;
  return fetchJson(url);
}

async function fetchDatasetBySlug(slug) {
  const url = `https://www.data.gouv.fr/api/1/datasets/${slug}/`;
  return fetchJson(url);
}

function normalizeVacationsFromResource(obj) {
  // Expecting an object mapping years to zones/resources, but datasets vary.
  // Try common shapes: {"2026": {"C": [...]}} or array of {year, zone, start, end}
  if (!obj) return null;
  if (obj.years) return obj.years;
  if (typeof obj === 'object') {
    // If keys are years
    const years = {};
    let foundYear = false;
    Object.keys(obj).forEach(k => {
      if (/^\d{4}$/.test(k)) {
        foundYear = true;
        years[k] = obj[k];
      }
    });
    if (foundYear) return years;
  }
  return null;
}

async function loadOfficialData() {
  // Prefer the official DILA simulateur dataset when available
  try {
    const ds = await fetchDatasetBySlug('simulateur-calendrier-des-vacances-scolaires');
    if (ds && ds.resources) {
      for (const r of ds.resources) {
        const format = (r.format || '').toLowerCase();
        if (format.includes('json') || (r.title && r.title.toLowerCase().includes('donnees')) ) {
          const fetchUrl = r.latest || r.url || r['latest'];
          try {
            const obj = await fetchJson(fetchUrl);
            const years = normalizeVacationsFromResource(obj);
            if (years) {
              return { years, source: { dataset: ds.page || ds.uri || ds.slug, resource: { id: r.id, title: r.title, url: fetchUrl } } };
            }
          } catch (e) {
            // ignore and try other resources
          }
        }
      }
    }
  } catch (e) {
    // ignore errors and fall back to generic search
  }

  // Try the well-known "vacances-scolaires-par-zones" dataset (CSV on GitHub)
  try {
    const ds2 = await fetchDatasetBySlug('vacances-scolaires-par-zones');
    if (ds2 && ds2.resources) {
      for (const r of ds2.resources) {
        const format = (r.format || '').toLowerCase();
        if (format.includes('csv') || (r.url && r.url.includes('raw.githubusercontent.com'))) {
          const csvUrl = r.url;
          const parsed = await fetchAndParseVacancesCsv(csvUrl);
          if (parsed && Object.keys(parsed).length) {
            return { years: parsed, source: { dataset: ds2.page || ds2.uri || ds2.slug, resource: { id: r.id, title: r.title || r.url, url: r.url } } };
          }
        }
      }
    }
  } catch (e) {
    // ignore
  }
  try {
    const datasets = await fetchDataGouvDatasets();
    if (!datasets || !datasets.data) return null;
    for (const ds of datasets.data) {
      if (!ds.resources) continue;
      for (const r of ds.resources) {
        if (!r || !r.url) continue;
        const format = (r.format || '').toLowerCase();
        try {
          if (format.includes('json') || r.url.endsWith('.json')) {
            const obj = await fetchJson(r.url);
            const years = normalizeVacationsFromResource(obj);
            if (years) return { years, source: { dataset: ds.page || ds.uri || ds.slug, resource: { id: r.id, title: r.title, url: r.url } } };
          }
        } catch (e) {
          // ignore resource errors and try others
        }
      }
    }
  } catch (e) {
    // network or parsing errors
  }
  return null;
}

async function fetchAndParseVacancesCsv(url) {
  try {
    const f = globalThis.fetch || (await import('node-fetch')).default;
    const res = await f(url);
    if (!res.ok) throw new Error('CSV fetch failed');
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const header = lines.shift().split(',').map(h => h.trim());
    const idxDate = header.indexOf('date');
    const idxZoneC = header.indexOf('vacances_zone_c');
    const idxName = header.indexOf('nom_vacances');
    if (idxDate === -1 || idxZoneC === -1) return null;

    const years = {};
    for (const line of lines) {
      const cols = line.split(',');
      const date = cols[idxDate];
      const zoneC = (cols[idxZoneC] || '').trim().toLowerCase() === 'true';
      const name = idxName !== -1 ? (cols[idxName] || '').trim() : '';
      if (!date) continue;
      const y = date.slice(0, 4);
      if (!years[y]) years[y] = [];
      years[y].push({ date, zoneC, name });
    }

    // Convert per-day entries to contiguous periods
    const result = {};
    Object.keys(years).forEach((y) => {
      const days = years[y].sort((a, b) => a.date.localeCompare(b.date));
      const periods = [];
      let inPeriod = false;
      let periodStart = null;
      let periodName = '';
      let prevDate = null;
      days.forEach((d) => {
        if (d.zoneC) {
          if (!inPeriod) {
            inPeriod = true;
            periodStart = d.date;
            periodName = d.name || '';
          }
          prevDate = d.date;
        } else {
          if (inPeriod) {
            periods.push({ name: periodName || 'Vacances', start: periodStart, end: prevDate });
            inPeriod = false;
            periodStart = null;
            periodName = '';
            prevDate = null;
          }
        }
      });
      if (inPeriod) periods.push({ name: periodName || 'Vacances', start: periodStart, end: prevDate });
      if (periods.length) result[y] = periods;
    });

    return result;
  } catch (e) {
    return null;
  }
}

async function getOfficialVacations() {
  const now = Date.now();
  if (cache.data && (now - cache.ts) < DEFAULT_CACHE_TTL) return cache.data;
  const data = await loadOfficialData();
  if (data) {
    cache = { ts: now, data };
    return data;
  }
  return null;
}

module.exports = { getOfficialVacations };
