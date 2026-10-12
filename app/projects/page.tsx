import { BackLink } from '@/components/back-link'
import { ProjectIcon, ProjectStatusBadge } from '@/components/project-bits'
import { SiteFooter } from '@/components/site-footer'
import { projects } from '@/lib/projects'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projects',
  description: 'Products and sites Prasenjit Pawar has designed, built and shipped.',
}

// Fade each block in a beat after the one above it
const enter =
  'animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-700 motion-reduce:animate-none'

// Three screens from the app, fanned like cards in a hand
const fan = [
  { src: '/projects/kholi/create.png', alt: 'Creating a room page', rest: 'translate-y-3 -translate-x-[135%] rotate-[-6deg]', open: 'group-hover:-translate-x-[145%] group-hover:rotate-[-8deg]' },
  { src: '/projects/kholi/applicants.png', alt: 'Applicants with move-in and lifestyle details', rest: '-translate-x-1/2', open: 'group-hover:-translate-y-2' },
  { src: '/projects/kholi/decide.png', alt: 'Flatmates voting and shortlisting', rest: 'translate-y-3 translate-x-[35%] rotate-[6deg]', open: 'group-hover:translate-x-[45%] group-hover:rotate-[8deg]' },
]

export default function Page() {
  const [lead, ...rest] = projects

  return (
    <div className='flex flex-1 flex-col'>
      <div className='page pt-20 md:pt-28'>
        <BackLink href='/' label='Prasenjit Pawar' />

        <header className={`mt-10 ${enter}`}>
          <h1 className='font-medium'>Projects</h1>
          <p className='text-muted-foreground'>
            Products I&apos;ve designed, built and shipped, from first commit to live.
          </p>
        </header>

        {/* The lead project: the whole card opens its case study, while the
            live-site link sits above that layer */}
        <article className={`group relative mt-12 ${enter} delay-100`}>
          <div className='relative h-[248px] overflow-hidden rounded-xl border bg-muted/40 [background-image:radial-gradient(hsl(var(--foreground)/0.07)_1px,transparent_1px)] [background-size:16px_16px]'>
            {fan.map((shot, i) => (
              <Image
                key={shot.src}
                src={shot.src}
                alt={shot.alt}
                width={540}
                height={960}
                sizes='160px'
                priority={i === 1}
                className={`absolute left-1/2 top-8 w-[150px] rounded-xl border shadow-lg transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${shot.rest} ${shot.open} ${i === 1 ? 'z-10' : ''}`}
              />
            ))}
          </div>

          <div className='mt-4 flex items-start gap-3'>
            <ProjectIcon project={lead} />
            <div className='min-w-0 flex-1'>
              <div className='flex items-baseline justify-between gap-4'>
                <h2>
                  <Link
                    href={`/projects/${lead.slug}`}
                    data-track='project_clicked'
                    data-track-slug={lead.slug}
                    data-track-source='projects'
                    className='rounded-sm font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                    {lead.name}
                  </Link>
                  <span className='text-muted-foreground'> · {lead.tagline}</span>
                </h2>
                <ProjectStatusBadge status={lead.status} />
              </div>
              <p className='mt-1 text-sm text-muted-foreground'>{lead.description}</p>

              <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
                <span className='inline-flex items-center gap-1 text-foreground'>
                  Read the case study
                  <ArrowRight className='h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none' />
                </span>
                <a
                  href={lead.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  data-track='project_site_clicked'
                  data-track-slug={lead.slug}
                  className='relative z-10 inline-flex items-center gap-0.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                  {lead.domain}
                  <ArrowUpRight className='h-3.5 w-3.5' />
                </a>
              </div>
            </div>
          </div>
        </article>

        <section className={`mt-16 ${enter} delay-200`}>
          <h2 className='text-sm text-muted-foreground'>Earlier</h2>
          <ul className='-mx-3 mt-3'>
            {rest.map((project) => (
              <li key={project.slug}>
                <a
                  href={project.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  data-track='project_site_clicked'
                  data-track-slug={project.slug}
                  className='group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                  <ProjectIcon project={project} />
                  <span className='min-w-0 flex-1'>
                    <span className='flex items-center gap-1'>
                      {project.name}
                      <ArrowUpRight
                        aria-hidden
                        className='h-3.5 w-3.5 text-muted-foreground opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-px group-hover:opacity-100 motion-reduce:transition-none'
                      />
                    </span>
                    <span className='block truncate text-sm text-muted-foreground'>
                      {project.tagline} · {project.stack.join(', ')}
                    </span>
                  </span>
                  <ProjectStatusBadge status={project.status} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <SiteFooter className='mt-auto pt-20' />
    </div>
  )
}
