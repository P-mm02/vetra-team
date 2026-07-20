import type { Locale } from '@/lib/i18n'
import type { ProjectItem } from './Modal/Modal'

type ProjectText = {
  title?: string
  shortDesc: string
  stack?: string[]
  highlights?: string[]
}

const EN_PROJECTS: Record<string, ProjectText> = {
  'p-001-animal-farm': {
    shortDesc:
      'A bright, playful farm website concept with visit information, gallery sections, and friendly content structure.',
  },
  'p-002-aree-fruit': {
    title: 'Aree Fruit Farm',
    shortDesc:
      'A fresh fruit farm website with product showcases, contact paths, map support, and mobile-first sales flow.',
    highlights: [
      'Designed to support real sales conversations',
      'Reduces repetitive customer questions',
      'Easy to extend as the farm grows',
    ],
  },
  'p-003-aroma-massage': {
    title: 'Aroma Massage',
    shortDesc:
      'A premium spa website concept with service packages, pricing, and a structure ready for booking features.',
  },
  'p-004-beauty-clinic': {
    shortDesc:
      'A modern beauty clinic website with polished service pages and a content management direction for ongoing updates.',
    highlights: [
      'Custom CMS admin panel direction',
      'Modern beauty-focused presentation',
      'Builds trust before customers contact the clinic',
    ],
  },
  'p-005-electronic': {
    shortDesc:
      'A product showcase website for electronics, with readable specs, comparison-friendly layouts, and clear cards.',
  },
  'p-006-farm': {
    shortDesc:
      'A farm brand website concept focused on produce highlights, brand story, and contact or visit information.',
  },
  'p-007-furniture': {
    shortDesc:
      'A furniture catalog website concept with collections, material details, product highlights, and quote-focused contact flow.',
  },
  'p-008-graphic-design-2': {
    title: 'Graphic Design',
    shortDesc:
      'A graphic design portfolio concept with case-study cards and a professional gallery layout.',
  },
  'p-009-gym-2': {
    title: 'Gym',
    shortDesc:
      'A fitness website concept with programs, membership offers, trainer sections, and strong sign-up calls to action.',
  },
  'p-010-laundry-3': {
    title: 'Laundry',
    shortDesc:
      'A laundry service website concept with pricing, pickup and delivery messaging, and quick service contact buttons.',
  },
  'p-011-maid': {
    shortDesc:
      'A home-cleaning service website concept with service packages, FAQ content, and booking-ready structure.',
  },
  'p-012-manhwa-manhua-manga-2': {
    title: 'Manhwa Manhua Manga',
    shortDesc:
      'A comic reading platform concept with category sections, expandable content cards, and reader-friendly layout.',
  },
  'p-013-night-market': {
    title: 'Night Market',
    shortDesc:
      'A night-market directory concept with featured shops, activities, location content, and room for map features.',
  },
  'p-014-novel-2': {
    title: 'Novel',
    shortDesc:
      'A novel library concept with recommendation areas, new releases, and an easy reading-focused content layout.',
  },
  'p-015-oem-2': {
    title: 'OEM',
    shortDesc:
      'An OEM factory profile website concept focused on capability, production process, and B2B inquiry calls to action.',
  },
  'p-016-onsen-sauna-2': {
    title: 'Onsen Sauna',
    shortDesc:
      'An onsen and sauna website concept with packages, gallery atmosphere, membership sections, and promotions.',
  },
  'p-017-orchard': {
    shortDesc:
      'An orchard website concept built around seasonal products, farm story, and order or visit contact flows.',
  },
  'p-018-pet-2': {
    title: 'Pet',
    shortDesc:
      'A pet shop or pet service concept with product categories, care tips, and clear contact buttons.',
  },
  'p-019-pool-villa-2': {
    title: 'Pool Villa',
    shortDesc:
      'A premium pool villa website concept with gallery, amenities, and prominent booking calls to action.',
  },
  'p-020-pub-and-bar-3': {
    title: 'Pub & Bar',
    shortDesc:
      'A pub and bar website concept with events, featured menus, and fast table booking or contact actions.',
  },
  'p-021-real-estate': {
    title: 'Real Estate',
    shortDesc:
      'A real estate website concept with featured listings, filter-ready layout, and lead capture forms.',
  },
  'p-022-restaurant-3': {
    title: 'Restaurant',
    shortDesc:
      'A restaurant website concept with menu, gallery, reservation flow, and ordering or contact actions.',
  },
  'p-023-salon-4': {
    title: 'Salon',
    shortDesc:
      'A salon website concept with service menus, stylist highlights, reviews, and booking-ready calls to action.',
  },
  'p-024-sgw-website': {
    title: 'SIAM GROUNDWATER',
    shortDesc:
      'A company website for a groundwater drilling business serving factories, hotels, resorts, and large projects.',
    highlights: [
      'Helps generate work opportunities',
      'Builds trust for industrial clients',
      'Shows past work and service capability',
    ],
  },
  'p-025-sgw-working': {
    title: 'SGW Working',
    shortDesc:
      'An internal planning and LINE notification system for SIAM GROUNDWATER field operations.',
    highlights: [
      'Improves operational efficiency',
      'Reduces manpower coordination cost',
      'Lowers damage caused by manual mistakes',
    ],
  },
  'p-026-snooker': {
    shortDesc:
      'A snooker club website concept with packages, pricing, and ready-to-use booking or contact structure.',
  },
  'p-027-street-food': {
    title: 'Street Food',
    shortDesc:
      'A street food website concept with featured menu items, location content, and social-ready sections.',
  },
  'p-028-swipswap': {
    title: 'SwipSwap',
    shortDesc:
      'A student exchange platform for listing, browsing, profile management, and user-to-user chat.',
    highlights: [
      'Realtime chat experience',
      'Encourages reuse and sustainability',
      'Helps students reduce everyday expenses',
    ],
  },
  'p-029-underwear-3': {
    title: 'Underwear',
    shortDesc:
      'A product landing page concept with product options, key benefits, and clear order or contact actions.',
  },
  'p-030-weedex': {
    title: 'NFT and Digital Asset Marketplace',
    shortDesc:
      'A digital asset marketplace with registration, KYC, listing creation, profile management, and transaction history.',
    highlights: ['Blockchain', 'Cryptocurrency', 'NFT'],
  },
  'p-031-zoo': {
    shortDesc:
      'A zoo website concept with ticket information, opening times, highlighted zones, and a family-friendly layout.',
  },
  'p-032-go-wallet': {
    shortDesc:
      'A THB and crypto wallet web app with Wallet, Assets, Activity, and Connect screens in a clean fintech style.',
  },
  'p-033-unix-peak-travel': {
    shortDesc:
      'A travel and private tour website for Unix Peak Travel with tour programs, video highlights, social proof, and booking contact flow.',
  },
  'p-034-x-tribe': {
    shortDesc:
      'An e-commerce website for an ethnic fashion brand with products, cart flow, multi-currency support, and brand storytelling.',
  },
  'p-035-phataree-thailand': {
    shortDesc:
      'A B2B consumable products website with catalog sections, customer trust, certificates, and contact channels.',
  },
  'p-036-english-with-amol': {
    shortDesc:
      'A responsive English tutor website with course cards, teaching plans, FAQ, and student contact paths.',
  },
  'p-037-toilet-by-nakin': {
    shortDesc:
      'A mobile toilet rental service website with services, gallery, FAQ, and quote-focused contact actions.',
  },
}

