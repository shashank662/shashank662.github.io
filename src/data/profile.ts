import type { YearMonth } from '../lib/dates';

export interface Span {
  start: YearMonth;
  /** null means "still going" */
  end: YearMonth | null;
}

export interface Fact {
  /** An empty key adds a second line to the term above it, e.g. the internship under "engati". */
  key: string;
  value: string;
  /** When set, the duration is shown after the value, e.g. "(2y 2m)". */
  span?: Span;
  tone?: 'ok';
}

export interface CareerSpan extends Span {
  name: string;
  tag: string;
  level: 0 | 1 | 2;
  tone: 'muted' | 'ink' | 'accent';
  detail: string;
}

export interface Incident {
  id: string;
  context: string;
  title: string;
  impact: string;
  cause: string;
  fix: string;
  delta: string;
  deltaLabel: string;
  before: { label: string; width: number };
  after: { label: string; width: number };
}

export interface Profile {
  name: string;
  firstName: string;
  role: string;
  company: string;
  location: string;
  status: string;
  metaDescription: string;
  links: { email: string; linkedin: string; github: string; resume: string };
  hero: { label: string; intro: string; lede: string; badge: string; typedLines: string[] };
  sections: { n: string; label: string; href: string }[];
  strips: { skills: string[]; highlights: string[] };
  about: { paragraph: string; facts: Fact[] };
  career: { axisStart: YearMonth; title: string; sub: string; spans: CareerSpan[] };
  incidents: { title: string; sub: string; items: Incident[] };
  contact: { prompt: string; cta: string };
}

