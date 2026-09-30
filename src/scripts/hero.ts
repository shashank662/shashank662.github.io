import { onReveal } from './landing';
import { finePointer, onFrame, prefersReducedMotion } from './motion';

const hero = document.querySelector<HTMLElement>('[data-hero]');

if (hero) {
  const reduce = prefersReducedMotion();

  // Letters slide up once a frame has painted, so the transition actually runs: at once, or, on a first visit,
  // as the landing screen dives into the page.
  onReveal(() => requestAnimationFrame(() => requestAnimationFrame(() => hero.classList.add('go'))));

  // Letters lean toward a nearby mouse cursor.
  if (finePointer() && !reduce) {
    const letters = [...hero.querySelectorAll<HTMLElement>('.ch')];
    const state = letters.map(() => ({ y: 0, s: 1 }));
    const mouse = { x: -1e4, y: -1e4 };
    let inView = true;
    addEventListener(
      'pointermove',
      (event) => {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
      },
      { passive: true },
    );
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
    }).observe(hero);
    onFrame(() => {
      if (!inView) return;
      const box = hero.getBoundingClientRect();
      letters.forEach((ch, i) => {
        const cx = box.left + ch.offsetLeft + ch.offsetWidth / 2;
        const cy = box.top + ch.offsetTop + ch.offsetHeight / 2;
        const pull = Math.max(0, 1 - Math.hypot(mouse.x - cx, mouse.y - cy) / 300);
        const s = state[i];
        s.y += (-pull * 22 - s.y) * 0.14;
        s.s += (1 + pull * 0.14 - s.s) * 0.14;
        ch.style.transform = `translate3d(0, ${s.y.toFixed(2)}px, 0) scaleY(${s.s.toFixed(3)})`;
        ch.classList.toggle('hot', pull > 0.55);
      });
    });
  }

}
