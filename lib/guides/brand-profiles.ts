export type BrandProfileConfig = {
  path: string
  title: string
  description: string
  brandName: string
  locationLabel: string
  city: string
  bestFor: string
  onSiteHousing: string
  pricingBand: string
  trainingStyle: string
  namePatterns: string[]
  slugHint?: string
  heroFallback: string
  datePublished: string
  dateModified: string
  editorial: string[]
  suburbGuideHref?: string
  cityGuideHref: string
  alternativeLocation: string
  alternativeCtaLabel: string
  alternativeCtaUrl: string
  alternativeHeading: string
  alternativeLimit?: number
  faq: Array<{ q: string; a: string }>
  breadcrumbs: Array<{ label: string; href: string }>
  relatedGuides: Array<{ title: string; href: string }>
}

export const TIGER_MUAY_THAI: BrandProfileConfig = {
  path: '/blog/tiger-muay-thai-review-packages',
  title: 'Tiger Muay Thai Review & Packages: 2026 Price Guide',
  description:
    'An objective look at Tiger Muay Thai packages, training schedules, and housing. Compare pricing and find available alternatives in Chalong.',
  brandName: 'Tiger Muay Thai & MMA',
  locationLabel: 'Chalong, Phuket',
  city: 'Phuket',
  bestFor: 'Full-time fight camp volume, MMA cross-training, Fitness Street culture',
  onSiteHousing: 'Yes (on-site tiers and partner villas)',
  pricingBand: 'Mid to premium; weekly and monthly camp tiers vary by room class',
  trainingStyle: 'Twice-daily group Muay Thai, MMA, BJJ, and fitness classes on Soi Ta Iad',
  namePatterns: ['Tiger Muay Thai', 'Tiger MMA'],
  slugHint: 'tiger',
  heroFallback: '/IMG_3557_246c0a62-a253-4f95-abfd-9cb306228c6c.jpg',
  datePublished: '2026-06-11',
  dateModified: '2026-06-11',
  editorial: [
    'Tiger Muay Thai sits on Soi Ta Iad in Chalong, the strip foreigners call Fitness Street. The camp runs high-volume Muay Thai and MMA schedules with on-site housing, a restaurant, and pools. Travelers book Tiger when they want camp accountability and name recognition, not a quiet boutique gym.',
    'Package tiers split training access from room class. Confirm whether your quote includes all classes or Muay Thai only, and whether your room is on-site or at a partner villa up the hill. If Tiger is sold out for your dates, Chalong has bookable alternatives with accommodation on CombatStay.',
  ],
  suburbGuideHref: '/blog/best-muay-thai-gyms/chalong',
  cityGuideHref: '/blog/best-muay-thai-gyms-phuket',
  alternativeLocation: 'Chalong',
  alternativeCtaLabel: 'View available Chalong camps',
  alternativeCtaUrl: '/search?country=Thailand&location=Chalong&discipline=Muay%20Thai&accommodation=true',
  alternativeHeading:
    'Tiger Muay Thai packages are not verified on CombatStay yet. Compare top-rated, instantly bookable alternatives in Chalong:',
  alternativeLimit: 3,
  faq: [
    {
      q: 'How much do Tiger Muay Thai packages cost?',
      a: 'Tiger sells tiered training-and-stay packages that change by season and room type. Expect training-only days to cost less than full board with a private AC room. Confirm the current rate on Tiger’s official site before you fly; this page focuses on how to compare against bookable Chalong camps.',
    },
    {
      q: 'Does Tiger Muay Thai include accommodation?',
      a: 'Yes. Standard packages include on-site rooms or partner housing near the main camp. Room tier drives price more than the mat fee. Ask whether your assigned building is walkable to morning class.',
    },
    {
      q: 'Is Tiger Muay Thai good for beginners?',
      a: 'Tiger runs beginner through advanced classes, but volume and heat can overwhelm week-one travelers. If you want a softer first trip, shortlist a Chalong camp with fundamentals blocks and book through CombatStay where cancellation terms are visible upfront.',
    },
    {
      q: 'Where is Tiger Muay Thai located?',
      a: '7/1 Moo 5, Soi Ta Iad, Chalong, Phuket. You are 15–25 minutes from Rawai and Nai Harn depending on traffic.',
    },
    {
      q: 'Can I book Tiger Muay Thai on CombatStay?',
      a: 'Tiger is not live for instant booking on CombatStay at the time this guide was published. Use the Chalong alternatives below for verified listings with live prices, or check Tiger’s site for direct camp quotes.',
    },
  ],
  breadcrumbs: [
    { label: 'Training Guides', href: '/blog' },
    { label: 'Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
    { label: 'Chalong', href: '/blog/best-muay-thai-gyms/chalong' },
  ],
  relatedGuides: [
    { title: 'Muay Thai camp Phuket with accommodation', href: '/blog/muay-thai-camp-phuket-with-accommodation' },
    { title: 'LUDUS Sports Complex Chalong guide', href: '/blog/ludus-sports-complex-chalong-phuket' },
    { title: 'Best Muay Thai gyms in Chalong', href: '/blog/best-muay-thai-gyms/chalong' },
  ],
}

export const BANGTAO_MMA: BrandProfileConfig = {
  path: '/blog/bangtao-muay-thai-mma-prices',
  title: 'Bangtao Muay Thai & MMA: 2026 Prices & Stays',
  description:
    'Explore updated training packages and camp costs at Bangtao Muay Thai & MMA. View facilities, accommodation availability, and booking options.',
  brandName: 'Bangtao Muay Thai & MMA',
  locationLabel: 'Bang Tao, Phuket',
  city: 'Phuket',
  bestFor: 'West-coast Phuket base, Muay Thai plus MMA, travelers near Laguna and Boat Avenue',
  onSiteHousing: 'Yes (camp rooms and nearby partner stays)',
  pricingBand: 'Mid-range weekly bundles; private room upgrades add cost',
  trainingStyle: 'Muay Thai, MMA, and fitness classes with tourist and fighter tracks',
  namePatterns: ['Bangtao Muay Thai', 'Bang Tao Muay Thai', 'Bangtao MMA'],
  slugHint: 'bangtao',
  heroFallback: '/phuket.jpg',
  datePublished: '2026-06-11',
  dateModified: '2026-06-11',
  editorial: [
    'Bangtao Muay Thai & MMA serves the Bang Tao and Cherngtalay corridor on Phuket’s west coast. The camp pairs pad work with MMA classes for travelers who want a beach-adjacent base without committing to Fitness Street in Chalong.',
    'Room and package pricing shifts by season. Compare whether your quote covers one or two daily sessions, and how far your room sits from the ring. If Bangtao is full, Bang Tao and Cherngtalay listings on CombatStay show live alternatives with accommodation flags.',
  ],
  suburbGuideHref: '/blog/best-muay-thai-gyms/bang-tao',
  cityGuideHref: '/blog/best-muay-thai-gyms-phuket',
  alternativeLocation: 'Bang Tao',
  alternativeCtaLabel: 'View Bang Tao camps',
  alternativeCtaUrl: '/search?country=Thailand&location=Bang%20Tao&discipline=Muay%20Thai&accommodation=true',
  alternativeHeading:
    'Bangtao Muay Thai & MMA is not verified on CombatStay yet. Compare instantly bookable alternatives in Bang Tao:',
  alternativeLimit: 3,
  faq: [
    {
      q: 'How much does Bangtao Muay Thai & MMA cost?',
      a: 'Weekly training-and-stay bundles typically run mid-range for Phuket west coast. Private AC rooms cost more than shared dorm tiers. Confirm meal inclusion on the quote you receive.',
    },
    {
      q: 'Does Bangtao offer on-site accommodation?',
      a: 'Yes. The camp lists on-site and partner housing for training guests. Verify AC, bathroom type, and walk time to the gym floor before you pay.',
    },
    {
      q: 'Bang Tao or Chalong for Muay Thai?',
      a: 'Chalong clusters famous fight camps on Fitness Street. Bang Tao suits travelers who want west-coast beaches and restaurants with a shorter commute to Bang Tao beach. Pick based on where you will sleep, not only the gym logo.',
    },
    {
      q: 'Can I book Bangtao on CombatStay?',
      a: 'Bangtao is not live for instant booking on CombatStay at publish time. Browse Bang Tao listings below for verified alternatives.',
    },
  ],
  breadcrumbs: [
    { label: 'Training Guides', href: '/blog' },
    { label: 'Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
    { label: 'Bang Tao', href: '/blog/best-muay-thai-gyms/bang-tao' },
  ],
  relatedGuides: [
    { title: 'Muay Thai camp Phuket with accommodation', href: '/blog/muay-thai-camp-phuket-with-accommodation' },
    { title: 'Best Muay Thai gyms in Bang Tao', href: '/blog/best-muay-thai-gyms/bang-tao' },
    { title: 'Best Muay Thai gyms in Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
  ],
}

export const AKA_THAILAND: BrandProfileConfig = {
  path: '/blog/aka-thailand-reviews-booking',
  title: 'AKA Thailand Reviews, Packages & Booking Guide [2026]',
  description:
    'Planning to train at AKA Thailand? Read real fighter reviews, inspect training camp packages, and view premium stay-and-train alternatives.',
  brandName: 'AKA Thailand',
  locationLabel: 'Phuket (MMA / Muay Thai resort camp)',
  city: 'Phuket',
  bestFor: 'MMA and Muay Thai cross-training, resort-style camp, UFC alumni coaching network',
  onSiteHousing: 'Yes (on-site resort rooms)',
  pricingBand: 'Premium; Standard, Deluxe, and Gold package tiers',
  trainingStyle: 'Muay Thai, MMA, BJJ, yoga, and strength blocks in a resort campus',
  namePatterns: ['AKA Thailand', 'AKA Thailand Resort'],
  slugHint: 'aka',
  heroFallback: '/481020258.avif',
  datePublished: '2026-06-11',
  dateModified: '2026-06-11',
  editorial: [
    'AKA Thailand built its name on MMA and Muay Thai cross-training in a resort-style campus. Packages range from training plus room to Gold tiers with private sessions and meal plans. Fighters book AKA when they want multiple disciplines under one roof.',
    'Gold and Deluxe tiers add cost fast. Read what each tier includes before you compare against simpler Muay Thai-only camps. If AKA is unavailable, Phuket listings with accommodation on CombatStay show live prices for instant booking.',
  ],
  suburbGuideHref: '/blog/best-muay-thai-gyms-phuket',
  cityGuideHref: '/blog/best-muay-thai-gyms-phuket',
  alternativeLocation: 'Phuket',
  alternativeCtaLabel: 'View Phuket stay-and-train camps',
  alternativeCtaUrl: '/search?country=Thailand&location=Phuket&discipline=Muay%20Thai&accommodation=true',
  alternativeHeading:
    'AKA Thailand is not verified on CombatStay yet. Compare premium stay-and-train alternatives in Phuket:',
  alternativeLimit: 3,
  faq: [
    {
      q: 'What packages does AKA Thailand offer?',
      a: 'AKA historically sells Standard (training plus room), Deluxe (adds private sessions), and Gold (adds meal plans and extras). Names and inclusions change; verify on AKA’s official booking flow.',
    },
    {
      q: 'Is AKA Thailand good for Muay Thai only?',
      a: 'Yes, but you pay for the full MMA and resort stack. Pure Muay Thai travelers often get better value at a Thai-run camp unless they want the AKA facility bundle.',
    },
    {
      q: 'Does AKA include meals?',
      a: 'Gold-tier packages include structured meal plans at the camp restaurant. Lower tiers may not. Confirm before checkout.',
    },
    {
      q: 'Can I book AKA Thailand on CombatStay?',
      a: 'AKA is not live for instant booking on CombatStay at publish time. Use Phuket alternatives below or AKA’s direct site.',
    },
  ],
  breadcrumbs: [
    { label: 'Training Guides', href: '/blog' },
    { label: 'Phuket', href: '/blog/best-muay-thai-gyms-phuket' },
  ],
  relatedGuides: [
    { title: 'Best Muay Thai gyms in Chalong', href: '/blog/best-muay-thai-gyms/chalong' },
    { title: 'Best MMA camps in Thailand', href: '/blog/best-mma-camps-thailand' },
    { title: 'Muay Thai camp Phuket with accommodation', href: '/blog/muay-thai-camp-phuket-with-accommodation' },
    { title: 'Phuket fighter conditioning gyms', href: '/blog/phuket-fighter-conditioning-gyms' },
  ],
}

export const FAIRTEX_PATTAYA: BrandProfileConfig = {
  path: '/blog/fairtex-training-center-pattaya-packages',
  title: 'Fairtex Training Center Pattaya: Packages & Review',
  description:
    'Inside look at Fairtex Training Center Pattaya. View legendary Muay Thai training packages, on-site hotel rates, and book your camp.',
  brandName: 'Fairtex Training Center Pattaya',
  locationLabel: 'Pattaya',
  city: 'Pattaya',
  bestFor: 'Fairtex-brand gear culture, on-site hotel, beginners and fighters wanting a large campus',
  onSiteHousing: 'Yes (Fairtex hotel on property)',
  pricingBand: 'Mid-range to premium depending on room and session count',
  trainingStyle: 'Muay Thai, boxing, and fitness with multiple daily group blocks',
  namePatterns: ['Fairtex Training Center', 'Fairtex Pattaya', 'Fairtex Muay Thai'],
  slugHint: 'fairtex',
  heroFallback: '/1296749132.jpg',
  datePublished: '2026-06-11',
  dateModified: '2026-06-11',
  editorial: [
    'Fairtex Training Center Pattaya is the beach-city flagship for the Fairtex brand: large rings, an on-site hotel, and steady tourist traffic. Travelers book Fairtex when they want a known name plus a single property for room and mat time.',
    'Hotel tiers and training-only passes carry different cancellation rules. If Fairtex is live on CombatStay, book below for instant confirmation. Otherwise compare Pattaya camps with accommodation flagged on the platform.',
  ],
  cityGuideHref: '/blog/best-muay-thai-gyms-pattaya',
  alternativeLocation: 'Pattaya',
  alternativeCtaLabel: 'View Pattaya stay-and-train camps',
  alternativeCtaUrl: '/search?country=Thailand&location=Pattaya&discipline=Muay%20Thai&accommodation=true',
  alternativeHeading:
    'Fairtex Pattaya is not verified on CombatStay yet. Compare instantly bookable Pattaya alternatives:',
  alternativeLimit: 3,
  faq: [
    {
      q: 'Does Fairtex Pattaya include a hotel?',
      a: 'Yes. Fairtex operates an on-site hotel for training guests. Room category drives total package price more than daily drop-ins.',
    },
    {
      q: 'Is Fairtex Pattaya good for beginners?',
      a: 'Yes. The camp runs tourist-friendly group classes alongside fighter tracks. Tell coaches on day one if you are new to sparring.',
    },
    {
      q: 'Fairtex Pattaya vs Bangkok Fairtex?',
      a: 'Pattaya suits beach-city long stays with lower commute stress than Bangkok. Bangkok fits if you want capital-city stadium access.',
    },
    {
      q: 'Can I book Fairtex Pattaya on CombatStay?',
      a: 'If Fairtex is live on CombatStay, use the direct booking button on this page. Otherwise browse Pattaya alternatives with verified packages.',
    },
  ],
  breadcrumbs: [
    { label: 'Training Guides', href: '/blog' },
    { label: 'Pattaya', href: '/blog/best-muay-thai-gyms-pattaya' },
  ],
  relatedGuides: [
    { title: 'Best Muay Thai gyms in Pattaya', href: '/blog/best-muay-thai-gyms-pattaya' },
    { title: 'Thailand training camp with accommodation', href: '/blog/thailand-training-camp-with-accommodation' },
    { title: 'Muay Thai camp Thailand cost', href: '/blog/muay-thai-camp-thailand-cost' },
  ],
}

export const KRUDAM_BANGKOK: BrandProfileConfig = {
  path: '/blog/krudam-gym-bangkok-review',
  title: 'Krudam Gym Bangkok: Review & Training Packages [2026]',
  description:
    'Looking to train at Krudam Gym Bangkok? Read class reviews, evaluate training packages, and check local stay-and-train availability.',
  brandName: 'Krudam Gym',
  locationLabel: 'Bangkok',
  city: 'Bangkok',
  bestFor: 'Bangkok-based fighters, stadium prep, Thai and foreign pro visitors',
  onSiteHousing: 'Limited; most guests use nearby hotels or partner stays',
  pricingBand: 'Training packages and private sessions; housing usually separate',
  trainingStyle: 'Muay Thai focused with fight-prep culture and technical pad work',
  namePatterns: ['Krudam', 'Kru Dam', 'Kru Dam Gym'],
  slugHint: 'krudam',
  heroFallback: '/1296749132.jpg',
  datePublished: '2026-06-11',
  dateModified: '2026-06-11',
  editorial: [
    'Krudam Gym is a Bangkok name linked to stadium-ready Muay Thai and technical pad work. Most travelers train twice daily and sleep in a nearby hotel or serviced apartment because on-site beds are limited compared to Phuket camps.',
    'Book housing within a short ride of the gym if you plan two-a-day sessions. BTS and taxi time adds up in Bangkok heat. If Krudam is live on CombatStay, book packages below; otherwise compare Bangkok train-and-stay listings.',
  ],
  cityGuideHref: '/blog/best-muay-thai-gyms-bangkok',
  alternativeLocation: 'Bangkok',
  alternativeCtaLabel: 'View Bangkok stay-and-train camps',
  alternativeCtaUrl: '/search?country=Thailand&location=Bangkok&discipline=Muay%20Thai&accommodation=true',
  alternativeHeading:
    'Krudam Gym is not verified on CombatStay yet. Compare instantly bookable Bangkok train-and-stay packages:',
  alternativeLimit: 3,
  faq: [
    {
      q: 'Does Krudam Gym offer accommodation?',
      a: 'Krudam is primarily a training gym. Most fighters book nearby hotels or partner stays. Confirm any housing mention on your quote before you assume on-site rooms.',
    },
    {
      q: 'Is Krudam Gym good for foreigners?',
      a: 'Yes, with fight-prep intensity. Beginners should ask about fundamentals classes and sparring policy on day one.',
    },
    {
      q: 'Krudam vs Phuket camps?',
      a: 'Krudam fits Bangkok stadium access and urban training. Phuket fits resort-style train-and-stay bundles with on-site pools and dorm culture.',
    },
    {
      q: 'Can I book Krudam on CombatStay?',
      a: 'If Krudam is live on CombatStay, use the booking button on this page. Otherwise browse Bangkok alternatives with accommodation on the platform.',
    },
  ],
  breadcrumbs: [
    { label: 'Training Guides', href: '/blog' },
    { label: 'Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
  ],
  relatedGuides: [
    { title: 'Bangkok Muay Thai train and stay', href: '/blog/bangkok-muay-thai-train-and-stay' },
    { title: 'Best Muay Thai gyms in Bangkok', href: '/blog/best-muay-thai-gyms-bangkok' },
    { title: 'Western boxing in Bangkok', href: '/blog/western-boxing-bangkok' },
  ],
}
