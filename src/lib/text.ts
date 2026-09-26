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

/** Escapes the text, then turns `**phrase**` into `<strong>` and `*phrase*` into `<em>`. */
export function emphasize(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

/** The same text without emphasis markers, for places that cannot show markup (titles, meta descriptions). */
export function plainText(text: string): string {
  return text.replace(/\*+/g, '');
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
