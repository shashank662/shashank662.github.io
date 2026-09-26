/** Shorthand people type, expanded before matching (the spec's list, plus a few obvious ones). */
export const SYNONYMS: Record<string, string> = {
  yrs: 'years',
  yr: 'year',
  exp: 'experience',
  np: 'notice period',
  wfh: 'remote',
  ctc: 'compensation',
  salary: 'compensation',
  blr: 'bangalore',
  bengaluru: 'bangalore',
  tech: 'stack',
  abt: 'about',
  cv: 'resume',
  u: 'you',
  ur: 'your',
};

/** Words that carry no meaning for matching. */
const FILLER = new Set(
  (
    'a an the is are am was were be been do does did you your yours i me my we our he his him she her it its ' +
    'they them their of to in on at for with about from by as tell please can could would will should what whats ' +
    'which who whom how when where why there here this that these those any some have has had and or so just like ' +
    'know let lets give share thing things'
  ).split(' '),
);

/** A light stemmer, applied to questions and answers alike: "retries" → "retry", "years" → "year". */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/** Lower-cases, strips punctuation and accents, expands shorthand, drops filler words and stems what is left. */
export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, '')
    .split(/[^a-z0-9]+/)
    .flatMap((word) => (SYNONYMS[word] ?? word).split(' '))
    .filter((word) => word.length > 1 && !FILLER.has(word))
    .map(stem);
}
