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

/** A dated entry in Experience: the degree or a role. */
export interface CareerSpan extends Span {
  /** Lets other parts of the site (the chatbot, the 60-second view) find this entry. */
  id: 'education' | 'internship' | 'full-time';
  name: string;
  /** Its name in the timeline's key, e.g. "Intern". */
  short: string;
  /** Its colour in the timeline. */
  tone: 'ink' | 'accent-soft' | 'accent';
  /** One short line for the Experience section. */
  line: string;
  /** The fuller account, for the chatbot. */
  detail: string;
  awards?: string[];
  within?: never;
}

/** Something built in a role: it links to its case study, with the number that sums it up and what it measures. */
export interface CareerProject {
  name: string;
  /** The role it was built in. */
  within: 'internship' | 'full-time';
  href: string;
  figure: string;
  caption: string;
  id?: never;
}

/** Work on this site that shows a skill in use. */
export type Proof = 'retry' | 'rcs' | 'ai' | 'cart' | 'mongo-incident' | 'leak-incident' | 'sandbox';

/** One row of the Stack section: a group from the résumé, and its skills with the work on this site that used them. */
export interface SkillGroup {
  group: string;
  skills: { name: string; usedIn?: Proof[] }[];
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
  /** Words the chatbot matches for this incident. */
  keywords: string[];
}

/** A row in Selected work. Case studies carry theirs in their Markdown file. */
export interface WorkRow {
  description: string;
  stack: string;
  metric: string;
  metricCaption: string;
  /** The hover card: a tag, a big number and a short label. */
  cardTag: string;
  cardMetric: string;
  cardLabel: string;
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
  /** `quick` invites people short on time to the 60-second view, in the first screen. */
  hero: {
    label: string;
    intro: string;
    quick: string;
    /** Flagship results shown straight under the intro, each linking to its proof. */
    proof: { metric: string; text: string; href: string }[];
    lede: string;
    badge: string;
    typedLines: string[];
  };
  sections: { n: string; label: string; href: string }[];
  strips: { skills: string[]; highlights: string[] };
  about: { paragraph: string; facts: Fact[] };
  certifications: string[];
  awards: string[];
  education: { degree: string; school: string; cgpa: string };
  /** The 60-second view: a one-line description and the top wins, each with its number. */
  summary: { description: string; wins: { metric: string; text: string; href: string }[] };
  /** The Stack section: the résumé's skills, grouped as on the résumé. */
  stack: { title: string; sub: string; proofs: Record<Proof, { label: string; href: string }>; groups: SkillGroup[] };
  career: { axisStart: YearMonth; title: string; sub: string; spans: (CareerSpan | CareerProject)[] };
  incidents: { title: string; sub: string; items: Incident[] };
  work: { title: string; brief: WorkRow & { title: string; more: string } };
  playground: { title: string; sub: string; canvasLabel: string };
  contact: { prompt: string; cta: string };
}

