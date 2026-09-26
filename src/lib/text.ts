const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Makes any string safe to place inside HTML. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ENTITIES[ch]);
}

/** Escapes the text, then turns `*phrase*` into `<em>phrase</em>`. */
export function emphasize(text: string): string {
  return escapeHtml(text).replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/** Splits text into words; words inside `[square brackets]` are marked as accented. */
export function accentWords(text: string): { word: string; accent: boolean }[] {
  return text
    .split(/(\[[^\]]+\])/)
    .flatMap((part) => {
      const accent = part.startsWith('[') && part.endsWith(']');
      const inner = accent ? part.slice(1, -1) : part;
      return inner
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => ({ word, accent }));
    });
}
