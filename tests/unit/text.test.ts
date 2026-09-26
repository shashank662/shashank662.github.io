import { describe, expect, it } from 'vitest';
import { emphasize, escapeHtml } from '../../src/lib/text';

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
});
