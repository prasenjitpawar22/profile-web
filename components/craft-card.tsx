import type { CraftItem } from '@/lib/craft'
import { ArrowUpRight } from 'lucide-react'

export function CraftCard({
  item,
  children,
}: {
  item: CraftItem
  children: React.ReactNode
}) {
  return (
    <section id={item.slug} className='scroll-mt-12'>
      {/* A quiet dotted stage, so every demo sits on the same surface */}
      <div className='relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl border bg-muted/40 p-6 [background-image:radial-gradient(hsl(var(--foreground)/0.07)_1px,transparent_1px)] [background-size:16px_16px]'>
        {children}
      </div>

      <div className='mt-3 flex items-baseline justify-between gap-4'>
        <h2>
          <a
            href={`#${item.slug}`}
            className='rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
            {item.title}
          </a>
        </h2>
        {item.credit ? (
          <a
            href={item.credit.href}
            target='_blank'
            rel='noopener noreferrer'
            className='group inline-flex shrink-0 items-center gap-0.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
            Inspired by {item.credit.label}
            <ArrowUpRight className='h-3.5 w-3.5 transition-transform group-hover:-translate-y-px group-hover:translate-x-px' />
          </a>
        ) : null}
      </div>
      <p className='text-sm text-muted-foreground'>{item.description}</p>
    </section>
  )
}
