import { billingTotal, type ExhibitKind } from '../lib/exhibits';
const bound = new WeakSet<HTMLElement>();
const messages: Record<ExhibitKind, string> = {
  retry: 'Recovered · the queued delivery reached its destination.',
  billing: 'Window replaced · 3 unique messages. Replaying adds no charges.',
  review: 'Review note · check the response before marking delivery successful.',
  cart: 'Reminder prepared · the saved basket becomes a recovery message.',
};
export function initExhibits(root: ParentNode): void {
  root.querySelectorAll<HTMLElement>('[data-exhibit]').forEach((exhibit) => {
    if (bound.has(exhibit)) return;
    const kind = exhibit.dataset.exhibit as ExhibitKind;
    const button = exhibit.querySelector<HTMLButtonElement>('[data-exhibit-action]');
    const status = exhibit.querySelector<HTMLElement>('[data-exhibit-status]');
    if (!button || !status || !messages[kind]) return;
    bound.add(exhibit);
    let timer: ReturnType<typeof setTimeout> | undefined;
    button.hidden = false;
    button.addEventListener('click', () => {
      clearTimeout(timer);
      const complete = () => {
        exhibit.dataset.state = 'complete';
        status.textContent = messages[kind];
        const total = exhibit.querySelector('[data-billing-total]');
        if (total) total.textContent = String(billingTotal(['a', 'b', 'a', 'c', 'b']));
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || kind === 'review') return complete();
      exhibit.dataset.state = 'active';
      status.textContent = kind === 'retry' ? 'Failed → queued · waiting before retry…' : kind === 'billing' ? 'Recomputing the same daily window…' : 'Basket saved · preparing a reminder…';
      timer = setTimeout(complete, 650);
    });
  });
}
initExhibits(document);
