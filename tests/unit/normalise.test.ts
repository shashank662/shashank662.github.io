import { describe, expect, it } from 'vitest';
import { tokens } from '../../src/lib/ask/normalise';

describe('tokens', () => {
  it('expands the shorthand people type', () => {
    expect(tokens('how many yrs of exp')).toEqual(['many', 'year', 'experience']);
    expect(tokens('np?')).toEqual(['notice', 'period']);
    expect(tokens('wfh')).toEqual(['remote']);
    expect(tokens('ctc')).toEqual(['compensation']);
    expect(tokens('blr')).toEqual(['bangalore']);
    expect(tokens('tech')).toEqual(['stack']);
  });

  it('drops punctuation, accents and filler words', () => {
    expect(tokens("What's your résumé?!")).toEqual(['resume']);
    expect(tokens('What is the retry framework?')).toEqual(['retry', 'framework']);
  });

  it('stems plurals so "retries" finds "retry"', () => {
    expect(tokens('retries and back-offs')).toEqual(['retry', 'back', 'off']);
  });

  it('ignores single characters, so "2+2" matches nothing', () => {
    expect(tokens('what is 2+2')).toEqual([]);
  });
});
