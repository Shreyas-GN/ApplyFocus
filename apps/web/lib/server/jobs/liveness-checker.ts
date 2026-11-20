import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { asc, eq } from 'drizzle-orm';

export const CLOSED_SIGNATURES: RegExp[] = [
  /(?:this\s+)?(?:job|position|listing|posting)\s+(?:has\s+expired|is\s+closed|has\s+been\s+closed|has\s+been\s+filled|is\s+no\s+longer\s+available)/i,
  /no\s+longer\s+accepting\s+applications\s+for\s+this\s+(?:job|position|role)/i,
  /the\s+posting\s+you\s+are\s+looking\s+for\s+has\s+been\s+closed/i,
  /the\s+job\s+you\s+are\s+trying\s+to\s+view\s+is\s+no\s+longer\s+available/i,
  /sorry[,\s]+this\s+(?:job|position)\s+has\s+expired/i,
  /this\s+job\s+opening\s+has\s+been\s+filled/i,
  /job-not-found|position-not-found/i,
];

/**
 * Checks whether an IP address belongs to private, loopback, link-local,
 * carrier-grade NAT, cloud metadata, or reserved ranges.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, '').trim().toLowerCase();

  // IPv6 loopback, unspecified, unique local, link-local
  if (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === '0.0.0.0' ||
    clean === '::'
  ) {
    return true;
  }
  if (clean.startsWith('fc') || clean.startsWith('fd')) return true; // Unique local fc00::/7
  if (
    clean.startsWith('fe8') ||
    clean.startsWith('fe9') ||
    clean.startsWith('fea') ||
    clean.startsWith('feb')
  ) {
    return true; // Link-local fe80::/10
  }

  // IPv4 octet check
  const parts = clean.split('.').map(Number);
  if (parts.length === 4 && parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [a, b, c] = parts;
    if (a === 0) return true; // Current network
    if (a === 127) return true; // Loopback (127.0.0.0/8)
    if (a === 10) return true; // RFC 1918 Private (10.0.0.0/8)
    if (a === 169 && b === 254) return true; // Link-local / AWS & Cloud Metadata (169.254.0.0/16)
    if (a === 172 && b !== undefined && b >= 16 && b <= 31) return true; // RFC 1918 Private (172.16.0.0/12)
    if (a === 192 && b === 168) return true; // RFC 1918 Private (192.168.0.0/16)
    if (a === 100 && b !== undefined && b >= 64 && b <= 127) return true; // Carrier-grade NAT (100.64.0.0/10)
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // IETF / TEST-NET-1
    if (a === 198 && b === 51 && c === 100) return true; // TEST-NET-2
    if (a === 203 && b === 0 && c === 113) return true; // TEST-NET-3
    if (a !== undefined && a >= 224) return true; // Multicast & Reserved (224.0.0.0/4 and 240.0.0.0/4)
  }

  return false;
}

export type DnsLookupFn = (
  hostname: string,
  options: dns.LookupAllOptions,
  callback: (err: NodeJS.ErrnoException | null, addresses: dns.LookupAddress[]) => void
) => void;

/**
 * Validates resolved DNS IP addresses before connection establishment.
 * Blocks any domain name whose A/AAAA record resolves to an internal address.
 */
export function safeDnsLookup(
  hostname: string,
  options: dns.LookupAllOptions,
  callback: (err: Error | null, address: string, family: number) => void,
  dnsLookupFn: DnsLookupFn = dns.lookup as DnsLookupFn
): void {
  dnsLookupFn(hostname, { all: true }, (err, addresses) => {
    if (err) return callback(err, '', 0);
    if (!addresses || addresses.length === 0) {
      return callback(new Error(`DNS_EMPTY_RESOLUTION: ${hostname}`), '', 0);
    }
    for (const addr of addresses) {
      if (isPrivateOrReservedIp(addr.address)) {
        return callback(
          new Error(`SSRF_BLOCKED_PRIVATE_IP: ${hostname} resolves to reserved IP ${addr.address}`),
          '',
          0
        );
      }
    }
    callback(null, addresses[0]!.address, addresses[0]!.family);
  });
}

/**
 * Syntactic URL validation (protocol, hostnames, literal IP string format).
 */
