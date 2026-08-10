import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import { validateUrlForSsrf, isPrivateIp } from './ssrfGuard';

export interface SafeFetchOptions {
  maxRedirects?: number;
  timeoutMs?: number;
  maxSizeBytes?: number;
  userAgent?: string;
}

export interface SafeFetchResult {
  status: number;
  finalUrl: string;
  redirects: string[];
  headers: Record<string, string>;
  body: string;
  contentType: string;
  contentLength: number;
  truncated: boolean;
}

const DEFAULT_USER_AGENT = 'CrawlSignalBot/1.0 (+https://crawlsignal.com/bot)';

export async function safeFetch(
  initialUrl: string,
  options: SafeFetchOptions = {}
): Promise<SafeFetchResult> {
  const maxRedirects = options.maxRedirects ?? 5;
  const timeoutMs = options.timeoutMs ?? 6000;
  const maxSizeBytes = options.maxSizeBytes ?? 2 * 1024 * 1024; // 2MB limit
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;

  let currentUrl = initialUrl;
  const redirects: string[] = [];
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // SSRF re-validation for current URL (and after each redirect)
    const validation = await validateUrlForSsrf(currentUrl);
    if (!validation.safe || !validation.urlObj) {
      throw new Error(`SSRF_BLOCKED: ${validation.error || 'Access denied'} for URL ${currentUrl}`);
    }

    const urlObj = validation.urlObj;
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestResult = await new Promise<SafeFetchResult>((resolve, reject) => {
      let isTimedOut = false;
      const reqOptions: http.RequestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,es;q=0.7',
          'Connection': 'close',
        },
        lookup: (hostname, lookupOpts, cb) => {
          dns.lookup(hostname, lookupOpts as any, (err, address, family) => {
            if (err) return cb(err, address as any, family as any);
            const resolvedList = Array.isArray(address)
              ? address
              : [{ address: address as string, family: family as number }];

            for (const item of resolvedList) {
              if (item?.address && isPrivateIp(item.address)) {
                return cb(
                  new Error(`SSRF_DNS_REBIND_BLOCKED: Resolved private IP ${item.address} during connection to ${hostname}`),
                  '' as any,
                  4
                );
              }
            }
            cb(null, address as any, family as any);
          });
        },
      };

      const req = client.request(reqOptions, (res) => {

        const statusCode = res.statusCode || 500;
        const location = res.headers.location;

        // Redirect handling (301, 302, 303, 307, 308)
        if ([301, 302, 303, 307, 308].includes(statusCode) && location) {
          req.destroy();
          try {
            const nextUrl = new URL(location, currentUrl).href;
            resolve({
              status: statusCode,
              finalUrl: nextUrl,
              redirects: [],
              headers: normalizeHeaders(res.headers),
              body: '',
              contentType: (res.headers['content-type'] || '').toString(),
              contentLength: 0,
              truncated: false,
            });
            return;
          } catch (_e) {
            reject(new Error(`INVALID_REDIRECT_LOCATION: ${location}`));
            return;
          }
        }

        let body = '';
        let totalBytes = 0;
        let truncated = false;

        res.setEncoding('utf8');

        res.on('data', (chunk: string) => {
          totalBytes += Buffer.byteLength(chunk, 'utf8');
          if (totalBytes > maxSizeBytes) {
            truncated = true;
            req.destroy();
            resolve({
              status: statusCode,
              finalUrl: currentUrl,
              redirects,
              headers: normalizeHeaders(res.headers),
              body,
              contentType: (res.headers['content-type'] || '').toString(),
              contentLength: totalBytes,
              truncated: true,
            });
            return;
          }
          body += chunk;
        });

        res.on('end', () => {
          if (!isTimedOut && !truncated) {
            resolve({
              status: statusCode,
              finalUrl: currentUrl,
              redirects,
              headers: normalizeHeaders(res.headers),
              body,
              contentType: (res.headers['content-type'] || '').toString(),
              contentLength: totalBytes,
              truncated: false,
            });
          }
        });

        res.on('error', (err) => {
          reject(err);
        });
      });

      req.setTimeout(timeoutMs, () => {
        isTimedOut = true;
        req.destroy();
        reject(new Error(`FETCH_TIMEOUT: Request to ${currentUrl} timed out after ${timeoutMs}ms`));
      });

      req.on('error', (err) => {
        if (!isTimedOut) {
          reject(err);
        }
      });

      req.end();
    });

    if (
      [301, 302, 303, 307, 308].includes(requestResult.status) &&
      requestResult.finalUrl !== currentUrl
    ) {
      redirects.push(currentUrl);
      currentUrl = requestResult.finalUrl;
      redirectCount++;
    } else {
      requestResult.redirects = redirects;
      return requestResult;
    }
  }

  throw new Error(`TOO_MANY_REDIRECTS: Exceeded max redirects (${maxRedirects}) starting at ${initialUrl}`);
}

function normalizeHeaders(rawHeaders: http.IncomingHttpHeaders): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(rawHeaders)) {
    if (Array.isArray(val)) {
      result[key.toLowerCase()] = val.join(', ');
    } else if (val) {
      result[key.toLowerCase()] = val;
    }
  }
  return result;
}
