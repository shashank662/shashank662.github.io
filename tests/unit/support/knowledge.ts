import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import { faq } from '../../../src/data/faq';
import { profile } from '../../../src/data/profile';
import { buildKnowledge, type CaseData } from '../../../src/lib/ask/knowledge';

const dir = join(import.meta.dirname, '../../../src/content/work');

/** The answers the site serves at /ask-index.json, built from the real content files. */
export function realKnowledge() {
  const cases = readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => ({
      slug: basename(file, '.md'),
      data: parse(readFileSync(join(dir, file), 'utf8').split(/^---$/m)[1]) as CaseData,
    }));
  return buildKnowledge({ profile, cases, faq });
}
