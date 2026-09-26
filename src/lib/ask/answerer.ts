import MiniSearch from 'minisearch';
import { tokens } from './normalise';
import type { Answerer, AskEntry, AskResult } from './types';

/** Greetings and questions about the bot itself, answered before searching. */
const SMALL_TALK: { pattern: RegExp; entry: AskEntry }[] = [
  {
    pattern: /^(hi|hello|hey|hiya|namaste|good (morning|afternoon|evening))\b/,
    entry: {
      id: 'hello',
      question: 'Hi',
      alt: [],
      keywords: [],
      answer: "Hi! Ask me about Shashank's experience, his projects, or how to reach him.",
    },
  },
  {
    pattern: /\b(who|what) are you\b|\bare you (a |an )?(bot|human|real|ai|person)\b/,
    entry: {
      id: 'about-bot',
      question: 'Who are you?',
      alt: [],
      keywords: [],
      answer: "I'm a small bot that answers from this site's content. I can't make things up: if I don't know, I'll point you to Shashank.",
    },
  },
  {
    pattern: /^(thanks|thank you|thx|ty|cheers)\b/,
    entry: { id: 'thanks', question: 'Thanks', alt: [], keywords: [], answer: "You're welcome!" },
  },
];

/** Below this score a hit is not a real match (tuned against the phrasing table in the tests). */
const MIN_SCORE = 2;
/**
 * A runner-up scoring at least this share of the top hit is offered as "Did you mean…".
 * Answers with many keywords score lower per keyword, so "half as good" is already a real alternative.
 */
const CLOSE = 0.5;

/** Answers from the site's own content, entirely in the browser. */
export class LocalAnswerer implements Answerer {
  private readonly index: MiniSearch<AskEntry>;
  private readonly byId: Map<string, AskEntry>;

  constructor(entries: AskEntry[]) {
    this.byId = new Map(entries.map((entry) => [entry.id, entry]));
    this.index = new MiniSearch<AskEntry>({
      fields: ['question', 'alt', 'keywords'],
      extractField: (entry, field) => {
        const value = entry[field as keyof AskEntry];
        return Array.isArray(value) ? value.join(' ') : String(value ?? '');
      },
      tokenize: tokens,
      processTerm: (term) => term,
      // Typos are forgiven only in longer words: in short ones a single changed letter makes another word
      // ("movie" → "move", "song" → "long"), so off-topic questions would match.
      searchOptions: {
        boost: { keywords: 3, question: 1.5 },
        fuzzy: (term) => (term.length >= 6 ? 0.2 : false),
        prefix: (term) => term.length >= 5,
      },
    });
    this.index.addAll(entries);
  }

  answer(question: string): AskResult | null {
    const plain = question.trim().toLowerCase();
    const talk = SMALL_TALK.find(({ pattern }) => pattern.test(plain));
    if (talk) return { entry: talk.entry, alternatives: [] };

    const [top, ...rest] = this.index.search(question);
    const entry = top && top.score >= MIN_SCORE ? this.byId.get(top.id) : undefined;
    if (!top || !entry) return null;
    const alternatives = rest
      .filter((hit) => hit.score >= top.score * CLOSE)
      .slice(0, 2)
      .map((hit) => this.byId.get(hit.id))
      .filter((alt): alt is AskEntry => alt !== undefined);
    return { entry, alternatives };
  }
}
