/**
 * A button marked `data-disclosure` opens and closes the element its aria-controls names:
 * it keeps aria-expanded in step and toggles an `open` class on that element.
 * The CSS only collapses a panel under the `js` class, so without JavaScript it simply stays open.
 */
document.querySelectorAll<HTMLButtonElement>('[data-disclosure]').forEach((button) => {
  const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
  if (!panel) return;
  const set = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('open', open);
  };
  set(false);
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
});
