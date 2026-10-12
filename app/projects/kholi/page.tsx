import { BackLink } from '@/components/back-link'
import { ProjectIcon, ProjectStatusBadge } from '@/components/project-bits'
import { SiteFooter } from '@/components/site-footer'
import { getProject } from '@/lib/projects'
import { ArrowUpRight, Play } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

const project = getProject('kholi')!

export const metadata: Metadata = {
  title: 'Kholi',
  description:
    'Case study: Kholi, a mobile-first web app for handing over your room to a new flatmate without a broker.',
  openGraph: { images: ['/projects/kholi/poster.png'] },
}

// Fade each block in a beat after the one above it
const enter =
  'animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-700 motion-reduce:animate-none'

const facts = [
  { value: '2 weeks', label: 'first commit to live' },
  { value: '8', label: 'screens shipped' },
  { value: '0', label: 'sign-ups to apply' },
  { value: '₹0', label: 'brokerage' },
]

const screens = [
  { src: 'problem.png', caption: 'The problem', alt: 'A phone lock screen full of broker messages and missed calls' },
  { src: 'create.png', caption: '1 · Create', alt: 'The form for creating a room page' },
  { src: 'share.png', caption: '2 · Share', alt: 'The room link shared in a WhatsApp flat group' },
  { src: 'applicants.png', caption: '3 · Applicants', alt: 'Applicants with move-in date and lifestyle flags' },
  { src: 'decide.png', caption: '4 · Decide', alt: 'Flatmates voting and shortlisting applicants' },
  { src: 'filled.png', caption: 'Room filled', alt: 'Room filled confirmation' },
]

const steps = [
  {
    title: 'Create a room page',
    body: 'Photos, rent, deposit, move-in date, current flatmates and house rules, in about two minutes. Already wrote a WhatsApp post? Paste it and the form fills itself.',
  },
  {
    title: 'Share one link',
    body: 'The link unfurls with a proper preview in WhatsApp. Kholi writes the group post and lists flat groups near the room, so one tap copies the post and opens the group.',
  },
  {
    title: 'Get real applicants',
    body: 'Instead of forty "is it available?" calls, every seeker arrives as a structured application: job, move-in date, lifestyle, with move-in fit and house-rule clashes flagged.',
  },
  {
    title: 'Decide together',
    body: 'Flatmates vote from their own link with no sign-up. Shortlist, message the applicant on WhatsApp, and mark the room filled.',
  },
]

const productDecisions = [
  {
    title: 'A website, not an app',
    body: 'The link gets shared in WhatsApp groups, so it has to open instantly with nothing to install. Mobile-first web now; a PWA only if people come back often.',
  },
  {
    title: 'No account to look or apply',
    body: 'Seekers never sign up. The person leaving confirms their email with a six-digit code, and their private manage link is the key. Codes beat magic links here: a magic link opens inside the mail app’s browser, so the session lands in the wrong place.',
  },
  {
    title: 'Verify the number that matters',
    body: 'Applicants confirm their WhatsApp number with a one-time code from the WhatsApp Cloud API. It’s the number the leaver will message anyway, it needs no DLT registration the way SMS does in India, and it costs about ₹0.12 a code. It switches on as soon as the WhatsApp Business template is approved. The leaver’s own number never appears on the public page.',
  },
  {
    title: 'Pages for rooms that aren’t on Kholi yet',
    body: 'For outreach, a public “replacement needed” post can become a page before its owner signs up, with guardrails because they never asked: text only, not indexed, clearly marked unclaimed, applications held until they claim it, removable by anyone, and deleted after seven days.',
  },
]

