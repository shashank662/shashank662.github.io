import type { Profile } from '../../data/profile';
import { monthsBetween, toAttr, type YearMonth } from '../dates';
import { plainText } from '../text';
import type { AskEntry } from './types';

/** The parts of a case study the bot uses; a content-collection entry's data fits this shape. */
export interface CaseData {
  order: number;
  title: string;
  results: string[];
  row: { description: string };
  ask: { alt: string[]; keywords: string[] };
}

export interface KnowledgeInput {
  profile: Profile;
  cases: { slug: string; data: CaseData }[];
  faq: AskEntry[];
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const monthYear = ([year, month]: YearMonth) => `${MONTHS[month - 1]} ${year}`;
const list = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);
const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`);

/** Every answer the bot knows, built from the same data the pages use, so no fact is written twice. */
export function buildKnowledge({ profile, cases, faq }: KnowledgeInput): AskEntry[] {
  const span = (id: 'education' | 'internship' | 'full-time') => {
    const found = profile.career.spans.find((s) => s.id === id);
    if (!found) throw new Error(`profile.career has no span with id "${id}"`);
    return found;
  };
  const education = span('education');
  const internship = span('internship');
  const fullTime = span('full-time');
  const internEnd = internship.end ?? internship.start;
  const internMonths = monthsBetween(internship.start, internEnd);
  const internRange = `${monthYear(internship.start)} – ${monthYear(internEnd)}`;
  const email = profile.links.email.replace(/^mailto:/, '');
  const sorted = [...cases].sort((a, b) => a.data.order - b.data.order);

  const about = { label: 'About', href: '/#about' };
  const contact = { label: 'Contact', href: '/#contact' };
  const incidents = { label: 'Incidents', href: '/#incidents' };

  return [
    {
      id: 'role',
      question: 'What do you do?',
      alt: ['current role', 'where do you work', 'current company', 'who is shashank', 'tell me about yourself', 'introduce yourself'],
      keywords: ['role', 'job', 'work', 'company', 'employer', 'current', 'engati', 'backend', 'engineer', 'shashank', 'yourself', 'introduce'],
      answer: profile.hero.intro,
      source: about,
    },
    {
      id: 'experience',
      question: 'How many years of experience do you have?',
      alt: ['years of experience', 'how long have you been working', 'total experience', 'work experience', 'how experienced are you'],
      keywords: ['experience', 'years', 'senior', 'seniority', 'yoe', 'long'],
      answer: `{since:${toAttr(fullTime.start)}} full-time at ${profile.company} (since ${monthYear(fullTime.start)}), after a ${internMonths}-month internship there (${internRange}).`,
      source: about,
    },
    {
      id: 'internship',
      question: 'What did you do in your internship?',
      alt: ['your internship', 'were you an intern', 'before full time'],
      keywords: ['internship', 'intern', 'trainee'],
      answer: `A ${internMonths}-month internship at ${profile.company} (${internRange}). ${internship.detail}`,
      source: { label: 'Abandoned-cart recovery', href: '/work/abandoned-cart-recovery' },
    },
    {
      id: 'stack',
      question: 'What is your tech stack?',
      alt: ['what technologies do you use', 'which languages and frameworks', 'what are your skills', 'do you know java'],
      keywords: ['stack', 'technologies', 'technology', 'skills', 'languages', 'frameworks', 'tools', 'java', 'spring', 'microservices'],
      answer: `${list(profile.strips.skills)}.`,
      source: about,
    },
    {
      id: 'location',
      question: 'Where are you based?',
      alt: ['where do you live', 'which city', 'location'],
      keywords: ['location', 'based', 'live', 'city', 'bangalore', 'india'],
      answer: `${profile.location}, India.`,
      source: about,
    },
    {
      id: 'education',
      question: 'What is your education?',
      alt: ['which college did you go to', 'what did you study', 'your degree'],
      keywords: ['education', 'college', 'university', 'degree', 'study', 'studied', 'cgpa', 'gpa', 'graduate', 'jss'],
      answer: `${education.name} (${education.start[0]} – ${education.end?.[0] ?? 'now'}). ${education.detail}`,
      source: about,
    },
    {
      id: 'awards',
      question: 'Any awards?',
      alt: ['recognition at work', 'achievements'],
      keywords: ['award', 'awards', 'recognition', 'achievement', 'employee', 'month'],
      answer: profile.awards.map(sentence).join(' '),
      source: about,
    },
    {
      id: 'certification',
      question: 'Any certifications?',
      alt: ['are you certified', 'certificates'],
      keywords: ['certification', 'certifications', 'certified', 'certificate'],
      answer: `${list(profile.certifications)}.`,
      source: about,
    },
    {
      id: 'contact',
      question: 'How do I reach you?',
      alt: ['how can I contact you', 'email address', 'linkedin profile', 'github profile', 'phone number'],
      keywords: ['contact', 'reach', 'email', 'mail', 'linkedin', 'github', 'connect', 'phone', 'call', 'hire'],
      answer: `Email is quickest: ${email}. LinkedIn and GitHub are linked in the Contact section.`,
      source: contact,
    },
    {
      id: 'resume',
      question: 'Can I see your résumé?',
      alt: ['download resume', 'send your cv'],
      keywords: ['resume', 'download', 'pdf'],
      answer: 'The résumé is a PDF: use the link below.',
      source: { label: 'Résumé (PDF)', href: profile.links.resume },
    },
    {
      id: 'projects',
      question: 'What have you built?',
      alt: ['your projects', 'show me your portfolio', 'what systems have you built'],
      keywords: ['projects', 'project', 'built', 'build', 'portfolio', 'systems', 'shipped'],
      answer: `At ${profile.company}: ${list(sorted.map((c) => c.data.title))}, plus a ${profile.work.brief.title.toLowerCase()} (${profile.work.brief.metric}).`,
      source: { label: 'Selected work', href: '/#work' },
    },
    ...sorted.map(({ slug, data }) => ({
      id: `case-${slug}`,
      question: `What is the ${data.title.toLowerCase()}?`,
      alt: data.ask.alt,
      keywords: data.ask.keywords,
      answer: [sentence(data.row.description), ...data.results.slice(0, 2).map(plainText)].join(' '),
      source: { label: data.title, href: `/work/${slug}` },
    })),
    {
      id: 'incidents',
      question: 'Any production incidents?',
      alt: ['war stories', 'postmortems', 'production issues', 'debugging stories', 'outages you fixed'],
      keywords: ['incident', 'incidents', 'postmortem', 'production', 'debugging', 'bug', 'bugs', 'war', 'stories'],
      answer: `Two write-ups: ${list(profile.incidents.items.map((i) => `${i.title.toLowerCase()} (${i.context})`))}.`,
      source: incidents,
    },
    ...profile.incidents.items.map((inc) => ({
      id: `incident-${inc.id.toLowerCase()}`,
      question: inc.title,
      alt: [inc.context],
      keywords: inc.keywords,
      answer: `${inc.impact} Cause: ${inc.cause} Fix: ${inc.fix}`,
      source: incidents,
    })),
    {
      id: 'playground',
      question: 'What is the playground?',
      alt: ['live demo', 'interactive demo', 'break something'],
      keywords: ['playground', 'simulation', 'simulate', 'demo', 'live'],
      answer: profile.playground.sub,
      source: { label: 'Playground', href: '/#play' },
    },
    ...faq,
  ];
}
