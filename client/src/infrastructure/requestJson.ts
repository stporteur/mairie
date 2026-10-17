/** Calls the JSON API and turns an error response into an Error carrying the server's message. */
export async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? `Erreur HTTP: ${response.status}`);
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export function jsonBody(method: 'POST' | 'PUT',  payload: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) };
}
