import { BackLink } from '@/components/back-link'
import { SiteFooter } from '@/components/site-footer'
import { ColorMixLab } from '@/components/weekend-components/color-mix-lab'
import { getArticleData } from '@/lib/article'
import { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'

export async function generateMetadata({
  params,
}: {
  params: { id: string }
}): Promise<Metadata> {
  const article = await getArticleData(params.id)
  return { title: article.title, description: article.description }
}

export default async function Page({ params }: { params: { id: string } }) {
  const article = await getArticleData(params.id)

  return (
    <div className='flex flex-1 flex-col'>
      <div className='page pt-20 md:pt-28'>
        <BackLink href='/writing' label='Writing' />

        <p className='mt-10 text-sm text-muted-foreground'>
          {article.date}
          {article.read ? ` · ${article.read}` : null}
        </p>

        <article className='prose prose-neutral mt-2 max-w-none text-[15px] text-foreground dark:prose-invert prose-headings:font-medium prose-headings:tracking-tight prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:decoration-grass prose-a:underline-offset-[3px] prose-code:before:content-none prose-code:after:content-none'>
          <MDXRemote
            source={article.markdown}
            components={{
              ColorMixLab: ColorMixLab,
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={dracula}
                    language={match[1]}
                    PreTag='div'
                    {...props}>
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code>{children}</code>
                )
              },
              pre: (props) => <pre {...props} className='bg-muted' />,
            }}
          />
        </article>
      </div>

      <SiteFooter className='mt-auto pt-20' />
    </div>
  )
}
