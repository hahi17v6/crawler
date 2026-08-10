export interface ParsedHtml {
  title: string | null;
  metaRobots: string | null;
  canonical: string | null;
  internalLinks: string[];
  externalLinks: string[];
  jsRenderedLikely: boolean;
  bodyTextLength: number;
}

export function parseHtml(html: string, baseUrl: string): ParsedHtml {
  let baseHost = '';
  try {
    const baseObj = new URL(baseUrl);
    baseHost = baseObj.hostname.toLowerCase();
  } catch (_e) {
    baseHost = '';
  }

  // 1. Extract <title>
  let title: string | null = null;
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    title = cleanText(titleMatch[1]);
  }

  // 2. Extract <meta name="robots" ...> or name="googlebot"
  let metaRobots: string | null = null;
  const metaRobotsRegex = /<meta\s+[^>]*name=["'](robots|googlebot)["'][^>]*content=["']([^"']+)["']/i;
  const metaRobotsAltRegex = /<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["'](robots|googlebot)["']/i;

  let mMatch = html.match(metaRobotsRegex);
  if (mMatch) {
    metaRobots = mMatch[2].trim();
  } else {
    mMatch = html.match(metaRobotsAltRegex);
    if (mMatch) metaRobots = mMatch[1].trim();
  }

  // 3. Extract <link rel="canonical" href="...">
  let canonical: string | null = null;
  const canonicalRegex = /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i;
  const canonicalAltRegex = /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i;

  let cMatch = html.match(canonicalRegex);
  if (cMatch) {
    canonical = cMatch[1].trim();
  } else {
    cMatch = html.match(canonicalAltRegex);
    if (cMatch) canonical = cMatch[1].trim();
  }

  // 4. Extract links <a href="...">
  const internalLinksSet = new Set<string>();
  const externalLinksSet = new Set<string>();

  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    if (
      !rawHref ||
      rawHref.startsWith('#') ||
      rawHref.startsWith('javascript:') ||
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:')
    ) {
      continue;
    }

    try {
      const resolved = new URL(rawHref, baseUrl);
      resolved.hash = '';

      if (baseHost && resolved.hostname.toLowerCase() === baseHost) {
        internalLinksSet.add(resolved.href);
      } else {
        externalLinksSet.add(resolved.href);
      }
    } catch (_e) {
      // Ignore invalid link URLs
    }
  }

  // 5. JS-Rendered content presence detection
  const scriptTagsCount = (html.match(/<script[^>]*>/gi) || []).length;
  const cleanBody = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ');
  const bodyTextLength = cleanText(cleanBody).length;

  const hasEmptyRoot =
    /<div\s+id=["'](root|app|__next|svelte|__nuxt)["'][^>]*>\s*<\/div>/i.test(html);

  const jsRenderedLikely = hasEmptyRoot || (bodyTextLength < 150 && scriptTagsCount >= 2);

  return {
    title,
    metaRobots,
    canonical,
    internalLinks: Array.from(internalLinksSet),
    externalLinks: Array.from(externalLinksSet),
    jsRenderedLikely,
    bodyTextLength,
  };
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}
