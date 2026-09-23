export type CraftCredit = { label: string; href: string }

export type CraftItem = {
  slug: string
  title: string
  description: string
  featured?: boolean
  /** Who or what the experiment was inspired by — shown as "Inspired by …" */
  credit?: CraftCredit
}

export const craftItems: CraftItem[] = [
  {
    slug: 'app-switcher',
    title: 'App switcher',
    description:
      'A compact trigger that opens into a grid of apps and carries the chosen icon back with a shared layout transition.',
    featured: true,
  },
  {
    slug: 'dynamic-action-bar',
    title: 'Dynamic action bar',
    description:
      'A dock-like bar whose panels spring open above it on hover, tap or keyboard focus.',
    featured: true,
  },
  {
    slug: 'drawer',
    title: 'Drawer',
    description:
      'A draggable bottom sheet that scales the page behind it and dismisses with a flick.',
    featured: true,
  },
  {
    slug: 'animated-counter',
    title: 'Animated counter',
    description: 'Rolling digits, softened into each other with an SVG goo filter.',
    featured: true,
    credit: {
      label: 'Build UI',
      href: 'https://buildui.com/recipes/animated-counter',
    },
  },
  {
    slug: 'todo-checkbox',
    title: 'Todo checkbox',
    description:
      'A checkbox that draws its tick, then strikes through the task, one beat at a time.',
    featured: true,
  },
  {
    slug: 'clip-path-nav',
    title: 'Clip-path navigation',
    description:
      'Two stacked copies of a nav, with a clip-path sliding to reveal the active item.',
  },
  {
    slug: 'theme-reveal',
    title: 'Theme reveal',
    description:
      'A circular theme transition that grows from any corner, built on the View Transitions API.',
  },
  {
    slug: 'gooey-search',
    title: 'Gooey search',
    description: 'A search field that melts out of its icon through an SVG goo filter.',
  },
  {
    slug: 'glide-radio',
    title: 'Glide radio',
    description: 'A radio group whose dot tumbles across to the new choice.',
  },
  {
    slug: 'slide-up-button',
    title: 'Slide-up button',
    description:
      'A call to action with a spinning conic border and a label that slides up on hover.',
  },
  {
    slug: 'multi-select',
    title: 'Multi-select',
    description: 'A popover multi-select with animated options and a clear-all.',
    credit: {
      label: 'shadcn multi-select',
      href: 'https://shadcn-multi-select-component.vercel.app/',
    },
  },
]
