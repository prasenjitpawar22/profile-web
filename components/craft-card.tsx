import type { CraftItem } from '@/lib/craft'
import { cn } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'
import { DemoStage } from './demo-stage'

export function CraftCard({
  item,
  children,
}: {
  item: CraftItem
  children: React.ReactNode
}) {
  return (
    // Subgrid rows keep both stages in a pair the same height, whatever the captions do
    <section
      id={item.slug}
      className={cn(
        'row-span-2 grid scroll-mt-12 grid-rows-subgrid gap-0',
        item.wide && 'md:col-span-2',
      )}>
      {/* A plain hairline stage, so the demo sits on the page itself */}
      <DemoStage
        slug={item.slug}
        className='relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border p-6'>
        {children}
      </DemoStage>

      <div>
        <div className='mt-3 flex items-baseline justify-between gap-4'>
          <h3>
            <a
              href={`#${item.slug}`}
              className='group/title rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              {item.title}
              {/* Shows the title is a link to this demo */}
              <span
                aria-hidden
                className='ml-1.5 text-muted-foreground opacity-0 transition-opacity duration-150 group-focus-visible/title:opacity-100 [@media(hover:hover)]:group-hover/title:opacity-100'>
                #
              </span>
            </a>
          </h3>
          {item.credit ? (
            <a
              href={item.credit.href}
              data-track='component_credit_clicked'
              data-track-slug={item.slug}
              target='_blank'
              rel='noopener noreferrer'
              className='group inline-flex shrink-0 items-center gap-0.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            >
              Inspired by {item.credit.label}
              <ArrowUpRight className='h-3.5 w-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px' />
            </a>
          ) : null}
        </div>
        <p className='text-sm text-muted-foreground'>{item.description}</p>
      </div>
    </section>
  )
}
