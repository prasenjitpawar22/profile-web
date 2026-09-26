import { Grass } from '@/components/grass'
import { SiteFooter } from '@/components/site-footer'
import { getSortedArticles } from '@/lib/article'
import { craftItems } from '@/lib/craft'
import Link from 'next/link'

// Fade each block in a beat after the one above it
const enter =
  'animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-700 motion-reduce:animate-none'

export default async function Home() {
  const articles = await getSortedArticles()
  const featured = craftItems.filter((item) => item.featured)

  return (
    <div className='flex flex-1 flex-col'>
      <div className='page pt-20 md:pt-28'>
        <header className={enter}>
          <h1 className='font-medium'>Prasenjit Pawar</h1>
          <p className='text-muted-foreground'>Design Engineer</p>
        </header>

        <Section
          title='Craft'
          className={`${enter} delay-100`}
          action={
            <Link href='/craft' className='link text-sm'>
              All experiments
            </Link>
          }>
          <ul className='-mx-3'>
            {featured.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/craft#${item.slug}`}
                  data-track='component_clicked'
                  data-track-slug={item.slug}
                  data-track-source='home'
                  className='block rounded-lg px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                  <span className='block'>{item.title}</span>
                  <span className='block text-muted-foreground'>
                    {item.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>

        <Section title='Writing' className={`${enter} delay-200`}>
          <ul className='-mx-3'>
            {articles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/writing/${article.id}`}
                  data-track='article_clicked'
                  data-track-article={article.id}
                  data-track-source='home'
                  className='flex items-baseline justify-between gap-6 rounded-lg px-3 py-2 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                  <span>{article.title}</span>
                  <span className='shrink-0 text-sm tabular-nums text-muted-foreground'>
                    {article.date}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <div className='mt-auto pt-20'>
        <SiteFooter />
        <Grass />
      </div>
    </div>
  )
}

function Section({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`mt-14 ${className ?? ''}`}>
      <div className='flex items-baseline justify-between'>
        <h2 className='text-sm text-muted-foreground'>{title}</h2>
        {action}
      </div>
      <div className='mt-3'>{children}</div>
    </section>
  )
}
