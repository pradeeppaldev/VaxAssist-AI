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
    title: 'Next Scheduled Immunization: MR — Dose 1',
    milestone: {
      vaccine: 'Measles-Rubella (MR - Dose 1)',
      dose: 'Booster (School Entry)',
      date: '12 October 2026',
      status: 'OVERDUE',
      countdown: '12 days overdue',
      clinic: 'Primary Health Center North',
    },
    whyItMatters:
      'The Measles-Rubella booster is an essential milestone under the National Immunization Schedule (NIS). It provides critical dual protection against measles complications and congenital rubella syndrome, reinforcing the primary infant dose.',
    clinicalPoints: [
      'Catch-up protocol: Administer immediately without restarting any earlier infant doses.',
      'Aarav’s recorded mild penicillin sensitivity is NOT a contraindication for the MR vaccine.',
      'Maintain a 4-week window before administering any subsequent live injectable vaccine.',
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
    query: "What should I know before Anaya's upcoming DPT booster?",
    timestamp: '10:28 AM',
    recipient: 'Ananya Sharma',
    relation: 'Daughter (4 mos)',
    title: 'Clinical Guidance: DPT Booster Preparation & Care',
    milestone: {
      vaccine: 'DPT Booster (Dose 1)',
      dose: 'Pre-school Booster (4-5 Years)',
      date: '29 October 2026',
      status: 'DUE',
      countdown: 'Due in 4 days',
      clinic: 'City Child Care Clinic, Sector 14',
    },
    whyItMatters:
      'Between 4 and 6 years, childhood antitoxin titers against diphtheria and tetanus naturally decline. The DPT booster reinforces long-term immune memory prior to regular school entry.',
    clinicalPoints: [
      'Expected mild reactions: Redness or mild swelling at the left upper arm site, low-grade fever (<101°F) within 24 to 48 hours.',
      'Home care: Apply clean cold compress over the injection site; maintain adequate fluid hydration.',
      'Pediatric contact: Contact Dr. Sunita Sharma if high persistent fever (>102°F) or inconsolable crying (>3 hours) occurs.',
      'Anaya’s clinic appointment is confirmed for Oct 29 at 10:30 AM.',
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
