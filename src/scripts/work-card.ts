import { finePointer, onFrame, prefersReducedMotion } from './motion';

// A small card that follows the mouse over the work rows and shows each project's headline number.
const float = document.querySelector<HTMLElement>('[data-work-card]');

if (float && finePointer()) {
  const ease = prefersReducedMotion() ? 1 : 0.2;
  const target = { x: 0, y: 0 };
  const pos = { x: 0, y: 0 };
  let shown = false;

  const write = (slot: string, text = '') => {
    const el = float.querySelector(`[data-card="${slot}"]`);
    if (el) el.textContent = text;
  };
  const place = () => {
    float.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    // Near the right edge the card sits on the other side of the pointer.
    float.classList.toggle('flip', target.x > innerWidth - 290);
  };

  addEventListener(
    'pointermove',
    (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
    },
    { passive: true },
  );

  document.querySelectorAll<HTMLElement>('[data-card-metric]').forEach((row) => {
    row.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      write('tag', row.dataset.cardTag);
      write('go', row.dataset.cardGo);
      write('metric', row.dataset.cardMetric);
      write('label', row.dataset.cardLabel);
      if (!shown) {
        // Appear at the pointer rather than sliding in from where the card was last.
        pos.x = target.x = event.clientX;
        pos.y = target.y = event.clientY;
        place();
      }
      shown = true;
      float.classList.add('on');
    });
    row.addEventListener('pointerleave', () => {
      shown = false;
      float.classList.remove('on');
    });
  });

  // Browsers keep the page in memory for the Back button; don't bring the card back frozen in place.
  addEventListener('pagehide', () => {
    shown = false;
    float.classList.remove('on');
  });

  onFrame(() => {
    if (!shown) return;
    pos.x += (target.x - pos.x) * ease;
    pos.y += (target.y - pos.y) * ease;
    place();
  });
}
