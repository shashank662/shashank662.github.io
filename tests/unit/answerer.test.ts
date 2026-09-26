import { describe, expect, it } from 'vitest';
import { LocalAnswerer } from '../../src/lib/ask/answerer';
import { realKnowledge } from './support/knowledge';

const bot = new LocalAnswerer(realKnowledge());

/** Real phrasings, typos and shorthand included, with the answer each should get. */
const EXPECTED: [string, string][] = [
  ['how many yrs of exp', 'experience'],
  ['Years of experience?', 'experience'],
  ['how long have you been working', 'experience'],
  ['total experience', 'experience'],
  ['how much work experience do you have', 'experience'],
  ['expereince', 'experience'],
  ['notice period?', 'notice-period'],
  ["what's your np", 'notice-period'],
  ['how long is your notice period', 'notice-period'],
  ['notise period', 'notice-period'],
  ['tell me abt the retry thing', 'case-auto-retry-framework'],
  ['The retry framework?', 'case-auto-retry-framework'],
  ['how do retries work', 'case-auto-retry-framework'],
  ['rcs billing', 'case-rcs-billing-pipeline'],
  ['how does the billing pipeline work', 'case-rcs-billing-pipeline'],
  ['spark jobs', 'case-rcs-billing-pipeline'],
  ['ai code reviewer', 'case-ai-code-reviewer'],
  ['the llm code review bot', 'case-ai-code-reviewer'],
  ['abandoned cart', 'case-abandoned-cart-recovery'],
  ['abandonned cart', 'case-abandoned-cart-recovery'],
  ['shopify project', 'case-abandoned-cart-recovery'],
  ['what did you do in your internship', 'internship'],
  ['were you an intern', 'internship'],
  ['current role', 'role'],
  ['where do you work', 'role'],
  ['tell me about yourself', 'role'],
  ['Tech stack?', 'stack'],
  ['what technologies do you use', 'stack'],
  ['which languages and frameworks', 'stack'],
  ['where are you based', 'location'],
  ['are you in blr', 'location'],
  ['open to relocation?', 'relocation'],
  ['wfh?', 'work-mode'],
  ['remote or office', 'work-mode'],
  ['ctc expectations', 'compensation'],
  ['expected salary', 'compensation'],
  ['when can you join', 'joining'],
  ['what roles are you looking for', 'role-types'],
  ['How do I reach you?', 'contact'],
  ['email address', 'contact'],
  ['linkedin', 'contact'],
  ['can I see your cv', 'resume'],
  ['download resume', 'resume'],
  ['which college did you go to', 'education'],
  ['cgpa', 'education'],
  ['any awards', 'awards'],
  ['employee of the month', 'awards'],
  ['certifications?', 'certification'],
  ['any production incidents', 'incidents'],
  ['mongodb memory issue', 'incident-inc-01'],
  ['fastapi memory leak', 'incident-inc-02'],
  ['what is the playground', 'playground'],
  ['what have you built', 'projects'],
];

/** Questions the site cannot answer: these must get the fallback, not a wrong answer. */
const OFF_TOPIC = [
  "what's the weather",
  'write me a poem',
  'who won the world cup',
  'tell me a joke',
  'what is 2+2',
  'recommend a good movie',
  'how do I cook pasta',
  'bitcoin price today',
  'translate hello into french',
  'what is the capital of france',
  'sing a song',
  'play some music',
];

describe('LocalAnswerer', () => {
  it.each(EXPECTED)('answers "%s" with %s', (question, id) => {
    expect(bot.answer(question)?.entry.id).toBe(id);
  });

  it.each(OFF_TOPIC)('falls back on "%s"', (question) => {
    expect(bot.answer(question)).toBeNull();
  });

  it('says hello, and explains itself when asked who it is', () => {
    expect(bot.answer('hi')?.entry.answer).toMatch(/^Hi!/);
    expect(bot.answer('who are you?')?.entry.answer).toMatch(/bot/);
    expect(bot.answer('thanks!')?.entry.answer).toMatch(/welcome/);
  });

  it('offers a close runner-up as "Did you mean…"', () => {
    expect(bot.answer('mongodb')?.alternatives.length).toBeGreaterThan(0);
  });
});