/** Dates that appear in several places (About facts, the career trace), kept in one spot. */
const STUDIES: Span = { start: [2020, 8], end: [2024, 7] };
const INTERNSHIP: Span = { start: [2024, 1], end: [2024, 6] };
const FULL_TIME: Span = { start: [2024, 7], end: null };
const AWARDS = ['Employee of the Month ×2 · “Always at 110%”', 'Company award for the AI code reviewer'];
const EDUCATION = { degree: 'B.E., Information Science', school: 'JSS Science and Technology University, Mysuru', cgpa: '9.47/10' };

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
    quick: 'Short on time? Read the 60-second summary',
    proof: [
      { metric: '45%', text: 'of failed deliveries recovered on the first retry', href: '/work/auto-retry-framework' },
      { metric: '~8M / day', text: 'billing events, each counted once, even on a re-run', href: '/work/rcs-billing-pipeline' },
      { metric: '30–60 min', text: 'daily review time per developer, down from ~2 h', href: '/work/ai-code-reviewer' },
    ],
    lede: 'I build *reliable backends* for high‑volume messaging.',
    badge: 'Open to SDE-2 roles ✺ Bangalore ✺ 2026 ✺',
    typedLines: [
      '~2M api triggers a day · 50k–100k retries',
      'java · spring boot · kafka · redis · mongodb',
      '45% of failed deliveries saved on 1st retry',
      'open to sde-2 roles · 2026',
    ],
  },
  sections: [
    { n: '01', label: 'About', href: '#about' },
    { n: '02', label: 'Stack', href: '#stack' },
    { n: '03', label: 'Experience', href: '#exp' },
    { n: '04', label: 'Work', href: '#work' },
    { n: '05', label: 'Incidents', href: '#incidents' },
    { n: '06', label: 'Playground', href: '#play' },
    { n: '07', label: 'Contact', href: '#contact' },
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
      { key: 'engati', value: 'SDE · Jul 2024 → now', span: FULL_TIME },
      { key: '', value: 'intern · Jan → Jun 2024', span: INTERNSHIP },
      { key: 'education', value: 'B.E. ISE · CGPA 9.47' },
      { key: 'awards', value: AWARDS[0] },
      { key: 'status', value: '● open to SDE-2 roles', tone: 'ok' },
    ],
  },
  certifications: ['MongoDB Associate Developer'],
  awards: AWARDS,
  education: EDUCATION,
  summary: {
    description:
      'Shashank H R in 60 seconds: backend engineer at Engati in Bangalore, his top wins with numbers, stack, education and résumé.',
    wins: [
      { metric: '45%', text: 'of failed deliveries recovered on the first retry, across ~2M API triggers a day', href: '/work/auto-retry-framework' },
      { metric: '2 h → 30–60 min', text: 'review time per developer per day for ~20 developers, with a company award', href: '/work/ai-code-reviewer' },
      { metric: '−60%', text: 'production MongoDB memory usage', href: '/#incidents' },
      { metric: '1–2 sprints', text: 'to ship a full-stack abandoned-cart flow as an intern', href: '/work/abandoned-cart-recovery' },
    ],
  },
  stack: {
    title: 'Stack',
    sub: 'The tools I work with, grouped as on my résumé. Pick one to see where I used it.',
    proofs: {
      retry: { label: 'Auto-retry framework', href: '/work/auto-retry-framework' },
      rcs: { label: 'RCS billing pipeline', href: '/work/rcs-billing-pipeline' },
      ai: { label: 'AI code reviewer', href: '/work/ai-code-reviewer' },
      cart: { label: 'Abandoned-cart recovery', href: '/work/abandoned-cart-recovery' },
      'mongo-incident': { label: 'Incident: cluster running out of memory', href: '/#incidents' },
      'leak-incident': { label: 'Incident: a service leaking memory', href: '/#incidents' },
      sandbox: { label: 'Prod sandbox', href: '/#work' },
    },
    // The groups and names are the résumé's own. usedIn lists only work shown on this site.
    groups: [
      { group: 'Languages', skills: [{ name: 'Java', usedIn: ['retry', 'cart'] }, { name: 'Python', usedIn: ['leak-incident'] }, { name: 'SQL' }] },
      {
        group: 'Backend',
        skills: [
          { name: 'Spring Boot', usedIn: ['retry', 'ai', 'cart'] },
          { name: 'REST APIs', usedIn: ['retry'] },
          { name: 'Microservices Architecture', usedIn: ['retry', 'cart'] },
        ],
      },
      {
        group: 'Messaging & Caching',
        skills: [{ name: 'Apache Kafka', usedIn: ['rcs', 'cart'] }, { name: 'RabbitMQ', usedIn: ['retry'] }, { name: 'Redis', usedIn: ['retry'] }],
      },
      {
        group: 'Data Engineering',
        skills: [{ name: 'Apache Spark', usedIn: ['rcs'] }, { name: 'Apache Iceberg' }, { name: 'Maxwell' }, { name: 'Change Data Capture (CDC)' }],
      },
      {
        group: 'Databases & Search',
        skills: [{ name: 'MongoDB', usedIn: ['retry', 'mongo-incident'] }, { name: 'MySQL' }, { name: 'Elasticsearch' }],
      },
      {
        group: 'Cloud & Infrastructure',
        skills: [
          { name: 'AWS S3', usedIn: ['rcs'] },
          { name: 'Docker' },
          { name: 'Nginx', usedIn: ['sandbox'] },
          { name: 'Jenkins' },
          { name: 'Git' },
          { name: 'CI/CD' },
        ],
      },
      {
        group: 'AI & LLM',
        skills: [{ name: 'LLM-based Applications', usedIn: ['ai'] }, { name: 'AI Agents', usedIn: ['ai'] }, { name: 'Runtime Python Tool Calls' }],
      },
      { group: 'Frontend', skills: [{ name: 'React' }] },
    ],
  },
  career: {
    axisStart: [2020, 7],
    title: 'Experience',
    sub: 'Two roles at Engati, and the degree before them. Each project links to its case study.',
    spans: [
      { id: 'education', name: EDUCATION.degree, short: 'B.E.', tone: 'ink', ...STUDIES, line: `JSS STU, Mysuru · CGPA ${EDUCATION.cgpa}`, detail: `${EDUCATION.school}. Graduated with a ${EDUCATION.cgpa} CGPA.` },
      { id: 'internship', name: 'Engati · SDE intern', short: 'Intern', tone: 'accent-soft', ...INTERNSHIP, line: 'Shipped a full-stack abandoned-cart flow in 1–2 sprints.', detail: 'Shipped a full-stack abandoned-cart recovery flow in one to two sprints, and hardened order validation and identity checks with senior engineers.' },
      { name: 'Abandoned-cart recovery', within: 'internship', href: '/work/abandoned-cart-recovery', figure: '1–2 sprints', caption: 'from design to production' },
      { id: 'full-time', name: 'Engati · Software Engineer', short: 'Software Engineer', tone: 'accent', ...FULL_TIME, line: 'Java & Spring Boot microservices for a high-volume messaging platform.', detail: 'Java & Spring Boot microservices for a high-volume B2B SaaS messaging platform.', awards: [AWARDS[0]] },
      { name: 'Auto-retry framework', within: 'full-time', href: '/work/auto-retry-framework', figure: '45%', caption: 'failed deliveries recovered on the first retry' },
      { name: 'RCS billing pipeline', within: 'full-time', href: '/work/rcs-billing-pipeline', figure: '~8M', caption: 'billing events a day' },
      { name: 'AI code reviewer', within: 'full-time', href: '/work/ai-code-reviewer', figure: '2 h → 30–60 min', caption: 'review time per developer per day' },
    ],
  },
  incidents: {
    title: 'Production incidents',
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
        keywords: ['mongodb', 'memory', 'index', 'indexes', 'indexing', 'query', 'queries', 'cluster', 'm20'],
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
        keywords: ['fastapi', 'python', 'memory', 'leak', 'leaking', 'embedding', 'embeddings'],
      },
    ],
  },
  work: {
    title: 'Selected work',
    brief: {
      title: 'Prod sandbox',
      description: 'Production-isolated test environment for engineering, FDE and support, built with Nginx rerouting',
      stack: 'Nginx',
      metric: '40–50 users',
      metricCaption: 'zero prod impact',
      cardTag: 'Platform',
      cardMetric: '40–50',
      cardLabel: 'people testing safely · zero production impact',
      more: 'A production-isolated sandbox built with Nginx rerouting. 40–50 people across engineering, FDE and support test there safely, with zero impact on production. I wrote its configuration, database and backend; the DevOps team scripted the Nginx routing.',
    },
  },
  playground: {
    title: 'The retry flow, simulated',
    sub: 'An interactive simulation of my Engati auto-retry framework; its numbers are illustrative, not production data. Triggers flow out to Meta; failures come back as webhooks, through the analytics pipeline, to trigger-mvc. Retryable ones wait in RabbitMQ with back-off, then go out again with their original payload, fetched from MongoDB by trackerId. Switch the framework off, or have Meta send a burst of error webhooks, and watch the failure rate.',
    canvasLabel:
      'Interactive simulation of the auto-retry framework, with illustrative numbers. Triggers travel from the integrations through the API gateway, trigger-mvc and the messaging pipeline to Meta; messaging keeps each trackerId in Redis. Failed deliveries come back through the webhook receiver and the analytics pipeline to trigger-mvc. Retryable ones wait in RabbitMQ, then trigger-mvc fetches the original payload from MongoDB and sends them again.',
  },
  contact: {
    prompt: 'Got a role in mind?',
    cta: 'Let’s talk',
  },
};
