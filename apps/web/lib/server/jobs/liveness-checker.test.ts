import { describe, it, expect, vi } from 'vitest';
import {
  isSafePublicUrl,
  evaluateUrlLiveness,
  readResponseBodyBounded,
  isPrivateOrReservedIp,
  safeDnsLookup,
  safeHttpRequest,
  type DnsLookupFn,
} from './liveness-checker';

describe('Liveness Checker SSRF Protection', () => {
  it('allows valid public HTTP and HTTPS URLs', () => {
    expect(isSafePublicUrl('https://boards.greenhouse.io/stripe/jobs/12345')).toBe(true);
    expect(isSafePublicUrl('https://jobs.lever.co/netflix/67890')).toBe(true);
    expect(isSafePublicUrl('http://example.com/careers/posting')).toBe(true);
  });

  it('blocks localhost and internal domain names', () => {
    expect(isSafePublicUrl('http://localhost:3000/api')).toBe(false);
    expect(isSafePublicUrl('http://test.localhost/jobs')).toBe(false);
    expect(isSafePublicUrl('http://myservice.local/endpoint')).toBe(false);
    expect(isSafePublicUrl('http://backend.internal/cluster')).toBe(false);
    expect(isSafePublicUrl('http://router.lan/admin')).toBe(false);
    expect(isSafePublicUrl('http://server.corp/status')).toBe(false);
  });

  it('blocks cloud metadata endpoints', () => {
    expect(isSafePublicUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
    expect(isSafePublicUrl('http://metadata.google.internal/computeMetadata/v1/')).toBe(false);
    expect(isSafePublicUrl('http://instance-data/latest/')).toBe(false);
  });

  it('blocks private IPv4 addresses and numeric evasions', () => {
    expect(isSafePublicUrl('http://127.0.0.1:8080/debug')).toBe(false);
    expect(isSafePublicUrl('http://10.0.1.25/admin')).toBe(false);
    expect(isSafePublicUrl('http://192.168.1.1/router')).toBe(false);
    expect(isSafePublicUrl('http://172.16.0.5/api')).toBe(false);
    expect(isSafePublicUrl('http://172.31.255.255/api')).toBe(false);
    expect(isSafePublicUrl('http://100.64.0.1/')).toBe(false); // Carrier-grade NAT
    expect(isSafePublicUrl('http://0.0.0.0:8000/')).toBe(false);
    // Decimal / hex integer evasion
    expect(isSafePublicUrl('http://2130706433/')).toBe(false); // 127.0.0.1 as dword
    expect(isSafePublicUrl('http://0x7f000001/')).toBe(false);
  });

  it('blocks IPv6 loopback, link-local, and IPv4-mapped IPv6', () => {
    expect(isSafePublicUrl('http://[::1]/')).toBe(false);
    expect(isSafePublicUrl('http://[::]/')).toBe(false);
    expect(isSafePublicUrl('http://[fe80::1]/')).toBe(false);
    expect(isSafePublicUrl('http://[fc00::1]/')).toBe(false);
    expect(isSafePublicUrl('http://[::ffff:127.0.0.1]/')).toBe(false);
    expect(isSafePublicUrl('http://[::ffff:169.254.169.254]/')).toBe(false);
  });

  it('blocks non-HTTP protocols', () => {
    expect(isSafePublicUrl('file:///etc/passwd')).toBe(false);
    expect(isSafePublicUrl('ftp://ftp.example.com/jobs')).toBe(false);
    expect(isSafePublicUrl('javascript:alert(1)')).toBe(false);
    expect(isSafePublicUrl('data:text/html,<h1>hi</h1>')).toBe(false);
  });
});

describe('evaluateUrlLiveness — Manual Redirect & SSRF Protection', () => {
  it('marks unsafe/SSRF URLs as expired immediately without fetching', async () => {
    const mockFetch = vi.fn();
    const result = await evaluateUrlLiveness('http://127.0.0.1/admin', mockFetch);
    expect(result.isExpired).toBe(true);
    expect(result.reason).toBe('unsafe_or_invalid_url');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('intercepts redirect to internal metadata endpoint (H-02 SSRF redirect prevention)', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://example.com/jobs/123') {
        return Promise.resolve({
          status: 302,
          headers: new Headers({
            location: 'http://169.254.169.254/latest/meta-data/',
          }),
        });
      }
      return Promise.resolve({ status: 200, text: () => Promise.resolve('') });
    });

    const result = await evaluateUrlLiveness('https://example.com/jobs/123', mockFetch);
    expect(result.isExpired).toBe(true);
    expect(result.reason).toBe('unsafe_or_invalid_url');
    // Verifies that fetch was never called with the metadata address
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://example.com/jobs/123', expect.any(Object));
  });

  it('detects redirect loops', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://example.com/a') {
        return Promise.resolve({
          status: 302,
          headers: new Headers({ location: 'https://example.com/b' }),
        });
      }
      return Promise.resolve({
        status: 302,
        headers: new Headers({ location: 'https://example.com/a' }),
      });
    });

    const result = await evaluateUrlLiveness('https://example.com/a', mockFetch);
    expect(result.isExpired).toBe(true);
    expect(result.reason).toBe('redirect_loop');
  });

  it('detects excessive redirects exceeding max hops', async () => {
    let hop = 0;
    const mockFetch = vi.fn().mockImplementation(() => {
      hop++;
      return Promise.resolve({
        status: 302,
        headers: new Headers({ location: `https://example.com/hop-${hop}` }),
      });
    });

    const result = await evaluateUrlLiveness('https://example.com/start', mockFetch);
    expect(result.isExpired).toBe(true);
    expect(result.reason).toBe('excessive_redirects');
  });

  it('detects redirects to generic career portal or not-found root', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://boards.greenhouse.io/stripe/jobs/old-job-id-1234') {
        return Promise.resolve({
          status: 302,
          headers: new Headers({ location: 'https://boards.greenhouse.io/stripe/careers' }),
        });
      }
      return Promise.resolve({ status: 200, text: () => Promise.resolve('') });
    });

    const result = await evaluateUrlLiveness(
      'https://boards.greenhouse.io/stripe/jobs/old-job-id-1234',
      mockFetch
    );
    expect(result.isExpired).toBe(true);
    expect(result.reason).toBe('redirected_to_career_root');
  });

  it('marks HTTP 404 and 410 as expired', async () => {
    const mockFetch404 = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    });
    const res404 = await evaluateUrlLiveness('https://boards.greenhouse.io/stripe/jobs/99999', mockFetch404);
    expect(res404.isExpired).toBe(true);
    expect(res404.reason).toBe('http_404');

    const mockFetch410 = vi.fn().mockResolvedValue({
      status: 410,
      ok: false,
    });
    const res410 = await evaluateUrlLiveness('https://jobs.lever.co/company/abc', mockFetch410);
    expect(res410.isExpired).toBe(true);
    expect(res410.reason).toBe('http_410');
  });

  it('treats 500 server error and network timeouts as transient', async () => {
    const mockFetch500 = vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
    });
    const res500 = await evaluateUrlLiveness('https://boards.greenhouse.io/stripe/jobs/123', mockFetch500);
    expect(res500.isExpired).toBe(false);
    expect(res500.reason).toContain('transient_status_500');

    const mockFetchTimeout = vi.fn().mockRejectedValue(new Error('Connection timed out'));
    const resTimeout = await evaluateUrlLiveness('https://boards.greenhouse.io/stripe/jobs/123', mockFetchTimeout);
    expect(resTimeout.isExpired).toBe(false);
    expect(resTimeout.reason).toContain('transient_error');
  });

  it('detects refined closed signatures in HTML body (L-02)', async () => {
    const signaturesToTest = [
      'Sorry, this job has expired.',
      'Thank you for your interest, this position is no longer available.',
      'The posting you are looking for has been closed.',
      'We are no longer accepting applications for this role.',
      'This job opening has been filled.',
      'This job posting is closed.',
    ];

    for (const textSample of signaturesToTest) {
      const mockFetch = vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        text: vi.fn().mockResolvedValue(`<div>${textSample}</div>`),
      });

      const result = await evaluateUrlLiveness(
        'https://boards.greenhouse.io/stripe/jobs/1234',
        mockFetch
      );
      expect(result.isExpired).toBe(true);
      expect(result.reason).toBe('closed_signature_in_body');
    }
  });

  it('marks active listing as not expired when job is healthy', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: vi.fn().mockResolvedValue('<html><h1>Staff Software Engineer</h1><button>Apply</button></html>'),
    });

    const result = await evaluateUrlLiveness(
      'https://boards.greenhouse.io/stripe/jobs/1234',
      mockFetch
    );
    expect(result.isExpired).toBe(false);
    expect(result.statusCode).toBe(200);
  });
});

