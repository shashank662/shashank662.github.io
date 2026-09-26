// The "Ask about me" pill and panel. The search library and the answers load the first time it opens.
type Bot = Awaited<ReturnType<(typeof import('./ask-bot'))['createBot']>>;

const pill = document.querySelector<HTMLButtonElement>('[data-ask-open]');
const panel = document.querySelector<HTMLElement>('[data-ask-panel]');
const input = panel?.querySelector<HTMLInputElement>('[data-ask-input]');
const form = panel?.querySelector<HTMLFormElement>('[data-ask-form]');
const log = panel?.querySelector<HTMLElement>('[data-ask-log]');
const unavailable = panel?.querySelector<HTMLTemplateElement>('[data-ask-unavailable]');

if (pill && panel && input && form && log && unavailable) {
  let bot: Promise<Bot> | null = null;

  const close = () => {
    panel.hidden = true;
    pill.hidden = false;
    pill.setAttribute('aria-expanded', 'false');
    pill.focus();
  };
  // A failed load is forgotten, so the next question tries again.
  const load = () =>
    (bot ??= import('./ask-bot')
      .then(({ createBot }) => createBot(panel, close))
      .catch((error: unknown) => {
        bot = null;
        throw error;
      }));
  // Offline, or the site changed since this page opened: reply with the direct contacts instead of going quiet.
  const cannotLoad = (question: string) => {
    const you = document.createElement('div');
    you.className = 'msg you';
    you.textContent = question;
    const reply = document.createElement('div');
    reply.className = 'msg bot';
    reply.append(unavailable.content.cloneNode(true));
    log.append(you, reply);
    log.scrollTop = log.scrollHeight;
  };
  const ask = (question: string) => void load().then((b) => b.ask(question), () => cannotLoad(question));

  pill.addEventListener('click', () => {
    panel.hidden = false;
    pill.hidden = true;
    pill.setAttribute('aria-expanded', 'true');
    input.focus();
    // Start loading now. If it fails, the first question tries again and says so.
    load().catch(() => {});
  });
  panel.querySelector('[data-ask-close]')?.addEventListener('click', close);
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  panel.querySelectorAll<HTMLButtonElement>('[data-ask-chip]').forEach((chip) => {
    chip.addEventListener('click', () => ask(chip.textContent ?? ''));
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    ask(question);
  });
}
