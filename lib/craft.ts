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
    slug: 'protein-tracker',
    title: 'Protein tracker',
    description:
      'Log Indian meals from a searchable list, from poha to paneer tikka, or type one in by hand. The ring fills as the day adds up, then zoom out to the week, month and year.',
  },
  {
    slug: 'particle-orb',
    title: 'Particle orb',
    description:
      'Two thousand dots on a slowly spinning globe. Move through it and they spring away from the cursor, overshoot a little, and settle back home.',
  },
  {
    slug: 'reveal-calendar',
    title: 'Reveal calendar',
    description:
      'A calendar that reveals the selected date through a circular mask, with a smooth transition between months.',
  },
  {
    slug: 'branching-chat',
    title: 'Branching chat',
    description:
      'Edit an earlier message and the conversation forks instead of being overwritten. Step between versions, and everything below the fork slides over to match.',
  },
  {
    slug: 'thinking-indicator',
    title: 'Thinking indicator',
    description:
      'An AI reasoning trace that searches, opens its sources and ticks off each step, then folds away while the answer streams in, burst by burst.',
  },
  {
    slug: 'smart-paste',
    title: 'Smart paste',
    description:
      'Paste a messy email signature and each detail lifts out of the text and flies into its own field. Guesses are flagged for a second look, never silently trusted.',
  },
  {
    slug: 'ai-edit-review',
    title: 'AI edit review',
    description:
      'Review an AI rewrite change by change, inline and from the keyboard, instead of letting it replace your words wholesale.',
  },
  {
    slug: 'optimistic-rollback',
    title: 'Optimistic rollback',
    description:
      'Changes apply instantly. When the server refuses, the change visibly rewinds and says why, while a request log shows what really happened.',
  },
  {
    slug: 'shortcut-recorder',
    title: 'Shortcut recorder',
    description:
      'Records key combinations as live keycaps, catches clashes and browser-reserved shortcuts, and speaks Mac or Windows.',
  },
  {
    slug: 'natural-date',
    title: 'Natural-language date',
    description:
      'Type “next fri 3pm” or “in 2 weeks”. The words it understood light up in the field, and a live preview says exactly when that is.',
  },
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
