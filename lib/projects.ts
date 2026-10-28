export type ProjectStatus = 'Live' | 'In progress' | 'Completed' | 'Offline'

/** An app to download for one platform; no url yet means it's coming */
export type Download = {
  platform: 'Chrome' | 'Windows' | 'macOS' | 'Linux'
  url?: string
  /** Shown after the platform, e.g. "beta" */
  note?: string
}

export type Project = {
  slug: string
  name: string
  /** One line, shown next to the name */
  tagline: string
  description?: string
  /** Live site or store page; leave out until there is a public one */
  url?: string
  /** Shown as the link text, e.g. "kholi.in" */
  domain?: string
  /** Apps to get: one per platform (a browser store or a desktop installer) */
  downloads?: Download[]
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
    slug: 'demodrop',
    name: 'Demodrop',
    tagline: 'Polished demo videos from any tab or screen',
    description:
      'Records a browser tab, a screen, a window or an area and turns it into a demo video made for posting on X: auto-zoom that follows the pointer, a framed window, cuts, and MP4 export. A Chrome extension and a desktop app. Nothing leaves your device.',
    url: 'https://demodrop.prasenjitpawar.com',
    domain: 'demodrop.prasenjitpawar.com',
    downloads: [
      {
        platform: 'Chrome',
        url: 'https://chromewebstore.google.com/detail/kobkeckelnodecamcnhmlnklhijhcgkf',
      },
      {
        platform: 'Windows',
        url: 'https://github.com/prasenjitpawar22/demodrop-releases/releases/latest/download/Demodrop-Setup.exe',
        note: 'beta',
      },
      {
        platform: 'macOS',
        url: 'https://github.com/prasenjitpawar22/demodrop-releases/releases/latest/download/Demodrop-mac.dmg',
        note: 'preview',
      },
      { platform: 'Linux' },
    ],
    status: 'Live',
    year: '2026',
    stack: ['Chrome MV3', 'Electron', 'React 19', 'Rust', 'WebCodecs', 'Mediabunny'],
    icon: '/projects/demodrop/icon.png',
    caseStudy: true,
    featured: true,
  },
  {
    slug: 'abhi-and-atul',
    name: 'Abhi and Atul',
    tagline: 'Sound and lights services',
    status: 'In progress',
    stack: ['Next.js', 'Aceternity UI'],
    monogram: 'AA',
  },
]

export const getProject = (slug: string) => projects.find((p) => p.slug === slug)

/** Where a project's card goes: its case study, else its live site */
export const projectHref = (project: Project) =>
  project.caseStudy ? `/projects/${project.slug}` : (project.url ?? '/projects')
