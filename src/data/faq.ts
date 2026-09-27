import type { AskEntry } from '../lib/ask/types';
import { profile } from './profile';

const contact = { label: 'Contact', href: '/#contact' };
const about = { label: 'About', href: '/#about' };

/**
 * Hand-written answers to common recruiter questions (spec §9).
 * PLACEHOLDERS: relocation and work mode wait for the owner's answers (spec §15, item 9).
 * Until then they point people to Shashank instead of stating anything he hasn't said.
 */
export const faq: AskEntry[] = [
  {
    id: 'notice-period',
    question: 'What is your notice period?',
    alt: ['how soon can you leave your job', 'are you serving notice'],
    keywords: ['notice', 'period', 'serving'],
    answer: 'Shashank is an immediate joiner: no notice period.',
    source: contact,
  },
  {
    id: 'joining',
    question: 'When can you join?',
    alt: ['earliest joining date', 'how soon can you start', 'start date', 'are you an immediate joiner'],
    keywords: ['join', 'joining', 'start', 'available', 'availability', 'immediate'],
    answer: 'Immediately. Shashank has no notice period to serve.',
    source: contact,
  },
  {
    id: 'relocation',
    question: 'Are you open to relocation?',
    alt: ['would you relocate', 'preferred cities', 'which cities', 'move to another city'],
    keywords: ['relocate', 'relocation', 'cities', 'move', 'shift'],
    answer: `He is based in ${profile.location}. For roles in other cities, ask him directly.`,
    source: about,
  },
  {
    id: 'work-mode',
    question: 'Remote, hybrid or office?',
    alt: ['do you work remotely', 'work from home', 'hybrid work', 'office or remote'],
    keywords: ['remote', 'hybrid', 'office', 'onsite', 'mode'],
    answer: 'Ask Shashank about remote, hybrid or office work: he will answer directly.',
    source: contact,
  },
  {
    id: 'role-types',
    question: 'What roles are you looking for?',
    alt: ['what kind of job are you looking for', 'which positions', 'are you open to work'],
    keywords: ['roles', 'position', 'positions', 'opportunity', 'looking', 'hiring', 'open', 'sde2', 'sde'],
    answer: `${profile.status}: backend roles working with Java, Spring Boot and distributed systems.`,
    source: about,
  },
  {
    id: 'compensation',
    question: 'What are your salary expectations?',
    alt: ['expected ctc', 'current ctc', 'what do you earn'],
    keywords: ['compensation', 'pay', 'package', 'lpa', 'expectation', 'expected'],
    answer: 'Happy to discuss compensation on a call.',
    source: contact,
  },
];
