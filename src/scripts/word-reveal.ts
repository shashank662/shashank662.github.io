import { revealProgress } from '../lib/reveal';
import { prefersReducedMotion } from './motion';

const paragraph = document.querySelector<HTMLElement>('[data-word-reveal]');

if (paragraph && !prefersReducedMotion()) {
  const words = [...paragraph.querySelectorAll<HTMLElement>('.w')];
  let queued = false;

  const update = () => {
    queued = false;
    const box = paragraph.getBoundingClientRect();
    // Words light as they pass the middle of the screen (src/lib/reveal.ts), each fading in over a few words' span.
    const lit = revealProgress(box.top, box.height, innerHeight) * (words.length + 4);
    // How lit each word is, 0–1. The stylesheet keeps it above a readable floor.
    words.forEach((word, i) => {
      word.style.setProperty('--lit', String(Math.min(1, Math.max(0, lit - i))));
    });
  };

  addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    },
    { passive: true },
  );
  update();
}
