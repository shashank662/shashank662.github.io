import { describe, expect, it } from 'vitest';
import { accentWords, emphasize, escapeHtml, plainText } from '../../src/lib/text';

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });
});

describe('emphasize', () => {
  it('turns *word* into an <em> element', () => {
    expect(emphasize('I build *backends* that stay up.')).toBe('I build <em>backends</em> that stay up.');
  });

  it('handles several emphasised phrases', () => {
    expect(emphasize('*one* and *two words*')).toBe('<em>one</em> and <em>two words</em>');
  });

  it('escapes HTML before adding emphasis', () => {
    expect(emphasize('<script>*x*</script>')).toBe('&lt;script&gt;<em>x</em>&lt;/script&gt;');
  });

  it('leaves text without markers unchanged', () => {
    expect(emphasize('plain text')).toBe('plain text');
  });

  it('turns **words** into a <strong> element alongside *emphasis*', () => {
    expect(emphasize('cut from **35% to 12%**, *fast*')).toBe('cut from <strong>35% to 12%</strong>, <em>fast</em>');
  });
});

describe('accentWords', () => {
  it('splits text into words and marks the ones inside [brackets]', () => {
    expect(accentWords('I like [boring deploys.] Now')).toEqual([
      { word: 'I', accent: false },
      { word: 'like', accent: false },
      { word: 'boring', accent: true },
      { word: 'deploys.', accent: true },
      { word: 'Now', accent: false },
    ]);
  });

  it('returns plain words when there are no brackets', () => {
    expect(accentWords('just  plain text')).toEqual([
      { word: 'just', accent: false },
      { word: 'plain', accent: false },
      { word: 'text', accent: false },
    ]);
  });

  it('returns nothing for empty text', () => {
    expect(accentWords('')).toEqual([]);
  });
});

describe('plainText', () => {
  it('drops the emphasis markers', () => {
    expect(plainText('about *2 million* triggers, **35% to 12%**')).toBe('about 2 million triggers, 35% to 12%');
  });
});