const engineeringDecisions = [
  {
    title: 'Photos never pass through the server',
    body: 'They’re resized and compressed in the browser (1600px JPEG, around 250 KB), then uploaded straight to Supabase Storage with one-time signed URLs. That keeps uploads clear of Vercel’s 4.5 MB request limit.',
  },
  {
    title: 'Paste a post, get a form',
    body: 'A rule-based parser in the browser reads a pasted WhatsApp or Facebook post into the listing form for free, with an optional AI pass through any OpenAI-compatible API.',
    link: { href: '/craft#smart-paste', label: 'The idea behind Smart paste' },
  },
  {
    title: 'Data the browser can’t touch',
    body: 'Every read and write goes through server actions. Row-level security is on with no public policies, so the browser can’t query tables directly. Spam guards: one application per phone per listing, plus code limits per phone and per IP.',
  },
]

const stack = [
  { name: 'Next.js 15', role: 'App Router and server actions' },
  { name: 'React 19 · TypeScript', role: 'UI' },
  { name: 'Tailwind CSS v4', role: 'Styling and theme tokens' },
  { name: 'Supabase', role: 'Postgres and photo storage' },
  { name: 'Resend', role: 'Email sign-in codes' },
  { name: 'WhatsApp Cloud API', role: 'Phone verification' },
  { name: 'Vercel', role: 'Hosting and analytics' },
  { name: 'Remotion', role: 'Promo video' },
]

const next = [
  'Get the first ten rooms filled through a Kholi link, starting in Pune',
  'Browse rooms by area',
  'A verified badge through a work email',
  'Switch on WhatsApp verification for every applicant',
]