export function localizeProject(project: ProjectItem, locale: Locale) {
  if (locale === 'th') return project

  const text = EN_PROJECTS[project.id]
  if (!text) return project

  return {
    ...project,
    title: text.title ?? project.title,
    shortDesc: text.shortDesc,
    stack: text.stack ?? project.stack,
    highlights: text.highlights ?? project.highlights,
    cover: {
      ...project.cover,
      alt: text.title
        ? `${text.title} project cover`
        : project.cover.alt.replace('project cover', 'project cover'),
    },
  }
}

export const projectUiText = {
  th: {
    example: 'ตัวอย่าง',
    all: 'ทั้งหมด',
    filterLabel: 'ตัวกรองผลงาน',
    categoryFilterLabel: 'กรองตามประเภทผลงาน',
    categoryAll: 'ทุกประเภท',
    categoryBusiness: 'เว็บไซต์ธุรกิจ',
    categoryCommerce: 'ร้านค้าออนไลน์',
    categoryWebapp: 'เว็บแอป / แพลตฟอร์ม',
    categoryInternal: 'ระบบภายใน',
    searchButton: 'ค้นหาผลงาน',
    searchLabel: 'ค้นหาจากชื่อ รายละเอียด ปี เทคโนโลยี หรือจุดเด่น',
    searchPlaceholder: 'ค้นหาผลงาน...',
    clearSearch: 'ล้างคำค้นหา',
    clearTitle: 'ล้าง',
    detail: 'รายละเอียด',
    empty: 'ไม่พบผลงานที่ตรงกับตัวกรองนี้',
  },
  en: {
    example: 'Featured',
    all: 'All',
    filterLabel: 'Projects filter',
    categoryFilterLabel: 'Filter projects by category',
    categoryAll: 'All types',
    categoryBusiness: 'Business sites',
    categoryCommerce: 'E-commerce',
    categoryWebapp: 'Web apps / platforms',
    categoryInternal: 'Internal systems',
    searchButton: 'Search projects',
    searchLabel: 'Search by title, description, year, stack, highlights',
    searchPlaceholder: 'Search projects...',
    clearSearch: 'Clear search',
    clearTitle: 'Clear',
    detail: 'Details',
    empty: 'No projects match these filters.',
  },
} satisfies Record<Locale, Record<string, string>>

export const projectModalText = {
  th: {
    details: 'รายละเอียดผลงาน',
    dialogPrefix: 'รายละเอียดผลงาน:',
    year: 'ปี',
    stack: 'เทคโนโลยี',
    highlights: 'จุดเด่น',
    close: 'ปิด',
    closeModal: 'ปิดหน้าต่างรายละเอียด',
    imagesPrefix: 'รูปภาพผลงาน:',
    tipPrefix: 'กด',
    tipSuffix: 'เพื่อปิด',
  },
  en: {
    details: 'Project details',
    dialogPrefix: 'Project details:',
    year: 'Year',
    stack: 'Stack',
    highlights: 'Highlights',
    close: 'Close',
    closeModal: 'Close project details',
    imagesPrefix: 'Project images:',
    tipPrefix: 'Tip: press',
    tipSuffix: 'to close.',
  },
} satisfies Record<Locale, Record<string, string>>
