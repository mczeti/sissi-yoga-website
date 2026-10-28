// Strukturierte Daten (schema.org), seitenweit über Layout.astro ausgegeben.
// Seiten verweisen per '@id' auf Business und Person, statt sie neu zu beschreiben.

export const SITE = 'https://sissiyoga.at'
export const BUSINESS_ID = `${SITE}/#business`
export const PERSON_ID = `${SITE}/#sissi`
export const WEBSITE_ID = `${SITE}/#website`

export const ORTE = ['Purkersdorf', 'Pressbaum', 'Tullnerbach']

export const website = {
  '@type': 'WebSite',
  '@id': WEBSITE_ID,
  url: `${SITE}/`,
  name: 'Sissi – Familien Yogazeit',
  inLanguage: 'de-AT',
  publisher: { '@id': BUSINESS_ID },
}

export const business = {
  '@type': ['LocalBusiness', 'SportsActivityLocation'],
  '@id': BUSINESS_ID,
  name: 'Sissi – Familien Yogazeit',
  alternateName: ['Sissi Familien Yogazeit', 'familien · yogazeit', 'Sissi Yoga'],
  description:
    'Yogaangebot von Elisabeth „Sissi“ Zehetner im Wienerwald (Niederösterreich): Kinderyoga, Yoga in der Schwangerschaft, Mama-Baby-Yoga, Seniorenyoga, Vinyasa Yoga sowie Workshops für Kindergärten und Schulen in Purkersdorf, Pressbaum und Tullnerbach.',
  url: `${SITE}/`,
  image: `${SITE}/images/Kinderyoga-64.JPG`,
  logo: `${SITE}/logos/logo-colored.png`,
  telephone: '+436604860304',
  email: 'sissi.zehetner@gmail.com',
  founder: { '@id': PERSON_ID },
  employee: { '@id': PERSON_ID },
  areaServed: [
    ...ORTE.map((name) => ({ '@type': 'City', name, containedInPlace: { '@type': 'AdministrativeArea', name: 'Niederösterreich' } })),
    { '@type': 'Place', name: 'Wienerwald' },
  ],
  knowsAbout: ['Yoga', 'Vinyasa Yoga', 'Slow Vinyasa', 'Yoga Nidra', 'Kinderyoga', 'Familienyoga', 'Yoga in der Schwangerschaft', 'Pränatal-Yoga', 'Postnatal-Yoga', 'Rückbildungsyoga', 'Mama-Baby-Yoga', 'Seniorenyoga', 'Traumapädagogik'],
  sameAs: ['https://www.instagram.com/sissi.familien.yogazeit/'],
}

export const person = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Elisabeth Zehetner',
  alternateName: 'Sissi',
  jobTitle: 'Yogalehrerin',
  description:
    'Yogalehrerin im Wienerwald mit Ausbildungen in Kinderyoga, Prä- & Postnatal-Yoga und Ashtanga Yoga, Traumapädagogin und ausgebildete Kindergartenpädagogin.',
  url: `${SITE}/ueber-mich`,
  image: `${SITE}/images/sissi-ueberuns-1.jpeg`,
  worksFor: { '@id': BUSINESS_ID },
  sameAs: ['https://www.instagram.com/sissi.familien.yogazeit/'],
  alumniOf: { '@type': 'EducationalOrganization', name: 'BAKIP Amstetten' },
  hasCredential: [
    { name: 'Ashtanga Yoga', recognizedBy: 'Yoga Werkstatt', dateCreated: '2025' },
    { name: 'Prä- & Postnatal-Yoga', dateCreated: '2022' },
    { name: 'Kinderyoga-Lehrerin', dateCreated: '2021' },
    { name: 'Traumapädagogin', dateCreated: '2021' },
    { name: 'Kindergartenpädagogin (BAKIP Amstetten)', dateCreated: '2010' },
  ].map(({ recognizedBy, ...c }) => ({
    '@type': 'EducationalOccupationalCredential',
    credentialCategory: 'Zertifikat',
    ...c,
    ...(recognizedBy && { recognizedBy: { '@type': 'Organization', name: recognizedBy } }),
  })),
}

export interface FaqItem {
  frage: string
  antwort: string
}

export function faqPage(items: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map(({ frage, antwort }) => ({
      '@type': 'Question',
      name: frage,
      acceptedAnswer: { '@type': 'Answer', text: antwort },
    })),
  }
}

export function breadcrumb(name: string, path: string) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name, item: new URL(path, SITE).href },
    ],
  }
}

/** Kurs als Service, verknüpft mit Business und Lehrerin. */
export function kurs(opts: { name: string; description: string; path: string; orte: string[]; zielgruppe?: string }) {
  return {
    '@type': 'Service',
    name: opts.name,
    serviceType: 'Yoga',
    description: opts.description,
    url: new URL(opts.path, SITE).href,
    provider: { '@id': BUSINESS_ID },
    areaServed: opts.orte.map((name) => ({ '@type': 'City', name })),
    ...(opts.zielgruppe && { audience: { '@type': 'Audience', audienceType: opts.zielgruppe } }),
  }
}
