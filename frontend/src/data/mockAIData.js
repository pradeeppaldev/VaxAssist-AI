/**
 * Centralized mock data structure for VaxAssist AI Assistant & RAG UI.
 * Follows realistic clinical immunization guidelines (UIP, WHO, IAP).
 */

export const CATEGORIZED_EXPLORATION_PROMPTS = [
  {
    category: 'Schedule',
    icon: 'Calendar',
    label: "Aarav's Next Milestone",
    question: "When is Aarav's next vaccination and what is scheduled?",
    description: "Inspect active milestone dates and overdue status",
  },
  {
    category: 'Catch-up',
    icon: 'RotateCcw',
    label: 'Missed Dose Protocol',
    question: 'What happens if a vaccination is missed or overdue by 12 days?',
    description: 'Learn about national catch-up guidelines without restarts',
  },
  {
    category: 'Guidance',
    icon: 'ShieldCheck',
    label: 'DPT Booster Preparation',
    question: "What should I know before Anaya's upcoming DPT booster?",
    description: 'Preparation, expected mild reactions, and home care',
  },
  {
    category: 'Records',
    icon: 'FileText',
    label: 'Family Vaccination History',
    question: "Show me a summary of Aarav's recorded vaccination history.",
    description: 'Review verified primary doses and certificate status',
  },
  {
    category: 'Family Overview',
    icon: 'Users',
    label: 'Action Needed Status',
    question: 'Which family members need immediate clinical attention?',
    description: 'Priority review of overdue and upcoming doses',
  },
];

export const DEFAULT_SOURCES_LIBRARY = [
  {
    id: 'src-nis-2024',
    title: 'National Immunization Schedule (NIS) — MoHFW India',
    type: 'National Clinical Standard',
    organization: 'Ministry of Health and Family Welfare (MoHFW)',
    section: 'Section 3.4 — Pediatric Booster Milestones (Ages 4-9)',
    page: 'Page 18',
    excerpt:
      'For children presenting with delayed Measles-Rubella (MR) primary or booster doses, catch-up vaccination should be administered at the earliest presentation without restarting previous infant series. A minimum 4-week interval between live injectable vaccines must be observed unless co-administered simultaneously at distinct anatomical sites.',
    confidence: 96,
    year: '2024 Edition',
    url: 'https://main.mohfw.gov.in/immunization-guidelines',
  },
  {
    id: 'src-who-mr-2023',
    title: 'WHO Position Paper on Measles & Rubella Vaccines',
    type: 'Global Health Guideline',
    organization: 'World Health Organization (WHO)',
    section: 'Chapter 4 — Catch-up Strategies in School-Age Cohorts',
    page: 'Page 42',
    excerpt:
      'Measles and Rubella combination vaccines provide >95% protective efficacy against both viral pathogens following a complete two-dose sequence. Delayed doses retain full immunogenicity; immunity debt is prevented once the catch-up booster is successfully introduced regardless of minor interval extensions.',
    confidence: 94,
    year: '2023 Revision',
    url: 'https://www.who.int/publications/mr-position-paper',
  },
  {
    id: 'src-iap-dpt-2024',
    title: 'Indian Academy of Pediatrics (IAP) Guidebook on Immunization',
    type: 'Pediatric Practice Guideline',
    organization: 'Advisory Committee on Vaccines and Immunization Practices (ACVIP)',
    section: 'Guidelines on DPT Booster 1 (Age 4-6 Years)',
    page: 'Page 67',
    excerpt:
      'DPT booster between 4 and 6 years of age sustains protective antitoxin titers against diphtheria and tetanus ahead of school entry. Expected mild reactions include low-grade pyrexia (<38.5°C) and transient local induration resolving within 48 to 72 hours with cold compresses.',
    confidence: 92,
    year: '2024-25',
    url: 'https://iapindia.org/immunization-acvip-guidelines',
  },
  {
    id: 'src-cdc-coadmin-2024',
    title: 'General Best Practice Guidelines for Immunization',
    type: 'Clinical Immunobiology Guideline',
    organization: 'Advisory Committee on Immunization Practices (ACIP)',
    section: 'Timing and Spacing of Immunobiologics: Simultaneous Administration',
    page: 'Page 12',
    excerpt:
      'Inactivated vaccines such as annual quadrivalent influenza can be safely co-administered with routine childhood or adult vaccines (such as DPT or Tdap) on the same day at different anatomical injection sites without immunologic interference or increased reactogenicity.',
    confidence: 95,
    year: '2024 Guideline',
    url: 'https://www.cdc.gov/vaccines/best-practices/co-administration',
  },
];

