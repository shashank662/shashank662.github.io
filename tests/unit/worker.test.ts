import { afterEach, describe, expect, it, vi } from 'vitest';
import worker, { handleFeedback, type Env } from '../../worker/index';

const SITE = 'https://shashank662.github.io';
const good = { type: 'idea', message: 'A dark mode for the résumé?', page: '/', screen: 'laptop', theme: 'dark', token: 'ok-token' };

const env = (extra: Partial<Env> = {}): Env => ({
  ASSETS: { fetch: async () => new Response('site') },
  GITHUB_TOKEN: 'gh-secret',
  TURNSTILE_SECRET: 'ts-secret',
  ...extra,
});

const post = (body: unknown, origin = SITE) =>
  new Request('https://portfolio.example.workers.dev/api/feedback', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.9' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

/** Stands in for Turnstile and GitHub, and keeps every call it gets. */
function outside({ person = true, github = 201 } = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('turnstile')) return Response.json({ success: person });
    return Response.json({ number: 12, html_url: 'https://github.com/shashank662/shashank662.github.io/issues/12' }, { status: github });
  });
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('POST /api/feedback', () => {
  it('checks the visitor with Turnstile, opens the issue, and returns its link', async () => {
    const calls = outside();
    const res = await handleFeedback(post(good), env());
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ number: 12, url: 'https://github.com/shashank662/shashank662.github.io/issues/12' });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(SITE);

    expect(calls[0].url).toContain('turnstile');
    const verify = calls[0].init?.body as FormData;
    expect(verify.get('secret')).toBe('ts-secret');
    expect(verify.get('response')).toBe('ok-token');

    expect(calls[1].url).toBe('https://api.github.com/repos/shashank662/shashank662.github.io/issues');
    expect((calls[1].init?.headers as Record<string, string>).Authorization).toBe('Bearer gh-secret');
    const issue = JSON.parse(String(calls[1].init?.body));
    expect(issue.labels).toEqual(['feedback', 'feedback: idea']);
    expect(issue.body).toContain('A dark mode for the résumé?');
  });

  it('opens nothing when Turnstile says it is not a person', async () => {
    const calls = outside({ person: false });
    const res = await handleFeedback(post(good), env());
    expect(res.status).toBe(403);
    expect(calls.some((c) => c.url.includes('api.github.com'))).toBe(false);
  });

  it('turns away a bad note before asking anyone', async () => {
    const calls = outside();
    expect((await handleFeedback(post({ ...good, message: '' }), env())).status).toBe(400);
    expect((await handleFeedback(post('not json'), env())).status).toBe(400);
    expect(calls).toHaveLength(0);
  });

  it('only takes feedback from the site itself', async () => {
    const calls = outside();
    const logged = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = await handleFeedback(post(good, 'https://elsewhere.example'), env());
    expect(res.status).toBe(403);
    // The browser can't read the refusal, so the log says which origin it came from.
    expect(logged).toHaveBeenCalledWith('feedback refused from origin', 'https://elsewhere.example');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(calls).toHaveLength(0);
  });

  it('says so when the secrets are not set up yet', async () => {
    outside();
    expect((await handleFeedback(post(good), env({ GITHUB_TOKEN: undefined }))).status).toBe(503);
  });

  it('slows down a visitor sending too much', async () => {
    const calls = outside();
    const limited = env({ FEEDBACK_LIMIT: { limit: async () => ({ success: false }) } });
    expect((await handleFeedback(post(good), limited)).status).toBe(429);
    expect(calls).toHaveLength(0);
  });

  it('reports a GitHub failure without leaking details', async () => {
    outside({ github: 500 });
    const res = await handleFeedback(post(good), env());
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain('gh-secret');
  });

  it('turns a crash into a reply the site can read, and logs the real error', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new Error('boom');
    });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await worker.fetch(post(good), env());
    expect(res.status).toBe(500);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(SITE);
    expect(await res.json()).toEqual({ error: "Couldn't save it just now." });
    expect(String(logged.mock.calls[0])).toContain('boom');
  });

  it('answers the browser preflight for the site', async () => {
    const res = await handleFeedback(
      new Request('https://portfolio.example.workers.dev/api/feedback', { method: 'OPTIONS', headers: { Origin: SITE } }),
      env(),
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe('POST');
  });
});

describe('every other address', () => {
  it('is served from the built site as before', async () => {
    const res = await worker.fetch(new Request('https://portfolio.example.workers.dev/work/'), env());
    expect(await res.text()).toBe('site');
  });
});
