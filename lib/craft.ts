export type CraftCredit = { label: string; href: string }

/** Which section of the Lab an experiment sits in */
export type CraftGroup = 'generative' | 'ai' | 'components'

export const craftGroups: { id: CraftGroup; title: string }[] = [
  { id: 'generative', title: 'Generative' },
  { id: 'ai', title: 'AI interactions' },
  { id: 'components', title: 'Components' },
]

export type CraftItem = {
  slug: string
  group: CraftGroup
  title: string
  description: string
  featured?: boolean
  /** Spans both columns of the Lab grid, for demos that need the room */
  wide?: boolean
  /** Who or what the experiment was inspired by — shown as "Inspired by …" */
  credit?: CraftCredit
}

export const craftItems: CraftItem[] = [
  {
    slug: 'logogram',
    group: 'generative',
    wide: true,
    title: 'Logogram',
    description:
      'An alien symbol writes itself in a ring of churning glyphs, then holds still and breathes. Rest the cursor on it mid-writing to decode the glyphs, drag through it to smear the ink, or click for a new one.',
  },
  {
    slug: 'dust-text',
    group: 'generative',
    title: 'Dust text',
    description:
      'Run the cursor through the words and they crumble into dust and blow away. The letters re-form in place, never by playing the dust in reverse.',
  },
  {
    slug: 'chrome-nav',
    group: 'components',
    wide: true,
    title: 'Chrome nav',
    description:
      'A nav bar made of liquid metal. A bead hangs under it and follows the cursor, menus pour down out of the bar on a tendril that thins and snaps when stretched, and closing melts them back up. Crossing a link on the way down to an open menu won’t close it.',
  },
  {
    slug: 'morph-nav',
    group: 'components',
    wide: true,
    title: 'Morph nav',
    description:
      'Hover through the menu and the title rebuilds itself into the next word. Letters the two words share travel to their new spots, hopping over or ducking under each other, while the rest blur away and new ones settle in.',
  },
  {
    slug: 'protein-tracker',
    group: 'components',
    wide: true,
    title: 'Protein tracker',
    description:
      'Log Indian meals from a searchable list, from poha to paneer tikka, or type one in by hand. The ring fills as the day adds up, then zoom out to the week, month and year.',
  },
  {
    slug: 'particle-orb',
    group: 'generative',
    title: 'Particle orb',
    description:
      'Two thousand dots on a slowly spinning globe. Move through it and they spring away from the cursor, overshoot a little, and settle back home.',
  },
  {
    slug: 'reveal-calendar',
    group: 'components',
    title: 'Reveal calendar',
    description:
      'A calendar that reveals the selected date through a circular mask, with a smooth transition between months.',
  },
  {
    slug: 'branching-chat',
    group: 'ai',
    title: 'Branching chat',
    description:
      'Edit an earlier message and the conversation forks instead of being overwritten. Step between versions, and everything below the fork slides over to match.',
  },
  {
    slug: 'thinking-indicator',
    group: 'ai',
    title: 'Thinking indicator',
    description:
      'An AI reasoning trace that searches, opens its sources and ticks off each step, then folds away while the answer streams in, burst by burst.',
  },
  {
    slug: 'smart-paste',
    group: 'ai',
    title: 'Smart paste',
    description:
      'Paste a messy email signature and each detail lifts out of the text and flies into its own field. Guesses are flagged for a second look, never silently trusted.',
  },
  {
    slug: 'ai-edit-review',
    group: 'ai',
    title: 'AI edit review',
    description:
      'Review an AI rewrite change by change, inline and from the keyboard, instead of letting it replace your words wholesale.',
    wide: true,
  },
  {
    slug: 'optimistic-rollback',
    group: 'ai',
    title: 'Optimistic rollback',
    description:
      'Changes apply instantly. When the server refuses, the change visibly rewinds and says why, while a request log shows what really happened.',
  },
  {
    slug: 'shortcut-recorder',
    group: 'components',
    title: 'Shortcut recorder',
    description:
      'Records key combinations as live keycaps, catches clashes and browser-reserved shortcuts, and speaks Mac or Windows.',
  },
  {
    slug: 'natural-date',
    group: 'components',
    title: 'Natural-language date',
    description:
      'Type “next fri 3pm” or “in 2 weeks”. The words it understood light up in the field, and a live preview says exactly when that is.',
  },
  {
    slug: 'app-switcher',
    group: 'components',
    title: 'App switcher',
    description:
      'A compact trigger that opens into a grid of apps and carries the chosen icon back with a shared layout transition.',
    featured: true,
  },
  {
    slug: 'dynamic-action-bar',
    group: 'components',
    title: 'Dynamic action bar',
    description:
      'A dock-like bar whose panels spring open above it on hover, tap or keyboard focus.',
    featured: true,
  },
  {
    slug: 'drawer',
    group: 'components',
    title: 'Drawer',
    description:
      'A draggable bottom sheet that scales the page behind it and dismisses with a flick.',
    featured: true,
  },
  {
    slug: 'animated-counter',
    group: 'components',
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
    group: 'components',
    title: 'Todo checkbox',
    description:
      'A checkbox that draws its tick, then strikes through the task, one beat at a time.',
    featured: true,
  },
  {
    slug: 'clip-path-nav',
    group: 'components',
    title: 'Clip-path navigation',
    description:
      'Two stacked copies of a nav, with a clip-path sliding to reveal the active item.',
  },
  {
    slug: 'theme-reveal',
    group: 'components',
    title: 'Theme reveal',
    description:
      'A circular theme transition that grows from any corner, built on the View Transitions API.',
  },
  {
    slug: 'gooey-search',
    group: 'components',
    title: 'Gooey search',
    description: 'A search field that melts out of its icon through an SVG goo filter.',
  },
  {
    slug: 'glide-radio',
    group: 'components',
    title: 'Glide radio',
    description: 'A radio group whose dot tumbles across to the new choice.',
  },
  {
    slug: 'slide-up-button',
    group: 'components',
    title: 'Slide-up button',
    description:
      'A call to action with a spinning conic border and a label that slides up on hover.',
  },
  {
    slug: 'multi-select',
    group: 'components',
    title: 'Multi-select',
    description: 'A popover multi-select with animated options and a clear-all.',
    credit: {
      label: 'shadcn multi-select',
      href: 'https://shadcn-multi-select-component.vercel.app/',
    },
  },
]
