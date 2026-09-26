/** One answer the bot can give, and the words that should lead to it. */
export interface AskEntry {
  id: string;
  /** The question as a person would ask it; also the label of a "Did you mean…" chip. */
  question: string;
  /** Other ways of asking. */
  alt: string[];
  /** Words that point strongly at this answer. */
  keywords: string[];
  /** May contain {since:YYYY-MM}, filled in with the time since that month when shown. */
  answer: string;
  /** Where the answer comes from; small talk has none. */
  source?: { label: string; href: string };
}

export interface AskResult {
  entry: AskEntry;
  /** Close runners-up, offered as "Did you mean…". */
  alternatives: AskEntry[];
}

/** Anything that can answer a visitor's question. LocalAnswerer matches it against the site's own content. */
export interface Answerer {
  answer(question: string): AskResult | null;
}
