export type ProjectStatus = 'Live' | 'In progress' | 'Completed' | 'Offline'

export type Project = {
  slug: string
  name: string
  /** One line, shown next to the name */
  tagline: string
  description?: string
  url: string
  /** Shown as the link text, e.g. "kholi.in" */
  domain: string
  status: ProjectStatus
  year?: string
  stack: string[]
  /** A square logo in /public; projects without one get a monogram */
  icon?: string
  monogram?: string
  /** Has its own case study page at /projects/[slug] */
  caseStudy?: boolean
  /** Shown on the home page */
  featured?: boolean
}

export const projects: Project[] = [
  {
    slug: 'kholi',
    name: 'Kholi',
    tagline: 'Hand over your room',
    description:
      'Flatmate replacement without a broker. The person leaving gets one shareable room page, seekers apply with a real profile instead of calling, and the flatmates vote on who moves in.',
    url: 'https://www.kholi.in',
    domain: 'kholi.in',
    status: 'Live',
    year: '2026',
    stack: ['Next.js 15', 'Supabase', 'Tailwind CSS v4', 'WhatsApp Cloud API', 'Remotion'],
    icon: '/projects/kholi/icon.svg',
    caseStudy: true,
    featured: true,
  },
  {
    slug: 'abhi-and-atul',
    name: 'Abhi and Atul',
    tagline: 'Sound and lights services',
    url: 'https://atul-abhi-web.vercel.app/',
    domain: 'atul-abhi-web.vercel.app',
    status: 'In progress',
    stack: ['Next.js', 'Aceternity UI'],
    monogram: 'AA',
  },
  {
    slug: 'coyaar',
    name: 'Coyaar',
    tagline: 'Find or list your perfect stay',
    url: 'https://www.coyaar.com',
    domain: 'coyaar.com',
    status: 'Completed',
    stack: ['Next.js', 'PostgreSQL'],
    monogram: 'CY',
  },
  {
    slug: 'vendue',
    name: 'Vendue',
    tagline: 'A realtime bidding app',
    url: 'https://vendue-web.vercel.app/',
    domain: 'vendue-web.vercel.app',
    status: 'Offline',
    stack: ['Next.js', 'Supabase', 'AWS'],
    monogram: 'V',
  },
]

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)
