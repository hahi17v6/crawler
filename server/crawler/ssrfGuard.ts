import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * Checks if an IPv4 address is in private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true;
  }

  const [p1, p2] = parts;

  // 0.0.0.0/8 (This host / default)
  if (p1 === 0) return true;
  // 10.0.0.0/8 (Private network)
  if (p1 === 10) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (p1 === 100 && p2 >= 64 && p2 <= 127) return true;
  // 127.0.0.0/8 (Loopback)
  if (p1 === 127) return true;
  // 169.254.0.0/16 (Link-local / Cloud metadata)
  if (p1 === 169 && p2 === 254) return true;
  // 172.16.0.0/12 (Private network 172.16.0.0 - 172.31.255.255)
  if (p1 === 172 && p2 >= 16 && p2 <= 31) return true;
  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (p1 === 192 && p2 === 0) return true;
  // 192.168.0.0/16 (Private network)
  if (p1 === 192 && p2 === 168) return true;
  // 198.18.0.0/15 (Benchmarking)
  if (p1 === 198 && (p2 === 18 || p2 === 19)) return true;
  // 198.51.100.0/24 (Documentation TEST-NET-2)
  if (p1 === 198 && p2 === 51) return true;
  // 203.0.113.0/24 (Documentation TEST-NET-3)
  if (p1 === 203 && p2 === 0) return true;
  // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
  if (p1 >= 224) return true;

  return false;
}

/**
 * Checks if an IPv6 address is in private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fe80:')) return true; // Link-local
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // Unique local (fc00::/7)
  if (normalized.startsWith('ff')) return true; // Multicast
  if (normalized.startsWith('::ffff:')) {
    // IPv4-mapped IPv6 address
    const ipv4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
  }

  return false;
}

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // Unknown format, treat as unsafe
}

export async function validateUrlForSsrf(targetUrl: string): Promise<{
  safe: boolean;
  urlObj?: URL;
  resolvedIps?: string[];
  error?: string;
}> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch (_err) {
    return { safe: false, error: 'INVALID_URL_FORMAT' };
  }

  // 1. Protocol check: strictly HTTP or HTTPS
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: 'UNSUPPORTED_PROTOCOL: Only HTTP and HTTPS are allowed' };
  }

  // 2. Port check: allow standard ports 80/443 or unassigned
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
    return { safe: false, error: `RESTRICTED_PORT: Custom port ${parsed.port} is blocked for security` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 3. Blacklisted Hostnames & Metadata endpoints
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.includes('metadata') ||
    hostname === '169.254.169.254'
  ) {
    return { safe: false, error: 'RESTRICTED_HOSTNAME: Internal or metadata hostnames are blocked' };
  }

  // 4. Direct IP address check
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { safe: false, error: `RESTRICTED_IP: IP ${hostname} is private or reserved` };
    }
    return { safe: true, urlObj: parsed, resolvedIps: [hostname] };
  }

  // 5. DNS Resolution check
  try {
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return { safe: false, error: 'DNS_LOOKUP_FAILED: Could not resolve hostname' };
    }

    const resolvedIps = addresses.map((a) => a.address);
    for (const ip of resolvedIps) {
      if (isPrivateIp(ip)) {
        return { safe: false, error: `RESTRICTED_RESOLVED_IP: ${hostname} resolved to private IP ${ip}` };
      }
    }

    return { safe: true, urlObj: parsed, resolvedIps };
  } catch (_err) {
    return { safe: false, error: 'DNS_RESOLUTION_ERROR: Domain resolution failed' };
  }
}
