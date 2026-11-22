import { BackLink } from '@/components/back-link'
import { PageTop } from '@/components/page-top'
import { ColorMixLab } from '@/components/weekend-components/color-mix-lab'
import { getArticleData, isPublished } from '@/lib/article'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { CodeBlock } from '@/components/code-block'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  if (!isPublished(params.id)) notFound()
  const article = await getArticleData(params.id)
  return { title: article.title, description: article.description }
}

export default async function Page({ params }: { params: { id: string } }) {
  // Unlisted articles aren't reachable by URL either
  if (!isPublished(params.id)) notFound()
  const article = await getArticleData(params.id)

  return (
    <div className='flex flex-1 flex-col pb-20 md:pb-28'>
      <div className='page pt-20 md:pt-28'>
        <PageTop>
          <BackLink href='/writing' label='Writing' />
        </PageTop>

        <p className='mt-10 text-sm text-muted-foreground'>
          {article.date}
          {article.read ? ` · ${article.read}` : null}
        </p>

        <article className='prose prose-neutral mt-2 max-w-none text-[15px] text-foreground dark:prose-invert prose-headings:font-[450] prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:decoration-grass prose-a:underline-offset-[3px] prose-code:before:content-none prose-code:after:content-none'>
          <MDXRemote
            source={article.markdown}
            components={{
              ColorMixLab: ColorMixLab,
              // Fenced blocks with a language become the highlighter's own
              // block, so there's a single surface instead of one inside another
              pre({ children, ...props }: any) {
                const code = children?.props
                const match = /language-(\w+)/.exec(code?.className || '')
                if (!match) {
                  return (
                    <pre {...props} className='bg-muted text-foreground'>
                      {children}
                    </pre>
                  )
                }
                return (
                  <CodeBlock
                    language={match[1]}
                    code={String(code.children).replace(/\n$/, '')}
                  />
                )
              },
            }}
          />
        </article>
      </div>

    </div>
  )
}
