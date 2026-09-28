// The Cloudflare Worker (wrangler.jsonc). It serves the built site from dist/ as before, and answers one address,
// POST /api/feedback: it checks the visitor is a person (Turnstile) and what they sent, then opens a GitHub issue.
// The GitHub token and the Turnstile secret are Worker secrets, never in the page.
import { checkFeedback, issueFor, REPO } from '../src/lib/feedback';

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  /** A fine-grained token that can only read and write this repo's issues. */
  GITHUB_TOKEN?: string;
  TURNSTILE_SECRET?: string;
  /** Cloudflare's rate limiter, keyed by visitor address (wrangler.jsonc). Missing in tests. */
  FEEDBACK_LIMIT?: { limit: (options: { key: string }) => Promise<{ success: boolean }> };
}

/** The owner's domain: the site may be served from it or any of its subdomains. */
const DOMAIN = 'shashankhr.in';

/**
 * The pages allowed to send feedback: shashankhr.in and its subdomains over https, the site on GitHub Pages, and this
 * Worker's own copy. The hostname is compared whole or after a dot, so a look-alike such as evilshashankhr.in is refused.
 */
export function isSiteOrigin(origin: string, self: string): boolean {
  if (origin === self || origin === 'https://shashank662.github.io') return true;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return url.protocol === 'https:' && url.port === '' && url.origin === origin && (host === DOMAIN || host.endsWith(`.${DOMAIN}`));
  } catch {
    return false;
  }
}

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  if (!isSiteOrigin(origin, new URL(request.url).origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' };
}

const reply = (request: Request, status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(request) } });

async function isPerson(token: unknown, secret: string, ip: string): Promise<boolean> {
  if (typeof token !== 'string' || !token) return false;
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form });
  const data = (await result.json()) as { success?: boolean };
  return data.success === true;
}

export async function handleFeedback(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(request) });
  if (request.method !== 'POST') return reply(request, 405, { error: 'Send feedback with POST.' });
  if (!cors(request)['Access-Control-Allow-Origin']) {
    // The browser can't read this refusal, so the Worker logs say which origin it came from.
    console.warn('feedback refused from origin', request.headers.get('Origin'));
    return reply(request, 403, { error: 'Feedback is only taken from the site.' });
  }
  if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET) {
    // Names only, never values: the Worker logs say which secret to add (Settings → Variables and Secrets).
    const missing = (['GITHUB_TOKEN', 'TURNSTILE_SECRET'] as const).filter((name) => !env[name]);
    console.error('feedback secrets missing:', missing.join(', '));
    return reply(request, 503, { error: 'Feedback is not set up yet.' });
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? '';
  if (env.FEEDBACK_LIMIT && !(await env.FEEDBACK_LIMIT.limit({ key: ip || 'unknown' })).success) {
    return reply(request, 429, { error: 'That is a lot of feedback at once. Try again in a minute.' });
  }

  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return reply(request, 400, { error: 'Nothing was sent.' });
  }
  const checked = checkFeedback(input);
  if (!checked.ok) return reply(request, 400, { error: checked.error });
  if (!(await isPerson(input.token, env.TURNSTILE_SECRET, ip))) {
    return reply(request, 403, { error: "Couldn't confirm you're a person. Try again." });
  }

  const created = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'shashank662-portfolio-feedback',
    },
    body: JSON.stringify(issueFor(checked.feedback)),
  });
  if (!created.ok) return reply(request, 502, { error: "Couldn't save it just now." });
  const issue = (await created.json()) as { number: number; html_url: string };
  return reply(request, 201, { number: issue.number, url: issue.html_url });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === '/api/feedback') {
      // A crash would otherwise reach the browser as Cloudflare's bare error page, with no CORS headers, which the site
      // can only report as "Load failed". Log the real error (Worker logs) and answer in a form the site can read.
      try {
        return await handleFeedback(request, env);
      } catch (error) {
        console.error('feedback failed', error);
        return reply(request, 500, { error: "Couldn't save it just now." });
      }
    }
    return env.ASSETS.fetch(request);
  },
};