export const INITIAL_CONVERSATION_HISTORY = [
  {
    id: 'conv-1',
    title: "Aarav's MR-1 Overdue & Catch-Up",
    date: 'Today, 10:24 AM',
    messageCount: 2,
    memberContext: 'Aarav Sharma (Son, 6 yrs)',
  },
  {
    id: 'conv-2',
    title: "Ananya's 14-Week Pentavalent & OPV",
    date: 'Yesterday, 3:15 PM',
    messageCount: 2,
    memberContext: 'Ananya Sharma (Daughter, 4 mos)',
  },
  {
    id: 'conv-3',
    title: 'Seasonal Flu Shot Co-Administration',
    date: 'Oct 20, 2026',
    messageCount: 2,
    memberContext: 'Entire Family',
  },
];

export const STRUCTURED_DEMO_EXCHANGES = [
  {
    id: 'ex-1',
    query: "When is Aarav's next vaccination and what is scheduled?",
    timestamp: '10:24 AM',
    recipient: 'Aarav Sharma',
    relation: 'Son (6 yrs)',
    title: 'Next Scheduled Immunization: DPT Booster 2 (Age 5-6 Years)',
    milestone: {
      vaccine: 'DPT Booster 2 (Age 5-6 Years)',
      dose: 'Booster 2 (School Entry)',
      date: '10 July 2026',
      status: 'OVERDUE',
      countdown: 'Overdue by 2 months',
      clinic: 'Lilavati Hospital & Research Centre',
    },
    whyItMatters:
      'Between 5 and 6 years of age, immunity against diphtheria, pertussis, and tetanus requires booster reinforcement prior to elementary school entry under Universal Immunization Programme (UIP) guidelines.',
    clinicalPoints: [
      'Catch-up protocol: Administer immediately without restarting any earlier infant doses or primary series.',
      'Aarav’s completed 3-dose Pentavalent and DPT Booster 1 series provides solid immunological priming.',
      'Next routine milestones will be Td at 10 years and 16 years of age.',
      'Available free of charge at Primary Health Center North or through your registered pediatrician.',
    ],
    sources: [DEFAULT_SOURCES_LIBRARY[0], DEFAULT_SOURCES_LIBRARY[1]],
    primaryAction: {
      label: 'View in Schedule',
      href: '/schedule',
    },
    secondaryAction: {
      label: 'View Aarav’s Records',
      href: '/family/fam-1',
    },
  },
  {
    id: 'ex-2',
    query: "Can Ananya receive Pentavalent 3, OPV 3, and Rotavirus 3 together at 14 weeks?",
    timestamp: '10:28 AM',
    recipient: 'Ananya Sharma',
    relation: 'Daughter (15 wks)',
    title: 'Clinical Guidance: 14-Week Primary Immunization Milestone',
    milestone: {
      vaccine: 'Pentavalent 3, OPV 3 & Rota 3',
      dose: 'Dose 3 (14 Weeks)',
      date: '18 September 2026',
      status: 'OVERDUE',
      countdown: '13 days overdue',
      clinic: 'Bandra Urban Primary Health Center',
    },
    whyItMatters:
      'At 14 weeks, completion of the primary infant immunization series provides critical protection against DTP, Hepatitis B, Haemophilus influenzae b, Polio, and severe Rotaviral gastroenteritis.',
    clinicalPoints: [
      'Co-administration: Co-administering Pentavalent, OPV, and Rotavirus vaccine at the same visit is completely safe and standard under national UIP protocols.',
      'Administration sites: Pentavalent is given intramuscularly in the anterolateral thigh, while OPV and Rotavirus are given as oral drops.',
      'Expected mild reactions: Low-grade fever (<101°F) or mild irritability for 24-48 hours. Continue frequent hydration and breastfeeding.',
      'Safe catch-up: Proceed with administration immediately to maintain continuous immunity.',
    ],
    sources: [DEFAULT_SOURCES_LIBRARY[2]],
    primaryAction: {
      label: 'View Anaya’s Schedule',
      href: '/schedule',
    },
    secondaryAction: {
      label: 'Log Administered Dose',
      href: '/vaccinations',
    },
  },
];
