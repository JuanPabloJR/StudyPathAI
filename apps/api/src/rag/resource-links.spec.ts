import { isWellFormedUrl, isReachable, searchUrlFor, isSearchUrl, validateResourceLinks } from './resource-links';

const res = (status: number) => ({ status } as Response);

describe('resource-links', () => {
  describe('isWellFormedUrl', () => {
    it('acepta URLs http(s) absolutas', () => {
      expect(isWellFormedUrl('https://docs.python.org/es/3/tutorial/')).toBe(true);
      expect(isWellFormedUrl('http://example.com')).toBe(true);
    });

    it('rechaza URLs vacías, relativas, sin dominio o con otros protocolos', () => {
      for (const bad of [null, '', 'docs.python.org', '/tutorial', 'https://localhost', 'javascript:alert(1)', 'ftp://x.com', 'https://a b.com']) {
        expect(isWellFormedUrl(bad)).toBe(false);
      }
    });
  });

  describe('searchUrlFor', () => {
    it('usa YouTube para videos y Google para lo demás', () => {
      expect(searchUrlFor({ title: 'Listas en Python', type: 'VIDEO' }, 'Python'))
        .toBe('https://www.youtube.com/results?search_query=Listas%20en%20Python%20Python');
      expect(searchUrlFor({ title: 'Guía de pandas', type: 'ARTICLE' }, 'Python'))
        .toBe('https://www.google.com/search?q=Gu%C3%ADa%20de%20pandas%20Python');
      expect(isSearchUrl(searchUrlFor({ title: 'x', type: 'BOOK' }, 'y'))).toBe(true);
    });
  });

  describe('isReachable', () => {
    it('acepta 2xx y páginas que bloquean bots (403), rechaza 404 y errores de red', async () => {
      expect(await isReachable('https://a.com', jest.fn().mockResolvedValue(res(200)))).toBe(true);
      expect(await isReachable('https://a.com', jest.fn().mockResolvedValue(res(403)))).toBe(true);
      expect(await isReachable('https://a.com', jest.fn().mockResolvedValue(res(404)))).toBe(false);
      expect(await isReachable('https://a.com', jest.fn().mockRejectedValue(new Error('ENOTFOUND')))).toBe(false);
    });

    it('reintenta con GET cuando el servidor no acepta HEAD', async () => {
      const fetchFn = jest.fn().mockResolvedValueOnce(res(405)).mockResolvedValueOnce(res(200));
      expect(await isReachable('https://a.com', fetchFn)).toBe(true);
      expect(fetchFn.mock.calls[1][1].method).toBe('GET');
    });

    it('valida los videos de YouTube con oEmbed', async () => {
      const fetchFn = jest.fn().mockResolvedValue(res(404));
      expect(await isReachable('https://www.youtube.com/watch?v=inventado', fetchFn)).toBe(false);
      expect(fetchFn.mock.calls[0][0]).toContain('https://www.youtube.com/oembed');
    });
  });

  describe('validateResourceLinks', () => {
    it('conserva los enlaces válidos y reemplaza los rotos o ausentes por una búsqueda', async () => {
      const fetchFn = jest.fn(async (url: string) => res(url.includes('roto') ? 404 : 200));
      const modules = [{
        title: 'M1',
        resources: [
          { title: 'Docs', url: 'https://docs.python.org/', type: 'DOCUMENTATION' },
          { title: 'Roto', url: 'https://ejemplo.com/roto', type: 'ARTICLE' },
          { title: 'Sin URL', url: null, type: 'VIDEO' },
        ],
      }];

      const out = await validateResourceLinks(modules, 'Python', fetchFn);
      const urls = out.modules[0].resources.map((r) => r.url);

      expect(urls[0]).toBe('https://docs.python.org/');
      expect(urls[1]).toContain('https://www.google.com/search?q=Roto');
      expect(urls[2]).toContain('https://www.youtube.com/results?search_query=Sin%20URL');
      expect(out.checked).toBe(2);
      expect(out.replaced).toBe(2);
      expect(out.modules[0].title).toBe('M1');
    });
  });
});
