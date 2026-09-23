import { BackLink } from '@/components/back-link'
import { CraftCard } from '@/components/craft-card'
import { DrawerComp } from '@/components/drawer'
import { SiteFooter } from '@/components/site-footer'
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
import { craftItems } from '@/lib/craft'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Craft',
  description: 'Weekend experiments in interaction and motion.',
}

const demos: Record<string, React.ReactNode> = {
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
        <BackLink href='/' label='Prasenjit Pawar' />

        <h1 className='mt-10 font-medium'>Craft</h1>
        <p className='text-muted-foreground'>
          Weekend experiments in interaction and motion. Some are rebuilt from
          work that caught my eye, credited where they came from.
        </p>

        <div className='mt-12 flex flex-col gap-16'>
          {craftItems.map((item) => (
            <CraftCard key={item.slug} item={item}>
              {demos[item.slug]}
            </CraftCard>
          ))}
        </div>
      </div>

      <SiteFooter className='mt-auto pt-20' />
    </div>
  )
}
