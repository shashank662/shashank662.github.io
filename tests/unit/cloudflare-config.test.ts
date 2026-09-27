import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface WranglerConfig {
  name: string;
  main?: string;
  assets: { directory: string; not_found_handling?: string };
}

// The file's comments are whole lines, so dropping those lines leaves plain JSON.
const file = join(import.meta.dirname, '../../wrangler.jsonc');
const config = JSON.parse(readFileSync(file, 'utf8').replace(/^\s*\/\/.*$/gm, '')) as WranglerConfig;

describe('the Cloudflare Worker config', () => {
  it('names the Worker that Cloudflare builds from this repository', () => {
    // Cloudflare refuses to deploy when this differs from the Worker's name in its dashboard.
    expect(config.name).toBe('shashank662-portfolio');
  });

  it('publishes the built site as plain files, with no server code', () => {
    expect(config.assets.directory).toBe('./dist');
    expect(config.main).toBeUndefined();
  });

  it("answers an unknown address with the site's own 404 page", () => {
    expect(config.assets.not_found_handling).toBe('404-page');
  });
});