export function isSafePublicUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase().trim();
    if (!hostname) return false;

    // Strip IPv6 brackets if present
    const cleanHost = hostname.replace(/^\[|\]$/g, '');

    // Reject localhost, local domain suffixes, and internal cloud metadata hostnames
    if (
      cleanHost === 'localhost' ||
      cleanHost.endsWith('.localhost') ||
      cleanHost.endsWith('.local') ||
      cleanHost.endsWith('.internal') ||
      cleanHost.endsWith('.lan') ||
      cleanHost.endsWith('.home') ||
      cleanHost.endsWith('.corp') ||
      cleanHost === 'instance-data' ||
      cleanHost === 'metadata.google.internal'
    ) {
      return false;
    }

    // Reject raw integer / hex IP evasion attempts (e.g. 2130706433 or 0x7f000001)
    if (/^\d+$/.test(cleanHost) || /^0x[0-9a-f]+$/i.test(cleanHost)) {
      return false;
    }

    // Direct literal IP checks
    if (isPrivateOrReservedIp(cleanHost)) {
      return false;
    }

    // IPv4-mapped IPv6 evasion
    if (cleanHost.includes('ffff:') || cleanHost.includes('::ffff')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function isGenericCareerRootTarget(initialUrl: string, targetUrl: string): boolean {
  try {
    const parsedInitial = new URL(initialUrl);
    const parsedTarget = new URL(targetUrl);
    const originalPath = parsedInitial.pathname.replace(/\/+$/, '').toLowerCase();
    const targetPath = parsedTarget.pathname.replace(/\/+$/, '').toLowerCase();

    if (originalPath === targetPath && parsedInitial.hostname === parsedTarget.hostname) {
      return false;
    }

    const isTargetRootOrGeneric =
      targetPath === '' ||
      targetPath.endsWith('/careers') ||
      targetPath.endsWith('/jobs') ||
      targetPath.endsWith('/career') ||
      targetPath.includes('/not-found') ||
      targetPath.includes('/404') ||
      targetPath.endsWith('/job-not-found') ||
      (originalPath.split('/').filter(Boolean).length > 2 &&
        targetPath.split('/').filter(Boolean).length <= 1);

    return isTargetRootOrGeneric;
  } catch {
    return false;
  }
}

export async function readResponseBodyBounded(
  res: { body?: unknown; text?: () => Promise<string> },
  maxBytes = 102400
): Promise<string> {
  const bodyObj = res.body as { getReader?: () => { read: () => Promise<{ done: boolean; value?: Uint8Array }>; cancel: (r?: string) => Promise<void>; releaseLock: () => void } } | undefined;
  if (bodyObj && typeof bodyObj.getReader === 'function') {
    const reader = bodyObj.getReader();
    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    try {
      while (receivedBytes < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          const remaining = maxBytes - receivedBytes;
          if (value.byteLength > remaining) {
            chunks.push(value.subarray(0, remaining));
            receivedBytes += remaining;
            try {
              await reader.cancel('max_bytes_exceeded');
            } catch {
              // ignore
            }
            break;
          } else {
            chunks.push(value);
            receivedBytes += value.byteLength;
          }
        }
      }
    } catch {
      // If reading fails or stream was cancelled, return what we have
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // ignore
      }
    }

    if (chunks.length > 0) {
      const combined = new Uint8Array(receivedBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return new TextDecoder('utf-8', { fatal: false }).decode(combined);
    }
  }

  if (typeof res.text === 'function') {
    try {
      const full = await res.text();
      return full.slice(0, maxBytes);
    } catch {
      return '';
    }
  }

  return '';
}

export interface SafeHttpResponse {
  status: number;
  headers: {
    get(name: string): string | null;
  };
  text(): Promise<string>;
  body?: unknown;
}

/**
 * Transport-level HTTP client with pinned connection-level DNS validation.
 * Intercepts socket connection creation and ensures destination IP is public.
 * Pinned socket destination prevents DNS rebinding between validation and connection.
 */
