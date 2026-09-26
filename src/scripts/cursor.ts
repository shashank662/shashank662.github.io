import { finePointer, onFrame } from './motion';

const dot = document.querySelector<HTMLElement>('[data-cursor-dot]');

if (dot && finePointer()) {
  document.documentElement.classList.add('fine');
  const target = { x: innerWidth / 2, y: innerHeight / 2 };
  const pos = { ...target };
  let visible = false;

  addEventListener(
    'pointermove',
    (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      visible = true;
      const el = event.target instanceof Element ? event.target : null;
      dot.classList.toggle('ring', Boolean(el?.closest('a, button, [data-cursor]')));
    },
    { passive: true },
  );
  document.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) visible = false;
  });

  onFrame(() => {
    pos.x += (target.x - pos.x) * 0.25;
    pos.y += (target.y - pos.y) * 0.25;
    dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    dot.style.opacity = visible ? '1' : '0';
  });
}
