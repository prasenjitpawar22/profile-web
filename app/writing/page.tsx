import { BackLink } from '@/components/back-link'
import { SiteFooter } from '@/components/site-footer'
import { getSortedArticles } from '@/lib/article'
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Writing',
  description: 'Thoughts on software development and design.',
}

export default async function Page() {
  const articles = await getSortedArticles()

  return (
    <div className='flex flex-1 flex-col'>
      <div className='page pt-20 md:pt-28'>
        <BackLink href='/' label='Prasenjit Pawar' />

        <h1 className='mt-10 font-medium'>Writing</h1>
        <p className='text-muted-foreground'>
          Thoughts on software development and design.
        </p>

        <ul className='-mx-3 mt-8'>
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/writing/${article.id}`}
                data-track='article_clicked'
                data-track-article={article.id}
                data-track-source='writing'
                className='block rounded-lg px-3 py-3 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                <span className='flex items-baseline justify-between gap-6'>
                  <span>{article.title}</span>
                  <span className='shrink-0 text-sm tabular-nums text-muted-foreground'>
                    {article.date}
                  </span>
                </span>
                <span className='mt-0.5 block text-sm text-muted-foreground'>
                  {article.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <SiteFooter className='mt-auto pt-20' />
    </div>
  )
}
