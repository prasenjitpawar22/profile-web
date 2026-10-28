export type ProjectStatus = 'Live' | 'In progress' | 'Completed' | 'Offline'

/** An app to download for one platform; no url yet means it's coming */
export type Download = {
  platform: 'Windows' | 'macOS' | 'Linux'
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
  /** Desktop apps: one download per platform, instead of a single url */
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
    tagline: 'Polished demo videos from any tab',
    description:
      'A Chrome extension that records a browser tab and turns it into a demo video made for posting on X: auto-zoom that follows the pointer, a framed window, cuts, and MP4 export. Nothing leaves your device.',
    url: 'https://demodrop.prasenjitpawar.com',
    domain: 'demodrop.prasenjitpawar.com',
    status: 'Live',
    year: '2026',
    stack: ['Chrome MV3', 'WXT', 'React 19', 'WebCodecs', 'Mediabunny', 'Canvas'],
    icon: '/projects/demodrop/icon.png',
    caseStudy: true,
    featured: true,
  },
  {
    slug: 'demodrop-desktop',
    name: 'Demodrop Desktop',
    tagline: 'Polished demo videos from your screen',
    description:
      'The desktop sibling of the extension: records a screen, a window or an area natively, then an editor turns it into a demo made for posting on X, with auto-zoom, a crisp drawn pointer, speed-ups, masks, and MP4 or GIF export. Nothing leaves your device.',
    downloads: [
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
    status: 'In progress',
    year: '2026',
    stack: ['Electron', 'React 19', 'Rust', 'Windows.Graphics.Capture', 'WebCodecs'],
    icon: '/projects/demodrop-desktop/icon.png',
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
