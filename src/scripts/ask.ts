// The "Ask about me" pill and panel. The search library and the answers load the first time it opens.
type Bot = Awaited<ReturnType<(typeof import('./ask-bot'))['createBot']>>;

const pill = document.querySelector<HTMLButtonElement>('[data-ask-open]');
const panel = document.querySelector<HTMLElement>('[data-ask-panel]');
const input = panel?.querySelector<HTMLInputElement>('[data-ask-input]');
const form = panel?.querySelector<HTMLFormElement>('[data-ask-form]');

if (pill && panel && input && form) {
  let bot: Promise<Bot> | null = null;

  const close = () => {
    panel.hidden = true;
    pill.hidden = false;
    pill.setAttribute('aria-expanded', 'false');
    pill.focus();
  };
  const load = () => (bot ??= import('./ask-bot').then(({ createBot }) => createBot(panel, close)));
  const ask = (question: string) => void load().then((b) => b.ask(question));

  pill.addEventListener('click', () => {
    panel.hidden = false;
    pill.hidden = true;
    pill.setAttribute('aria-expanded', 'true');
    input.focus();
    void load();
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
