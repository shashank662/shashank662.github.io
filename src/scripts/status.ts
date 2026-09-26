export type SiteState = 'ok' | 'degraded';

const OK_TEXT = 'all systems operational';

/** Sets every live status pill on the page (header, playground, footer) to the same state. */
export function setSiteStatus(state: SiteState, text: string = state === 'ok' ? OK_TEXT : 'degraded'): void {
  document.querySelectorAll<HTMLElement>('[data-status]').forEach((pill) => {
    pill.dataset.state = state;
    const label = pill.querySelector('[data-status-text]');
    if (label) label.textContent = text;
  });
}
