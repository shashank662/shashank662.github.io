import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface WranglerConfig {
  name: string;
  main?: string;
  assets: { directory: string; not_found_handling?: string; binding?: string; run_worker_first?: string[] };
  ratelimits?: { name: string; simple: { limit: number; period: number } }[];
  observability?: { enabled: boolean };
}

// The file's comments are whole lines, so dropping those lines leaves plain JSON.
const file = join(import.meta.dirname, '../../wrangler.jsonc');
const config = JSON.parse(readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')) as WranglerConfig;

describe('the Cloudflare Worker config', () => {
  it('names the Worker that Cloudflare builds from this repository', () => {
    // Cloudflare refuses to deploy when this differs from the Worker's name in its dashboard.
    expect(config.name).toBe('shashank662-portfolio');
  });

  it('publishes the built site as plain files, and runs code only for the feedback address', () => {
    expect(config.assets.directory).toBe('./dist');
    expect(config.main).toBe('worker/index.ts');
    expect(config.assets.binding).toBe('ASSETS');
    // Pages and files never reach the script: only /api/* does.
    expect(config.assets.run_worker_first).toEqual(['/api/*']);
  });

  it('limits how much feedback one visitor can send', () => {
    expect(config.ratelimits).toEqual([expect.objectContaining({ name: 'FEEDBACK_LIMIT', simple: { limit: 5, period: 60 } })]);
  });

  it('keeps the Worker logs, so a failed feedback note can be traced', () => {
    expect(config.observability).toEqual({ enabled: true });
  });

  it("answers an unknown address with the site's own 404 page", () => {
    expect(config.assets.not_found_handling).toBe('404-page');
  });
});
