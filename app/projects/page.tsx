import { BackLink } from '@/components/back-link'
import { ProjectIcon, ProjectStatusBadge } from '@/components/project-bits'
import { SiteFooter } from '@/components/site-footer'
import { projects, type Project } from '@/lib/projects'
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

type Shot = {
  src: string
  alt: string
  width: number
  height: number
  sizes: string
  /** Size, resting position, and where it moves when the card is hovered */
  className: string
  front?: boolean
}

// Each case study's card art: real screens, arranged so hovering the card
// spreads them a little
const previews: Record<string, Shot[]> = {
  // Three phone screens, fanned like cards in a hand
  kholi: [
    { src: '/projects/kholi/create.png', alt: 'Creating a room page', width: 540, height: 960, sizes: '160px', className: 'w-[150px] top-8 translate-y-3 -translate-x-[135%] rotate-[-6deg] group-hover:-translate-x-[145%] group-hover:rotate-[-8deg]' },
    { src: '/projects/kholi/applicants.png', alt: 'Applicants with move-in and lifestyle details', width: 540, height: 960, sizes: '160px', className: 'w-[150px] top-8 -translate-x-1/2 group-hover:-translate-y-2', front: true },
    { src: '/projects/kholi/decide.png', alt: 'Flatmates voting and shortlisting', width: 540, height: 960, sizes: '160px', className: 'w-[150px] top-8 translate-y-3 translate-x-[35%] rotate-[6deg] group-hover:translate-x-[45%] group-hover:rotate-[8deg]' },
  ],
  // Two editor windows, one behind the other
  demodrop: [
    { src: '/projects/demodrop/square-and-cut.png', alt: 'The editor at 1:1 with a cut on the timeline', width: 1280, height: 800, sizes: '300px', className: 'w-[60%] max-w-[300px] top-7 -translate-x-[80%] rotate-[-4deg] group-hover:-translate-x-[86%] group-hover:rotate-[-6deg]' },
    { src: '/projects/demodrop/editor.png', alt: 'The editor with a zoom block selected', width: 1280, height: 800, sizes: '300px', className: 'w-[60%] max-w-[300px] top-12 -translate-x-[20%] group-hover:-translate-x-[16%] group-hover:-translate-y-1.5', front: true },
  ],
}

export default function Page() {
  const caseStudies = projects.filter((project) => project.caseStudy)
  const rest = projects.filter((project) => !project.caseStudy)

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

        <div className={`mt-12 flex flex-col gap-14 ${enter} delay-100`}>
          {caseStudies.map((project, i) => (
            <CaseStudyCard key={project.slug} project={project} priority={i === 0} />
          ))}
        </div>

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

/** The whole card opens the case study, while the live-site link sits above that layer */
function CaseStudyCard({ project, priority }: { project: Project; priority: boolean }) {
  const shots = previews[project.slug] ?? []

  return (
    <article className='group relative'>
      <div className='relative h-[248px] overflow-hidden rounded-xl border bg-muted/40 [background-image:radial-gradient(hsl(var(--foreground)/0.07)_1px,transparent_1px)] [background-size:16px_16px]'>
        {shots.map((shot) => (
          <Image
            key={shot.src}
            src={shot.src}
            alt={shot.alt}
            width={shot.width}
            height={shot.height}
            sizes={shot.sizes}
            priority={priority && shot.front}
            className={`absolute left-1/2 rounded-xl border shadow-lg transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${shot.className} ${shot.front ? 'z-10' : ''}`}
          />
        ))}
      </div>

      <div className='mt-4 flex items-start gap-3'>
        <ProjectIcon project={project} />
        <div className='min-w-0 flex-1'>
          <div className='flex items-baseline justify-between gap-4'>
            <h2>
              <Link
                href={`/projects/${project.slug}`}
                data-track='project_clicked'
                data-track-slug={project.slug}
                data-track-source='projects'
                className='rounded-sm font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                {project.name}
              </Link>
              <span className='text-muted-foreground'> · {project.tagline}</span>
            </h2>
            <ProjectStatusBadge status={project.status} />
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>{project.description}</p>

          <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
            <span className='inline-flex items-center gap-1 text-foreground'>
              Read the case study
              <ArrowRight className='h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none' />
            </span>
            {project.url ? (
              <a
                href={project.url}
                target='_blank'
                rel='noopener noreferrer'
                data-track='project_site_clicked'
                data-track-slug={project.slug}
                className='relative z-10 inline-flex items-center gap-0.5 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                {project.domain}
                <ArrowUpRight className='h-3.5 w-3.5' />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
