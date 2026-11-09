import { BackLink } from '@/components/back-link'
import { CraftCard } from '@/components/craft-card'
import { DrawerComp } from '@/components/drawer'
import { SiteFooter } from '@/components/site-footer'
import { AiEditReview } from '@/components/weekend-components/ai-edit-review'
import { BranchingChat } from '@/components/weekend-components/branching-chat'
import { AgentPermission } from '@/components/weekend-components/agent-permission'
import { AgentRunMap } from '@/components/weekend-components/agent-run-map'
import { AgentStates } from '@/components/weekend-components/agent-states'
import { AiThinking } from '@/components/weekend-components/ai-thinking'
import { NaturalDateInput } from '@/components/weekend-components/natural-date-input'
import { OptimisticRollback } from '@/components/weekend-components/optimistic-rollback'
import { ShortcutRecorder } from '@/components/weekend-components/shortcut-recorder'
import { SmartPaste } from '@/components/weekend-components/smart-paste'
import { AppSwitcher } from '@/components/weekend-components/app-switcher'
import { DarkModeClipPath } from '@/components/weekend-components/dark-mode-clip-path'
import { DynamicActionBar } from '@/components/weekend-components/dynamic-action-bar'
import { GlideRadioButton } from '@/components/weekend-components/glide-radio-button'
import { MultiSelectExample } from '@/components/weekend-components/multi-select'
import { NavbarClipPath } from '@/components/weekend-components/nav-bar-clip-path'
import { SearchBoxGooey } from '@/components/weekend-components/search-box-gooey'
import SlideUpButton from '@/components/weekend-components/slide-up-button'
import Timer from '@/components/weekend-components/timer'
import { TodoCheckboxExample } from '@/components/weekend-components/todo-checkbox'
import { craftGroups, craftItems } from '@/lib/craft'
import { SITE_URL } from '@/lib/site'
import { Metadata } from 'next'
import RevealCalendar from '@/components/weekend-components/reveal-calender'
import { ParticleOrb } from '@/components/weekend-components/particle-orb'
import { ProteinTracker } from '@/components/weekend-components/protein-tracker'
import { DustText } from '@/components/weekend-components/dust-text'
import { Logogram } from '@/components/weekend-components/logogram'
import { MorphNav } from '@/components/weekend-components/morph-nav'
import { ChromeNav } from '@/components/weekend-components/chrome-nav'
import { RainyWindow } from '@/components/weekend-components/rainy-window'

export const metadata: Metadata = {
  title: 'Lab',
  description: 'Weekend experiments in interaction and motion.',
}

const demos: Record<string, React.ReactNode> = {
  'rainy-window': <RainyWindow />,
  logogram: <Logogram />,
  'dust-text': <DustText />,
  'chrome-nav': <ChromeNav />,
  'morph-nav': <MorphNav />,
  'protein-tracker': <ProteinTracker />,
  'particle-orb': <ParticleOrb />,
  'reveal-calendar': <RevealCalendar />,
  'branching-chat': <BranchingChat />,
  'thinking-indicator': <AiThinking />,
  'agent-permission': <AgentPermission />,
  'agent-states': <AgentStates />,
  'agent-run-map': <AgentRunMap />,
  'smart-paste': <SmartPaste />,
  'ai-edit-review': <AiEditReview />,
  'optimistic-rollback': <OptimisticRollback />,
  'shortcut-recorder': <ShortcutRecorder />,
  'natural-date': <NaturalDateInput />,
  'app-switcher': <AppSwitcher />,
  'dynamic-action-bar': <DynamicActionBar />,
  drawer: <DrawerComp />,
  'animated-counter': <Timer />,
  'todo-checkbox': <TodoCheckboxExample />,
  'clip-path-nav': <NavbarClipPath />,
  'theme-reveal': <DarkModeClipPath />,
  'gooey-search': <SearchBoxGooey />,
  'glide-radio': <GlideRadioButton />,
  'slide-up-button': <SlideUpButton />,
  'multi-select': <MultiSelectExample />,
}

export default function Page() {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='page pt-20 md:pt-28'>
        <BackLink href={SITE_URL} label='Prasenjit Pawar' />

        <h1 className='mt-10 font-medium'>Lab</h1>
        <p className='text-muted-foreground'>
          Weekend experiments in interaction and motion. Some are rebuilt from
          work that caught my eye, credited where they came from.
        </p>

        <nav aria-label='Lab sections' className='mt-4 flex flex-wrap gap-x-4 text-sm'>
          {craftGroups.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className='inline-flex min-h-10 touch-manipulation items-center rounded-sm text-muted-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:min-h-8 [@media(hover:hover)]:hover:text-foreground'>
              {group.title}
            </a>
          ))}
        </nav>
      </div>

      {/* Wider than the reading column, so two demos can sit side by side */}
      <div className='mx-auto mt-12 flex w-full max-w-[1040px] flex-col gap-20 px-6'>
        {craftGroups.map((group) => (
          <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className='scroll-mt-12'>
            <h2 id={`${group.id}-title`} className='text-sm text-muted-foreground'>
              {group.title}
            </h2>
            <div className='mt-4 grid grid-flow-row-dense gap-x-6 gap-y-14 md:grid-cols-2'>
              {craftItems
                .filter((item) => item.group === group.id)
                .map((item) => (
                  <CraftCard key={item.slug} item={item}>
                    {demos[item.slug]}
                  </CraftCard>
                ))}
            </div>
          </section>
        ))}
      </div>

      <SiteFooter className='mt-auto pt-20' />
    </div>
  )
}
