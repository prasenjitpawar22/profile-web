import { BackLink } from '@/components/back-link'
import { PageTop } from '@/components/page-top'
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
    <div className='flex flex-1 flex-col pb-20 md:pb-28'>
      <div className='page pt-20 md:pt-28'>
        <PageTop>
          <BackLink href='/' label='Prasenjit Pawar' />
        </PageTop>

        <h1 className='mt-10 font-[450]'>Writing</h1>
        <p className='text-muted-foreground'>
          Thoughts on software development and design.
        </p>

        <ul className='mt-8'>
          {articles.map((article) => (
            <li key={article.id}>
              {/* No hover fill: like the other pages, only the title underlines */}
              <Link
                href={`/writing/${article.id}`}
                data-track='article_clicked'
                data-track-article={article.id}
                data-track-source='writing'
                className='group block rounded-sm py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                <span className='flex items-baseline justify-between gap-6'>
                  <span className='underline decoration-transparent decoration-[0.09em] underline-offset-4 transition-[text-decoration-color] duration-150 group-hover:decoration-foreground'>
                    {article.title}
                  </span>
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

    </div>
  )
}