/** Everything the site says about its owner. Pages and components read from here. */
export const profile: Profile = {
  name: 'Shashank H R',
  firstName: 'Shashank',
  role: 'Backend Engineer',
  company: 'Engati',
  location: 'Bangalore',
  status: 'Open to SDE-2 roles',
  metaDescription:
    'Shashank H R, backend engineer at Engati in Bangalore. Java, Spring Boot and Kafka systems that handle millions of API calls a day. Open to SDE-2 roles.',
  links: {
    email: 'mailto:shashankhr06@gmail.com',
    linkedin: 'https://www.linkedin.com/in/shashank-hr-0606abc2002',
    github: 'https://github.com/shashank662',
    resume: '/resume.pdf',
  },
  hero: {
    label: 'Portfolio · 2026 edition',
    intro:
      'Backend engineer at Engati, Bangalore. 2+ years full-time (after a 6-month internship) building Java & Spring Boot services for a high-volume B2B messaging platform.',
    lede: 'I build *backends* that never wake anyone up at 3 a.m.',
    badge: 'Open to SDE-2 roles ✺ Bangalore ✺ 2026 ✺',
    typedLines: [
      '~2M api triggers a day · 50k–100k retries',
      'java · spring boot · kafka · redis · mongodb',
      'failure rate: 35% → 12%',
      'open to sde-2 roles · 2026',
    ],
  },
  sections: [
    { n: '01', label: 'About', href: '#about' },
    { n: '02', label: 'Experience', href: '#exp' },
    { n: '03', label: 'Work', href: '#work' },
    { n: '04', label: 'Incidents', href: '#incidents' },
    { n: '05', label: 'Playground', href: '#play' },
    { n: '06', label: 'Contact', href: '#contact' },
  ],
  strips: {
    skills: ['Java', 'Spring Boot', 'Apache Kafka', 'RabbitMQ', 'Redis', 'MongoDB', 'Spark', 'AWS S3', 'Microservices'],
    highlights: ['Open to SDE-2 roles', 'Employee of the Month ×2', 'MongoDB certified', 'CGPA 9.47', 'Bangalore'],
  },
  about: {
    paragraph:
      "I joined Engati as an intern in 2024, shipped a full-stack abandoned-cart flow within two sprints, and stayed to build its messaging backend: retry systems that ride out Meta delivery failures, Kafka pipelines that bill customers accurately, and an AI code reviewer my whole team now uses. I like queues, caches, clean APIs and [boring deploys.] Now I'm looking for my [next team.]",
    facts: [
      { key: 'based_in', value: 'Bangalore, IN' },
      { key: 'engati', value: 'SDE · Jul 2024 → now', span: { start: [2024, 7], end: null } },
      { key: '', value: 'intern · Jan → Jun 2024', span: { start: [2024, 1], end: [2024, 6] } },
      { key: 'stack', value: 'Java · Spring Boot · Kafka' },
      { key: 'education', value: 'B.E. ISE · CGPA 9.47' },
      { key: 'awards', value: 'Employee of the Month ×2 · “Always at 110%”' },
      { key: 'status', value: '● open to SDE-2 roles', tone: 'ok' },
    ],
  },
  career: {
    axisStart: [2020, 7],
    title: 'My career, *traced.*',
    sub: 'Read it like a request trace: my degree, internship, full-time role and the systems I built are spans on one timeline. Hover a row to open it.',
    spans: [
      { name: 'GET /career', tag: 'root span', level: 0, start: [2020, 8], end: null, tone: 'muted', detail: 'Everything so far. Still running, status 200.' },
      { name: 'B.E., Information Science', tag: 'JSS STU, Mysuru', level: 1, start: [2020, 8], end: [2024, 7], tone: 'ink', detail: 'JSS Science and Technology University, Mysuru. Graduated with a 9.47/10 CGPA.' },
      { name: 'Engati · SDE intern', tag: '6 months', level: 1, start: [2024, 1], end: [2024, 6], tone: 'accent', detail: 'Shipped a full-stack abandoned-cart recovery flow in one to two sprints, and hardened order validation and identity checks with senior engineers.' },
      { name: 'Abandoned-cart recovery', tag: 'shopify · duckdb · kafka', level: 2, start: [2024, 3], end: [2024, 3], tone: 'accent', detail: 'Shopify popup → @Async shopper lookups (our DB → Shopify GraphQL → DuckDB) → Kafka → branded short link → message. Designed and tested end to end.' },
      { name: 'Engati · Software Engineer', tag: 'full-time', level: 1, start: [2024, 7], end: null, tone: 'accent', detail: 'Java & Spring Boot microservices for a high-volume B2B SaaS messaging platform. Employee of the Month twice (“Always at 110%”).' },
      { name: 'Auto-retry framework', tag: 'java · redis · rabbitmq', level: 2, start: [2024, 10], end: null, tone: 'accent', detail: 'Failed Meta deliveries come back as webhooks; retryable ones are re-sent via RabbitMQ with back-off, keyed by a trackerId. ~2M triggers and 50K–100K retries a day. Failure rate 35% → 12%.' },
      { name: 'RCS billing pipeline', tag: 'kafka · s3 · spark', level: 2, start: [2025, 4], end: null, tone: 'accent', detail: 'Webhooks → Kafka → S3, aggregated by idempotent, replay-safe Spark jobs for accurate customer billing.' },
      { name: 'AI code reviewer', tag: 'spring boot · llm', level: 2, start: [2025, 9], end: null, tone: 'accent', detail: 'Reviews GitLab MRs with an LLM from a Slack trigger. ~20 developers, ~2 h → ~30 min per review, company award.' },
    ],
  },
  incidents: {
    title: 'War stories, *resolved.*',
    sub: 'Production problems I tracked down, written up the way a postmortem would be.',
    items: [
      {
        id: 'INC-01',
        context: 'MongoDB M20 · production',
        title: 'Cluster running out of memory',
        impact: 'Memory exhaustion on the production MongoDB cluster.',
        cause: 'Hot queries had no supporting index: ~3,000 documents scanned for every 5 returned.',
        fix: 'Indexed the high-frequency query fields; scan-to-return fell under 100:1.',
        delta: '−60%',
        deltaLabel: 'memory usage (cut by over 60%)',
        before: { label: '100%', width: 1 },
        after: { label: '<40%', width: 0.4 },
      },
      {
        id: 'INC-02',
        context: 'FastAPI · embeddings',
        title: 'A service quietly leaking memory',
        impact: 'Peak memory climbing to 2.5 GB on a critical service.',
        cause: 'String concatenation inside an embedding loop kept allocating new copies.',
        fix: 'Refactored the loop to in-place operations.',
        delta: '2.5 → 1 GB',
        deltaLabel: 'peak memory',
        before: { label: '2.5 GB', width: 1 },
        after: { label: '~1 GB', width: 0.4 },
      },
    ],
  },
  contact: {
    prompt: 'Got a role in mind?',
    cta: "Let's talk",
  },
};
