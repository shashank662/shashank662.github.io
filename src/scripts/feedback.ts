import { MESSAGE_MAX, MESSAGE_MIN, newIssueUrl, type Feedback, type FeedbackType } from '../lib/feedback';

// The feedback button and form (spec §9b). With the Worker set up, a note is sent there, after Turnstile confirms a
// person is sending it, and the visitor gets the issue's link. Without it, or if sending fails, the note opens as a
// filled-in issue on GitHub's own page instead, so feedback always has a way through.

interface Turnstile {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
}
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const pill = document.querySelector<HTMLButtonElement>('[data-feedback-open]');
const panel = document.querySelector<HTMLElement>('[data-feedback-panel]');
const form = panel?.querySelector<HTMLFormElement>('[data-feedback-form]');
const message = panel?.querySelector<HTMLTextAreaElement>('[data-feedback-message]');
const done = panel?.querySelector<HTMLElement>('[data-feedback-done]');

if (pill && panel && form && message && done) {
  const endpoint = panel.dataset.endpoint ?? '';
  const siteKey = panel.dataset.sitekey ?? '';
  const live = Boolean(endpoint && siteKey);
  const pick = <T extends Element>(selector: string) => panel.querySelector<T>(selector) as T;
  const details = pick<HTMLElement>('[data-feedback-details]');
  const count = pick<HTMLElement>('[data-feedback-count]');
  const error = pick<HTMLElement>('[data-feedback-error]');
  const send = pick<HTMLButtonElement>('[data-feedback-send]');
  const link = pick<HTMLAnchorElement>('[data-feedback-link]');
  const box = pick<HTMLElement>('[data-feedback-turnstile]');
  send.textContent = live ? 'Send' : 'Continue on GitHub';
  let token = '';
  let widget: string | undefined;

  const screen = () => {
    const kind = innerWidth <= 760 ? 'phone' : innerWidth <= 1100 ? 'tablet' : 'laptop';
    return `${kind}, ${innerWidth}px`;
  };
  const current = (): Feedback => ({
    type: (form.querySelector<HTMLInputElement>('input[name="type"]:checked')?.value ?? 'broken') as FeedbackType,
    message: message.value.trim(),
    page: location.pathname,
    screen: screen(),
    theme: document.documentElement.dataset.theme ?? '',
  });

  /** Turnstile's script loads the first time the form opens, so visitors who never give feedback never load it. */
  const startTurnstile = () => {
    if (!live || widget !== undefined) return;
    const render = () => {
      widget = window.turnstile?.render(box, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        callback: (value: string) => (token = value),
        'expired-callback': () => (token = ''),
      });
    };
    if (window.turnstile) return render();
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = render;
    document.head.append(script);
  };

  const open = () => {
    panel.hidden = false;
    pill.hidden = true;
    pill.setAttribute('aria-expanded', 'true');
    details.textContent = `Sent along: page ${location.pathname} · ${screen()} · theme ${document.documentElement.dataset.theme ?? ''}`;
    message.focus();
    startTurnstile();
  };
  const close = () => {
    panel.hidden = true;
    pill.hidden = false;
    pill.setAttribute('aria-expanded', 'false');
    pill.focus();
  };
  /** Sent, or, on GitHub's page, not sent until the visitor presses Submit there: the screen says which. */
  const finish = (url: string, onGitHubPage = false) => {
    if (onGitHubPage) {
      pick<HTMLElement>('[data-feedback-thanks]').textContent = 'One more step, on GitHub.';
      pick<HTMLElement>('[data-feedback-next]').textContent =
        'Your note is filled in on GitHub, in a new tab. Press "Create" there to send it. Shashank reviews every note.';
      link.textContent = 'Open it on GitHub again ↗';
    }
    form.hidden = true;
    link.href = url;
    done.hidden = false;
    done.focus();
  };
  const onGitHub = (feedback: Feedback) => {
    const url = newIssueUrl(feedback);
    window.open(url, '_blank', 'noopener');
    return url;
  };

  pill.addEventListener('click', open);
  pick<HTMLButtonElement>('[data-feedback-close]').addEventListener('click', close);
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  message.addEventListener('input', () => {
    count.textContent = `${message.value.length} / ${MESSAGE_MAX}`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    const feedback = current();
    if (feedback.message.length < MESSAGE_MIN) {
      error.textContent = 'Write a few words first.';
      message.focus();
      return;
    }
    if (!live) {
      finish(onGitHub(feedback), true);
      return;
    }
    send.disabled = true;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...feedback, token }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? 'failed');
      finish(data.url);
    } catch (reason) {
      // Say what went wrong, and offer GitHub's own page so the note isn't lost.
      const text = reason instanceof Error && reason.message !== 'failed' ? reason.message : "Couldn't send it just now.";
      error.textContent = `${text} `;
      const fallback = document.createElement('a');
      fallback.href = newIssueUrl(feedback);
      fallback.target = '_blank';
      fallback.rel = 'noopener';
      fallback.textContent = 'Send it on GitHub instead';
      error.append(fallback);
      if (widget !== undefined) window.turnstile?.reset(widget);
      token = '';
    } finally {
      send.disabled = false;
    }
  });
}
