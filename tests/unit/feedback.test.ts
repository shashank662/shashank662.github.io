import { describe, expect, it } from 'vitest';
import { checkFeedback, issueFor, MESSAGE_MAX, newIssueUrl, type Feedback } from '../../src/lib/feedback';

const good: Feedback = { type: 'clearer', message: 'Took me a while to find the 60-sec view.', page: '/', screen: 'phone, 390px', theme: 'auto' };

describe('checkFeedback', () => {
  it('accepts a note with a known type', () => {
    expect(checkFeedback(good)).toEqual({ ok: true, feedback: good });
  });

  it('turns away an unknown type, an empty note, and one that is too long', () => {
    expect(checkFeedback({ ...good, type: 'spam' }).ok).toBe(false);
    expect(checkFeedback({ ...good, type: 'toString' }).ok).toBe(false);
    expect(checkFeedback({ ...good, message: '  ' }).ok).toBe(false);
    expect(checkFeedback({ ...good, message: 'x'.repeat(MESSAGE_MAX + 1) }).ok).toBe(false);
    expect(checkFeedback(null).ok).toBe(false);
    expect(checkFeedback('hello').ok).toBe(false);
  });

  it('keeps the details short and plain, and a page that is not a path becomes /', () => {
    const result = checkFeedback({ ...good, page: 'https://evil.example/', screen: `phone\n${'x'.repeat(100)}`, theme: 42 });
    expect(result.ok && result.feedback.page).toBe('/');
    expect(result.ok && result.feedback.screen).toHaveLength(40);
    expect(result.ok && result.feedback.screen).not.toContain('\n');
    expect(result.ok && result.feedback.theme).toBe('');
  });
});

describe('issueFor', () => {
  it('titles the issue by type and the start of the note, and labels it feedback', () => {
    const issue = issueFor(good);
    expect(issue.title).toBe('Feedback (could be clearer): Took me a while to find the 60-sec view.');
    expect(issue.labels).toEqual(['feedback', 'feedback: clearer']);
  });

  it('quotes the note and says where it came from', () => {
    const { body } = issueFor({ ...good, message: 'line one\nline two' });
    expect(body).toContain('> line one\n> line two');
    expect(body).toContain('Page: `/`');
    expect(body).toContain('Screen: phone, 390px');
  });

  it('cuts a long first line in the title', () => {
    const { title } = issueFor({ ...good, message: 'a'.repeat(200) });
    expect(title.length).toBeLessThan(100);
    expect(title.endsWith('…')).toBe(true);
  });

  it('never lets a note mention a GitHub user', () => {
    const issue = issueFor({ ...good, message: 'ping @octocat please' });
    expect(issue.body).not.toContain('@octocat');
    expect(issue.title).not.toContain('@octocat');
  });
});

describe('newIssueUrl', () => {
  it("fills in GitHub's new issue page for this repo", () => {
    const url = new URL(newIssueUrl(good));
    expect(url.origin + url.pathname).toBe('https://github.com/shashank662/shashank662.github.io/issues/new');
    expect(url.searchParams.get('title')).toContain('Took me a while');
    expect(url.searchParams.get('labels')).toBe('feedback,feedback: clearer');
  });
});