export function safeHttpRequest(
  targetUrl: string,
  options?: {
    method?: string;
    headers?: Record<string, string>;
    timeoutMs?: number;
    dnsLookupFn?: DnsLookupFn;
  }
): Promise<SafeHttpResponse> {
  return new Promise((resolve, reject) => {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch (e) {
      return reject(e);
    }

    const isHttps = parsed.protocol === 'https:';
    if (!isHttps && parsed.protocol !== 'http:') {
      return reject(new Error(`UNSUPPORTED_PROTOCOL: ${parsed.protocol}`));
    }

    const lib = isHttps ? https : http;
    const lookupHook = (
      hostname: string,
      lookupOpts: dns.LookupAllOptions,
      cb: (err: Error | null, address: string, family: number) => void
    ) => {
      safeDnsLookup(hostname, lookupOpts, cb, options?.dnsLookupFn);
    };

    // Agent with pinned lookup hook
    const agent = new lib.Agent({
      lookup: lookupHook as unknown as typeof dns.lookup,
    });

    const timeoutMs = options?.timeoutMs ?? 6000;
    const req = lib.request(
      parsed,
      {
        method: options?.method ?? 'GET',
        agent,
        headers: options?.headers ?? {
          'User-Agent': 'ApplyFocus-LivenessChecker/1.0 (+https://applyfocus.com)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let bytesCount = 0;
        const maxBytes = 102400; // 100 KB bounded read

        res.on('data', (chunk: Buffer) => {
          if (bytesCount < maxBytes) {
            chunks.push(chunk);
            bytesCount += chunk.length;
          } else {
            res.destroy(); // Cease buffering once max bytes exceeded
          }
        });

        res.on('end', () => {
          const bodyText = Buffer.concat(chunks).toString('utf-8');
          resolve({
            status: res.statusCode || 200,
            headers: {
              get(name: string) {
                const val = res.headers[name.toLowerCase()];
                return Array.isArray(val) ? val.join(', ') : val || null;
              },
            },
            text: () => Promise.resolve(bodyText),
          });
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy(new Error('REQUEST_TIMEOUT'));
    });

    req.end();
  });
}

export interface LivenessEvaluation {
  isExpired: boolean;
  reason?: string;
  statusCode?: number;
}

export type LivenessFetchFn = (
  url: string,
  options?: RequestInit
) => Promise<{
  status: number;
  headers: { get(name: string): string | null };
  text(): Promise<string>;
  body?: unknown;
}>;

export async function evaluateUrlLiveness(
  initialUrl: string,
  fetchFn?: LivenessFetchFn,
  dnsLookupFn?: DnsLookupFn
): Promise<LivenessEvaluation> {
  let currentUrl = initialUrl;
  let hops = 0;
  const MAX_HOPS = 5;
  const visitedUrls = new Set<string>();

  while (hops < MAX_HOPS) {
    if (!isSafePublicUrl(currentUrl)) {
      return { isExpired: true, reason: 'unsafe_or_invalid_url' };
    }

    if (visitedUrls.has(currentUrl)) {
      return { isExpired: true, reason: 'redirect_loop' };
    }
    visitedUrls.add(currentUrl);

    try {
      const res = fetchFn
        ? await fetchFn(currentUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'ApplyFocus-LivenessChecker/1.0 (+https://applyfocus.com)',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
            redirect: 'manual',
            signal: AbortSignal.timeout(6000),
          })
        : await safeHttpRequest(currentUrl, { timeoutMs: 6000, dnsLookupFn });

      // Handle HTTP redirects (301, 302, 303, 307, 308) with per-hop destination validation
      if (
        res.status === 301 ||
        res.status === 302 ||
        res.status === 303 ||
        res.status === 307 ||
        res.status === 308
      ) {
        const location = res.headers.get('location');
        if (!location) {
          return { isExpired: true, reason: 'redirect_missing_location', statusCode: res.status };
        }

        let nextUrl: string;
        try {
          nextUrl = new URL(location, currentUrl).toString();
        } catch {
          return { isExpired: true, reason: 'invalid_redirect_url', statusCode: res.status };
        }

        // Check if redirect target is a generic career portal root / 404 page
        if (isGenericCareerRootTarget(initialUrl, nextUrl)) {
          return {
            isExpired: true,
            reason: 'redirected_to_career_root',
            statusCode: res.status,
          };
        }

        // Validate next URL destination BEFORE issuing the next hop request (SSRF protection)
        if (!isSafePublicUrl(nextUrl)) {
          return { isExpired: true, reason: 'unsafe_or_invalid_url' };
        }

        currentUrl = nextUrl;
        hops++;
        continue;
      }

      // Terminal HTTP status codes
      if (res.status === 404 || res.status === 410) {
        return { isExpired: true, reason: `http_${res.status}`, statusCode: res.status };
      }

      // Server errors (5xx) or rate limits (429) are transient
      if (res.status >= 500 || res.status === 429) {
        return { isExpired: false, reason: `transient_status_${res.status}`, statusCode: res.status };
      }

      // Read response body incrementally with max 100 KB
      const text = await readResponseBodyBounded(res, 102400);

      // Inspect text for DOM closed signatures
      const isClosed = CLOSED_SIGNATURES.some((sig) => sig.test(text));
      if (isClosed) {
        return { isExpired: true, reason: 'closed_signature_in_body', statusCode: res.status };
      }

      return { isExpired: false, statusCode: res.status };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown';
      if (message.includes('SSRF_BLOCKED') || message.includes('UNSUPPORTED_PROTOCOL')) {
        return { isExpired: true, reason: 'unsafe_or_invalid_url' };
      }
      return {
        isExpired: false,
        reason: `transient_error: ${message}`,
      };
    }
  }

  return { isExpired: true, reason: 'excessive_redirects' };
}

export async function markJobExpired(jobId: string): Promise<void> {
  await db
    .update(jobs)
    .set({ status: 'expired', lastLivenessCheck: new Date() })
    .where(eq(jobs.id, jobId));
}

export async function updateLivenessTimestamp(jobId: string): Promise<void> {
  await db
    .update(jobs)
    .set({ lastLivenessCheck: new Date() })
    .where(eq(jobs.id, jobId));
}

export async function checkJobBatchLiveness(
  batchSize = 50,
  fetchFn?: LivenessFetchFn,
  dnsLookupFn?: DnsLookupFn
): Promise<{ checked: number; expired: number; active: number }> {
  const candidates = await db
    .select({ id: jobs.id, url: jobs.url, source: jobs.source })
    .from(jobs)
    .where(eq(jobs.status, 'active'))
    .orderBy(asc(jobs.lastLivenessCheck))
    .limit(batchSize);

  let expiredCount = 0;
  let activeCount = 0;

  for (const job of candidates) {
    const evaluation = await evaluateUrlLiveness(job.url, fetchFn, dnsLookupFn);
    if (evaluation.isExpired) {
      await markJobExpired(job.id);
      expiredCount++;
    } else {
      await updateLivenessTimestamp(job.id);
      activeCount++;
    }
  }

  return { checked: candidates.length, expired: expiredCount, active: activeCount };
}