export default function Page() {
  return (
    <div className='flex flex-1 flex-col'>
      <div className='page pt-20 md:pt-28'>
        <BackLink href='/projects' label='Projects' />

        <header className={`mt-10 ${enter}`}>
          <div className='flex items-center gap-3'>
            <ProjectIcon project={project} className='h-11 w-11 rounded-xl' />
            <div>
              <h1 className='font-medium'>{project.name}</h1>
              <p className='text-muted-foreground'>{project.tagline}</p>
            </div>
          </div>

          <p className='mt-6 text-pretty'>
            Leaving a flat in India usually means posting in WhatsApp groups, fielding dozens of
            calls and brokers, and paying rent on an empty room until someone moves in. Kholi gives
            the person leaving one clean page for the room, and lets the flatmates who stay choose
            who replaces them.
          </p>

          <dl className='mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4'>
            <Meta label='Role'>Solo: product, design, engineering</Meta>
            <Meta label='Timeline'>Sep – Oct 2026</Meta>
            <Meta label='Platform'>Mobile web</Meta>
            <Meta label='Status'>
              <ProjectStatusBadge status={project.status} className='text-sm text-foreground' />
            </Meta>
          </dl>

          <div className='mt-6 flex flex-wrap items-center gap-2'>
            <a
              href={project.url}
              target='_blank'
              rel='noopener noreferrer'
              data-track='project_site_clicked'
              data-track-slug={project.slug}
              data-track-source='case_study'
              className='inline-flex h-9 items-center gap-1 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] motion-reduce:transition-none'>
              Visit {project.domain}
              <ArrowUpRight className='h-4 w-4' />
            </a>
            <a
              href='#promo'
              className='inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97] motion-reduce:transition-none'>
              <Play className='h-3.5 w-3.5' />
              Watch the promo
            </a>
          </div>
        </header>

        {/* The whole flow at a glance, scrolled sideways. The negative margin
            lets it run to the screen edge on phones. */}
        <section aria-label='Screens' className={`-mx-6 mt-12 ${enter} delay-100`}>
          {/* Edges fade only across the gutter, so the first screen starts crisp */}
          <ul className='flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6 pb-3 [mask-image:linear-gradient(to_right,transparent,#000_24px,#000_calc(100%-24px),transparent)] [scrollbar-width:thin]'>
            {screens.map((shot, i) => (
              <li key={shot.src} className='shrink-0 snap-start'>
                <figure>
                  <Image
                    src={`/projects/kholi/${shot.src}`}
                    alt={shot.alt}
                    width={540}
                    height={960}
                    sizes='180px'
                    priority={i < 3}
                    className='w-[180px] rounded-xl border bg-muted'
                  />
                  <figcaption className='mt-2 text-xs text-muted-foreground'>{shot.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        <dl className={`mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4 ${enter} delay-200`}>
          {facts.map((fact) => (
            <div key={fact.label} className='bg-background px-4 py-3'>
              <dt className='sr-only'>{fact.label}</dt>
              <dd>
                <span className='block text-lg font-medium tabular-nums'>{fact.value}</span>
                <span className='block text-xs text-muted-foreground'>{fact.label}</span>
              </dd>
            </div>
          ))}
        </dl>

        <Section title='How it works'>
          <ol className='flex flex-col gap-5'>
            {steps.map((step, i) => (
              <li key={step.title} className='flex gap-3'>
                <span className='mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs tabular-nums text-muted-foreground'>
                  {i + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p className='text-muted-foreground'>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section title='Product decisions'>
          <Decisions items={productDecisions} />
        </Section>

        <Section title='Engineering'>
          <Decisions items={engineeringDecisions} />
        </Section>

        <Section title='Promo video' id='promo'>
          <p className='text-muted-foreground'>
            A 52-second vertical video for Reels, Shorts and WhatsApp Status, made in Remotion so
            the phone screens are the real app rebuilt in React. The music and sound effects are
            generated in code, and every cut lands on the beat.
          </p>
          <div className='mt-4 flex justify-center rounded-xl border bg-muted/40 py-6 [background-image:radial-gradient(hsl(var(--foreground)/0.07)_1px,transparent_1px)] [background-size:16px_16px]'>
            {/* Nothing downloads until play is pressed */}
            <video
              src='/projects/kholi/promo.mp4'
              poster='/projects/kholi/poster.png'
              controls
              playsInline
              preload='none'
              width={270}
              height={480}
              aria-label='Kholi promo video'
              className='aspect-[9/16] w-[270px] rounded-xl border bg-muted shadow-lg'
            />
          </div>
        </Section>

        <Section title='Stack'>
          <dl className='-mx-3'>
            {stack.map((item) => (
              <div
                key={item.name}
                className='flex items-baseline justify-between gap-6 rounded-lg px-3 py-1.5'>
                <dt>{item.name}</dt>
                <dd className='text-right text-sm text-muted-foreground'>{item.role}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title='What’s next'>
          <ul className='flex flex-col gap-1.5'>
            {next.map((item) => (
              <li key={item} className='flex gap-2.5 text-muted-foreground'>
                <span aria-hidden className='mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60' />
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <div className='mt-14 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-4 py-4'>
          <div className='flex items-center gap-3'>
            <ProjectIcon project={project} />
            <div>
              <p className='text-sm font-medium'>Leaving your flat?</p>
              <p className='text-sm text-muted-foreground'>Hand over your room in one link.</p>
            </div>
          </div>
          <a
            href={project.url}
            target='_blank'
            rel='noopener noreferrer'
            data-track='project_site_clicked'
            data-track-slug={project.slug}
            data-track-source='case_study_footer'
            className='inline-flex items-center gap-0.5 rounded-sm text-sm transition-colors hover:text-grass focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
            {project.domain}
            <ArrowUpRight className='h-3.5 w-3.5' />
          </a>
        </div>
      </div>

      <SiteFooter className='mt-auto pt-20' />
    </div>
  )
}

function Section({
  title,
  id,
  children,
}: {
  title: string
  id?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className='mt-14 scroll-mt-12'>
      <h2 className='text-sm text-muted-foreground'>{title}</h2>
      <div className='mt-3'>{children}</div>
    </section>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className='text-xs text-muted-foreground'>{label}</dt>
      <dd className='mt-0.5'>{children}</dd>
    </div>
  )
}

function Decisions({
  items,
}: {
  items: { title: string; body: string; link?: { href: string; label: string } }[]
}) {
  return (
    <div className='flex flex-col gap-5'>
      {items.map((item) => (
        <div key={item.title}>
          <h3>{item.title}</h3>
          <p className='text-muted-foreground'>{item.body}</p>
          {item.link ? (
            <Link href={item.link.href} className='link mt-1 inline-block text-sm'>
              {item.link.label}
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  )
}
