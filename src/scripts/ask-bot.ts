import { LocalAnswerer } from '../lib/ask/answerer';
import { fillDurations } from '../lib/ask/fill';
import type { AskEntry } from '../lib/ask/types';

/** Loads the answers (once) and returns a bot that writes into the panel's log. */
export async function createBot(panel: HTMLElement, close: () => void) {
  const log = panel.querySelector<HTMLElement>('[data-ask-log]');
  const fallback = panel.querySelector<HTMLTemplateElement>('[data-ask-fallback]');
  if (!log || !fallback) throw new Error('Ask panel markup is incomplete');

  let answerer: LocalAnswerer | null = null;
  try {
    const response = await fetch('/ask-index.json');
    answerer = new LocalAnswerer((await response.json()) as AskEntry[]);
  } catch {
    // Offline or blocked: every question gets the "ask Shashank directly" reply.
  }

  const message = (who: 'you' | 'bot') => {
    const el = document.createElement('div');
    el.className = `msg ${who}`;
    log.append(el);
    return el;
  };

  const reply = (entry: AskEntry, alternatives: AskEntry[]) => {
    const el = message('bot');
    const text = document.createElement('p');
    text.textContent = fillDurations(entry.answer);
    el.append(text);
    if (entry.source) {
      const link = document.createElement('a');
      link.className = 'src mono';
      link.href = entry.source.href;
      link.textContent = `From: ${entry.source.label} →`;
      el.append(link);
    }
    if (alternatives.length > 0) {
      const more = document.createElement('p');
      more.className = 'alts';
      more.append('Did you mean… ');
      for (const alt of alternatives) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'chip mono';
        chip.textContent = alt.question;
        chip.addEventListener('click', () => {
          message('you').textContent = alt.question;
          reply(alt, []);
        });
        more.append(chip);
      }
      el.append(more);
    }
    log.scrollTop = log.scrollHeight;
  };

  // Following a source link (or a fallback link) closes the panel.
  log.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a')) close();
  });

  return {
    ask(question: string) {
      message('you').textContent = question;
      const result = answerer?.answer(question) ?? null;
      if (result) reply(result.entry, result.alternatives);
      else message('bot').append(fallback.content.cloneNode(true));
      log.scrollTop = log.scrollHeight;
    },
  };
}
