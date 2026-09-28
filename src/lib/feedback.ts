// Visitor feedback (spec §9b): what the form sends, how it is checked, and the GitHub issue it becomes. Shared by the
// page and the Cloudflare Worker, so both agree on the rules.

export const REPO = 'shashank662/shashank662.github.io';

export const FEEDBACK_TYPES = {
  broken: "Something's broken",
  clearer: 'Could be clearer',
  idea: 'Idea',
} as const;
export type FeedbackType = keyof typeof FEEDBACK_TYPES;

export const MESSAGE_MIN = 3;
export const MESSAGE_MAX = 1000;

/** What the form sends. `page`, `screen` and `theme` are filled in by the page, not typed by the visitor. */
export interface Feedback {
  type: FeedbackType;
  message: string;
  page: string;
  screen: string;
  theme: string;
}

export type Checked = { ok: true; feedback: Feedback } | { ok: false; error: string };

const isType = (value: unknown): value is FeedbackType => typeof value === 'string' && Object.hasOwn(FEEDBACK_TYPES, value);
/** Short, single-line and printable: anything else is dropped rather than trusted. */
const tidy = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[^\x20-\x7e]/g, '').trim().slice(0, max) : '';

/** Checks what a visitor sent. Never trusts the page: the Worker runs this on every request. */
export function checkFeedback(input: unknown): Checked {
  if (typeof input !== 'object' || input === null) return { ok: false, error: 'Nothing was sent.' };
  const raw = input as Record<string, unknown>;
  if (!isType(raw.type)) return { ok: false, error: 'Pick what the feedback is about.' };
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';
  if (message.length < MESSAGE_MIN) return { ok: false, error: 'Write a few words first.' };
  if (message.length > MESSAGE_MAX) return { ok: false, error: `Keep it under ${MESSAGE_MAX} characters.` };
  const page = tidy(raw.page, 200);
  return {
    ok: true,
    feedback: {
      type: raw.type,
      message,
      page: page.startsWith('/') ? page : '/',
      screen: tidy(raw.screen, 40),
      theme: tidy(raw.theme, 20),
    },
  };
}

/** Stops "@someone" in a visitor's note from notifying a GitHub user. */
const noMentions = (text: string) => text.replace(/@/g, '@​');

/** The GitHub issue a piece of feedback becomes: a short title, the note quoted, and where it was sent from. */
export function issueFor(feedback: Feedback): { title: string; body: string; labels: string[] } {
  const firstLine = feedback.message.split('\n')[0];
  const short = firstLine.length > 60 ? `${firstLine.slice(0, 59).trimEnd()}…` : firstLine;
  const quoted = noMentions(feedback.message)
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
  const details = [`Page: \`${feedback.page}\``, feedback.screen && `Screen: ${feedback.screen}`, feedback.theme && `Theme: ${feedback.theme}`]
    .filter(Boolean)
    .join(' · ');
  return {
    title: `Feedback (${FEEDBACK_TYPES[feedback.type].toLowerCase()}): ${noMentions(short)}`,
    body: `${quoted}\n\n${details}\n\n_Sent from the feedback form on the site._`,
    labels: ['feedback', `feedback: ${feedback.type}`],
  };
}

/** GitHub's own "new issue" page, filled in: the fallback when the form cannot send by itself. */
export function newIssueUrl(feedback: Feedback): string {
  const { title, body, labels } = issueFor(feedback);
  const query = new URLSearchParams({ title, body, labels: labels.join(',') });
  return `https://github.com/${REPO}/issues/new?${query}`;
}
