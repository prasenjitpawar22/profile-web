import { Grass } from '@/components/grass'
import { PlatformDownloads, ProjectIcon, ProjectStatusBadge } from '@/components/project-bits'
import { projectHref, projects, type Project } from '@/lib/projects'
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
  const featuredProjects = projects.filter((project) => project.featured)

  return (
    <div className='flex flex-1 flex-col'>
      <div className='page pt-20 md:pt-28'>
        <header className={enter}>
          <h1 className='font-medium'>Prasenjit Pawar</h1>
          <p className='text-muted-foreground'>Software/Design Engineer</p>
        </header>

        <Section
          title='Projects'
          className={`${enter} delay-100`}
          action={
            <Link href='/projects' className='link text-sm'>
              All projects
            </Link>
          }>
          <ul className='-mx-3'>
            {featuredProjects.map((project) => (
              <li key={project.slug}>
                {project.downloads ? (
                  // Several downloads: links can't nest, so the item itself isn't one
                  <div className='flex gap-3 px-3 py-2.5'>
                    <FeaturedProject project={project} />
                  </div>
                ) : (
                  <Link
                    href={projectHref(project)}
                    data-track='project_clicked'
                    data-track-slug={project.slug}
                    data-track-source='home'
                    className='flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                    <FeaturedProject project={project} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title='Craft'
          className={`${enter} delay-200`}
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

        <Section title='Writing' className={`${enter} delay-300`}>
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

function FeaturedProject({ project }: { project: Project }) {
  return (
    <>
      <ProjectIcon project={project} className='mt-0.5' />
      <span className='min-w-0 flex-1'>
        <span className='flex items-baseline justify-between gap-4'>
          <span>
            {project.name}
            <span className='text-muted-foreground'> · {project.tagline}</span>
          </span>
          <ProjectStatusBadge status={project.status} />
        </span>
        <span className='block text-muted-foreground'>{project.description}</span>
        {project.downloads ? <PlatformDownloads downloads={project.downloads} slug={project.slug} className='mt-1.5' /> : null}
      </span>
    </>
  )
}
