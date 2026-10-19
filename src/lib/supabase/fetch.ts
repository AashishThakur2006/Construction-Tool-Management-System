/**
 * fetch with retries for connection-level failures. Some networks reset
 * connections to *.supabase.co intermittently; a request that never got a
 * response is safe to resend, so retry those (not HTTP error responses).
 */
export async function retryFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const attempts = 4;
  let last: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(input, init);
    } catch (e) {
      last = e;
      if (init?.signal?.aborted) throw e;
      await new Promise((r) => setTimeout(r, 250 * 2 ** i));
    }
  }
  throw last;
}