describe('readResponseBodyBounded — Stream Memory Limits (M-03)', () => {
  it('truncates oversized streams at maxBytes without buffering full payload', async () => {
    let cancelCalled = false;
    let chunksRead = 0;

    // Simulate an oversized stream that yields 64KB chunks
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        chunksRead++;
        return Promise.resolve({
          done: false,
          value: new Uint8Array(65536).fill(65), // 'A'
        });
      }),
      cancel: vi.fn().mockImplementation(() => {
        cancelCalled = true;
        return Promise.resolve();
      }),
      releaseLock: vi.fn(),
    };

    const mockResponse = {
      body: {
        getReader: () => mockReader,
      },
    } as unknown as Response;

    const result = await readResponseBodyBounded(mockResponse, 102400); // 100 KB
    expect(result.length).toBe(102400);
    expect(cancelCalled).toBe(true);
    expect(chunksRead).toBeGreaterThan(0);
    expect(mockReader.releaseLock).toHaveBeenCalled();
  });
});

describe('Connection-Level DNS Validation & Anti-Rebinding (H-02 Final Fix)', () => {
  it('isPrivateOrReservedIp correctly classifies public vs private IPv4 and IPv6', () => {
    // Public IPs
    expect(isPrivateOrReservedIp('93.184.216.34')).toBe(false);
    expect(isPrivateOrReservedIp('142.250.190.46')).toBe(false);
    expect(isPrivateOrReservedIp('2607:f8b0:4005:805::200e')).toBe(false);

    // Private IPv4
    expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('172.31.255.254')).toBe(true);
    expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true); // AWS Metadata
    expect(isPrivateOrReservedIp('100.64.0.1')).toBe(true); // Carrier-grade NAT
    expect(isPrivateOrReservedIp('224.0.0.1')).toBe(true); // Multicast

    // Private IPv6
    expect(isPrivateOrReservedIp('::1')).toBe(true);
    expect(isPrivateOrReservedIp('fc00::1')).toBe(true); // ULA
    expect(isPrivateOrReservedIp('fd12:3456::1')).toBe(true);
    expect(isPrivateOrReservedIp('fe80::1')).toBe(true); // Link-local
    expect(isPrivateOrReservedIp('::ffff:127.0.0.1')).toBe(true);
  });

  it('safeDnsLookup allows public resolved IP addresses', () => {
    const mockLookup: DnsLookupFn = (_hostname, _opts, cb) => {
      cb(null, [{ address: '93.184.216.34', family: 4 }]);
    };

    let resolvedAddress = '';
    safeDnsLookup('example.com', { all: true }, (err, addr) => {
      expect(err).toBeNull();
      resolvedAddress = addr;
    }, mockLookup);

    expect(resolvedAddress).toBe('93.184.216.34');
  });

  it('safeDnsLookup blocks hostnames resolving to private or metadata IPs', () => {
    const mockLookup: DnsLookupFn = (_hostname, _opts, cb) => {
      cb(null, [{ address: '169.254.169.254', family: 4 }]);
    };

    let caughtError: Error | null = null;
    safeDnsLookup('169.254.169.254.nip.io', { all: true }, (err) => {
      caughtError = err;
    }, mockLookup);

    expect(caughtError).not.toBeNull();
    const errObj = caughtError as unknown as Error;
    expect(errObj.message).toContain('SSRF_BLOCKED_PRIVATE_IP');
    expect(errObj.message).toContain('169.254.169.254');
  });

  it('blocks dynamic DNS and DNS rebinding attacks at the transport level', async () => {
    // Simulates an attacker domain resolving to a private IP during connection establishment
    const rebindingDns: DnsLookupFn = (_hostname, _opts, cb) => {
      cb(null, [{ address: '127.0.0.1', family: 4 }]);
    };

    await expect(
      safeHttpRequest('http://rebinding-attack.com/admin', {
        dnsLookupFn: rebindingDns,
      })
    ).rejects.toThrow(/SSRF_BLOCKED_PRIVATE_IP.*127\.0\.0\.1/);
  });

  it('evaluateUrlLiveness halts and marks expired when connection-level lookup detects SSRF', async () => {
    const metadataDns: DnsLookupFn = (_hostname, _opts, cb) => {
      cb(null, [{ address: '169.254.169.254', family: 4 }]);
    };

    const result = await evaluateUrlLiveness(
      'http://attacker-cloud-probe.com/job',
      undefined,
      metadataDns
    );

    expect(result.isExpired).toBe(true);
    expect(result.reason).toBe('unsafe_or_invalid_url');
  });
});
