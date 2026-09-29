// The phone menu: one button opens the site's links under the header. A link, Escape, a tap outside, or a wider
// screen closes it; Escape hands focus back to the button.
const button = document.querySelector<HTMLButtonElement>('[data-menu-button]');
const drawer = document.querySelector<HTMLElement>('[data-menu]');

if (button && drawer) {
  const set = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    drawer.toggleAttribute('hidden', !open);
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  drawer.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) set(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
    set(false);
    button.focus();
  });
  document.addEventListener('pointerdown', (event) => {
    const target = event.target as Node;
    if (button.getAttribute('aria-expanded') === 'true' && !drawer.contains(target) && !button.contains(target)) set(false);
  });
  matchMedia('(min-width: 761px)').addEventListener('change', (event) => {
    if (event.matches) set(false);
  });
}
