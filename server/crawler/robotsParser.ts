export interface ParsedRobots {
  exists: boolean;
  url: string;
  status: number;
  sitemaps: string[];
  disallowedPaths: string[];
  contentSnippet?: string;
  disallowsAll: boolean;
}

export function parseRobotsTxt(robotsUrl: string, status: number, body: string): ParsedRobots {
  if (status !== 200 || !body.trim()) {
    return {
      exists: false,
      url: robotsUrl,
      status,
      sitemaps: [],
      disallowedPaths: [],
      disallowsAll: false,
    };
  }

  const lines = body.split(/\r?\n/);
  const sitemaps: string[] = [];
  const disallowedPaths: string[] = [];

  let isTargetUserAgent = true;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const parts = line.split(':');
    if (parts.length < 2) continue;

    const directive = parts[0].trim().toLowerCase();
    const value = parts.slice(1).join(':').trim();

    if (directive === 'user-agent') {
      const ua = value.toLowerCase();
      isTargetUserAgent = ua === '*' || ua.includes('googlebot') || ua.includes('crawlsignal');
    } else if (directive === 'sitemap') {
      if (value) {
        try {
          const validSitemap = new URL(value, robotsUrl).href;
          if (!sitemaps.includes(validSitemap)) {
            sitemaps.push(validSitemap);
          }
        } catch (_e) {
          // Ignore invalid sitemap URL
        }
      }
    } else if (directive === 'disallow' && isTargetUserAgent) {
      if (value) {
        disallowedPaths.push(value);
      }
    }
  }

  const disallowsAll = disallowedPaths.some((p) => p === '/' || p === '/*');

  return {
    exists: true,
    url: robotsUrl,
    status,
    sitemaps,
    disallowedPaths,
    disallowsAll,
    contentSnippet: body.slice(0, 1000),
  };
}
