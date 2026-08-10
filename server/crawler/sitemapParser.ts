export interface ParsedSitemap {
  exists: boolean;
  url: string;
  status: number;
  type: 'urlset' | 'sitemapindex' | 'unknown';
  urlsFoundCount: number;
  sampleUrls: string[];
  nestedSitemaps: string[];
  errors: string[];
}

export function parseSitemapXml(sitemapUrl: string, status: number, body: string): ParsedSitemap {
  if (status !== 200 || !body.trim()) {
    return {
      exists: false,
      url: sitemapUrl,
      status,
      type: 'unknown',
      urlsFoundCount: 0,
      sampleUrls: [],
      nestedSitemaps: [],
      errors: [`HTTP status ${status} or empty response`],
    };
  }

  const errors: string[] = [];
  const urlsSet = new Set<string>();
  const nestedSet = new Set<string>();

  const isIndex = body.includes('<sitemapindex') || body.includes('<sitemap>');
  const isUrlset = body.includes('<urlset') || body.includes('<url>');

  const type = isIndex ? 'sitemapindex' : isUrlset ? 'urlset' : 'unknown';

  if (isIndex) {
    const locRegex = /<sitemap>[\s\S]*?<loc>\s*(.*?)\s*<\/loc>[\s\S]*?<\/sitemap>/gi;
    let match: RegExpExecArray | null;
    while ((match = locRegex.exec(body)) !== null) {
      if (match[1]) nestedSet.add(match[1].trim());
    }
  }

  // Extract <loc> tags inside <url>
  const urlLocRegex = /<url>[\s\S]*?<loc>\s*(.*?)\s*<\/loc>[\s\S]*?<\/url>/gi;
  let uMatch: RegExpExecArray | null;
  while ((uMatch = urlLocRegex.exec(body)) !== null) {
    if (uMatch[1]) {
      try {
        const parsedUrl = new URL(uMatch[1].trim());
        urlsSet.add(parsedUrl.href);
      } catch (_e) {
        // Ignore malformed loc
      }
    }
  }

  // Fallback if tags weren't caught by strict regex
  if (urlsSet.size === 0 && nestedSet.size === 0 && body.includes('<loc>')) {
    const simpleLoc = /<loc>\s*(.*?)\s*<\/loc>/gi;
    let lMatch: RegExpExecArray | null;
    while ((lMatch = simpleLoc.exec(body)) !== null) {
      if (lMatch[1]) {
        try {
          const parsed = new URL(lMatch[1].trim());
          if (parsed.pathname.endsWith('.xml')) {
            nestedSet.add(parsed.href);
          } else {
            urlsSet.add(parsed.href);
          }
        } catch (_e) {}
      }
    }
  }

  const sampleUrls = Array.from(urlsSet).slice(0, 10);
  const nestedSitemaps = Array.from(nestedSet).slice(0, 5);

  return {
    exists: true,
    url: sitemapUrl,
    status,
    type,
    urlsFoundCount: urlsSet.size,
    sampleUrls,
    nestedSitemaps,
    errors,
  };
}
