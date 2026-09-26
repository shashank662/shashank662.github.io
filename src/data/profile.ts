/** Everything the site says about its owner. Pages and components read from here. */
export const profile = {
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
      'retrying ~2M third-party api calls a day',
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
} as const;
