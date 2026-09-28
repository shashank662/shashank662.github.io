// The Stack section's chips (spec §5): hovering, focusing or tapping a skill shows where on the site it was used.
// One skill is shown at a time; the last one chosen stays until another is.
const rows = document.querySelector<HTMLElement>('[data-stack]');
const used = rows?.querySelector<HTMLElement>('[data-stack-used]');

if (rows && used) {
  const chips = [...rows.querySelectorAll<HTMLButtonElement>('[data-skill]')];
  const show = (chip: HTMLButtonElement) => {
    const template = chip.parentElement?.querySelector<HTMLTemplateElement>('template[data-used]');
    if (!template) return;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    const name = document.createElement('strong');
    name.textContent = chip.dataset.skill ?? '';
    used.replaceChildren(name, template.content.cloneNode(true));
  };
  chips.forEach((chip) => {
    chip.addEventListener('click', () => show(chip));
    chip.addEventListener('focus', () => show(chip));
    chip.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') show(chip);
    });
  });
}
