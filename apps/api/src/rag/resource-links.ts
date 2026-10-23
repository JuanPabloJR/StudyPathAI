/**
 * Validación de los enlaces de recursos que propone el modelo de lenguaje.
 *
 * El LLM puede inventar URLs (rutas inexistentes, videos que no existen). Antes de
 * guardar la ruta se revisa cada enlace: si está mal formado o no responde, se
 * reemplaza por una búsqueda del título del recurso (YouTube para videos, Google
 * para lo demás), de modo que el usuario siempre llega a algo útil.
 */

export interface LinkResource {
  title: string;
  url: string | null;
  type: string;
}

export type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;

const TIMEOUT_MS = 5000;
const SEARCH_HOSTS = ['www.youtube.com/results', 'www.google.com/search'];

/** URL absoluta http(s) con un dominio real (con punto, sin espacios). */
export function isWellFormedUrl(url: unknown): url is string {
  if (typeof url !== 'string' || /\s/.test(url.trim())) return false;
  try {
    const u = new URL(url.trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Enlace de respaldo: búsqueda del título del recurso junto con el tema de la ruta. */
export function searchUrlFor(resource: Pick<LinkResource, 'title' | 'type'>, topic: string): string {
  const q = encodeURIComponent(`${resource.title} ${topic}`.trim());
  return resource.type === 'VIDEO'
    ? `https://www.youtube.com/results?search_query=${q}`
    : `https://www.google.com/search?q=${q}`;
}

export function isSearchUrl(url: string | null): boolean {
  return !!url && SEARCH_HOSTS.some((h) => url.includes(h));
}

function youtubeVideoUrl(url: URL): boolean {
  return (url.hostname.endsWith('youtube.com') && url.pathname === '/watch' && url.searchParams.has('v'))
    || url.hostname === 'youtu.be';
}

async function fetchWithTimeout(fetchFn: FetchFn, url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetchFn(url, { ...init, redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * ¿El enlace lleva a una página que existe?
 * - 2xx/3xx → sí. 401/403/429 → sí (la página existe pero bloquea bots).
 * - 404/410, 5xx, DNS o timeout → no.
 * - Videos de YouTube: YouTube responde 200 aunque el video no exista, así que se
 *   consulta su endpoint oEmbed, que da 4xx para videos inexistentes.
 */
export async function isReachable(url: string, fetchFn: FetchFn = fetch): Promise<boolean> {
  const parsed = new URL(url);
  const target = youtubeVideoUrl(parsed)
    ? `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
    : url;
  const headers = { 'User-Agent': 'Mozilla/5.0 (StudyPathAI link checker)' };

  try {
    let res = await fetchWithTimeout(fetchFn, target, { method: 'HEAD', headers });
    // Algunos servidores no aceptan HEAD; se reintenta con GET.
    if (res.status === 405 || res.status === 501) {
      res = await fetchWithTimeout(fetchFn, target, { method: 'GET', headers });
    }
    return res.status < 400 || [401, 403, 429].includes(res.status);
  } catch {
    return false;
  }
}

/**
 * Revisa en paralelo los enlaces de todos los módulos y reemplaza los rotos o
 * ausentes por una búsqueda. Devuelve los módulos corregidos y un conteo.
 */
export async function validateResourceLinks<M extends { resources: LinkResource[] }>(
  modules: M[],
  topic: string,
  fetchFn: FetchFn = fetch,
): Promise<{ modules: M[]; checked: number; replaced: number }> {
  let checked = 0;
  let replaced = 0;

  const fixed = await Promise.all(modules.map(async (m) => ({
    ...m,
    resources: await Promise.all(m.resources.map(async (r) => {
      const url = typeof r.url === 'string' ? r.url.trim() : r.url;
      if (isWellFormedUrl(url)) {
        checked++;
        if (await isReachable(url, fetchFn)) return { ...r, url };
      }
      replaced++;
      return { ...r, url: searchUrlFor(r, topic) };
    })),
  })));

  return { modules: fixed, checked, replaced };
}
