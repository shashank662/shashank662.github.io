import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

interface Step {
  uses?: string;
  run?: string;
  with?: Record<string, unknown>;
}
interface Job {
  needs?: string | string[];
  permissions?: Record<string, string>;
  steps: Step[];
}

const file = join(import.meta.dirname, '../../.github/workflows/deploy.yml');
const workflow = parse(readFileSync(file, 'utf8')) as {
  on: Record<string, unknown>;
  permissions: Record<string, string>;
  jobs: Record<'build' | 'deploy', Job>;
};
const { build, deploy } = workflow.jobs;
const indexOf = (test: (step: Step) => boolean) => build.steps.findIndex(test);

describe('the deploy workflow', () => {
  it('runs on every push to main, and by hand', () => {
    expect(workflow.on).toEqual({ push: { branches: ['main'] }, workflow_dispatch: null });
  });

  it('runs every check, in order, before it uploads the site', () => {
    const checks = ['npm ci', 'npm run check', 'npm test', 'npm run build', 'npm run test:e2e'].map((command) =>
      indexOf((step) => step.run === command),
    );
    const upload = indexOf((step) => step.uses?.startsWith('actions/upload-pages-artifact@') ?? false);
    expect(checks.every((index) => index >= 0), 'each check is its own step').toBe(true);
    expect(checks).toEqual([...checks].sort((a, b) => a - b));
    expect(upload).toBeGreaterThan(Math.max(...checks));
    expect(build.steps[upload].with?.path).toBe('dist');
  });

  it('only lets the deploy job publish, and only after the checks pass', () => {
    // The build runs third-party code (npm packages), so it gets a read-only token.
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(build.permissions).toBeUndefined();
    expect(deploy.needs).toBe('build');
    expect(deploy.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
    expect(deploy.steps.some((step) => step.uses?.startsWith('actions/deploy-pages@'))).toBe(true);
  });
});
