import { BackLink } from '@/components/back-link'
import { ProjectIcon, ProjectStatusBadge } from '@/components/project-bits'
import { SiteFooter } from '@/components/site-footer'
import { getProject } from '@/lib/projects'
import { ArrowUpRight } from 'lucide-react'
import { Metadata } from 'next'
import Image from 'next/image'

const project = getProject('demodrop')!
const chromeStoreUrl = 'https://chromewebstore.google.com/detail/kobkeckelnodecamcnhmlnklhijhcgkf'

export const metadata: Metadata = {
  title: 'Demodrop',
  description:
    'Case study: Demodrop, a Chrome extension that turns a browser tab recording into a polished demo video, entirely on your device.',
  openGraph: { images: ['/projects/demodrop/og.png'] },
}

// Fade each block in a beat after the one above it
const enter =
  'animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-700 motion-reduce:animate-none'

const facts = [
  { value: '3 days', label: 'first commit to the store' },
  { value: '0', label: 'servers or uploads' },
  { value: '60 fps', label: '1080p MP4 export' },
  { value: '4', label: 'permissions, no host access' },
]

const screens = [
  { src: 'editor.png', caption: 'Edit', alt: 'The editor: a framed preview zoomed in on a dialog, with a zoom block on the timeline' },
  { src: 'square-and-cut.png', caption: '1:1 and cuts', alt: 'The editor at 1:1 with a purple background and a cut at the end of the timeline' },
  { src: 'blur.png', caption: 'Blur before recording', alt: 'Picking elements to blur on a dashboard, with email addresses already frosted' },
  { src: 'exporting.png', caption: 'Export', alt: 'The export dialog rendering a 1920×1080 MP4 at 60 fps' },
  { src: 'exported.png', caption: 'Saved', alt: 'The export dialog after saving the MP4' },
]

const steps = [
  {
    title: 'Record a tab',
    body: 'Click Record, get a 3-2-1 countdown, and use the page normally, with your microphone if you like. Your pointer turns into a clean Mac-style cursor for the take.',
  },
  {
    title: 'Get the zooms for free',
    body: 'Every click and real pointer movement is logged against the video clock. The camera glides in when you start working, follows the pointer, and eases back out when you stop.',
  },
  {
    title: 'Tidy it up',
    body: 'Move, resize or delete zoom blocks and set each from 1.2× to 3×. Cut out mistakes and loading screens. Pick a gradient, a Mac-style window, 16:9 or 1:1.',
  },
  {
    title: 'Export and post',
    body: 'A 1080p, 60 fps MP4 in H.264 and AAC, with the cuts removed and the file kept under X’s upload limit.',
  },
]

const productDecisions = [
  {
    title: 'Nothing leaves the device',
    body: 'Recording, editing and export all run in the browser. No servers, no accounts, no uploads, so there is nothing to sign up for and nothing to leak. It also keeps the store listing honest: Demodrop collects no data at all.',
  },
  {
    title: 'The real cursor is the video’s cursor',
    body: 'Most tools hide the cursor and draw a fake one afterwards, which never quite matches the page. Demodrop swaps the page’s cursors for Mac-style ones while recording: a hand on links, an I-beam on text, resize arrows on edges. Tab capture records them, so the cursor always matches what the page did. The editor only adds click ripples.',
  },
  {
    title: 'Blur before you record, not after',
    body: 'Pick the emails, names and API keys to hide before you hit Record. Each gets a frosted pane that tracks the element every frame, even as you scroll, and reattaches when the page re-renders. Private details never reach the recording.',
  },
  {
    title: 'Automatic first, editable after',
    body: 'Zoom blocks are generated from what you did, so a recording already looks finished when the editor opens. Editing means nudging blocks, not building them from scratch.',
  },
]

const engineeringDecisions = [
  {
    title: 'One clock across three contexts',
    body: 'The page, the offscreen recorder and the editor all run in different contexts. The page stamps each pointer event with performance.timeOrigin plus the event’s timestamp, the recorder stamps video zero the same way when MediaRecorder starts, and subtracting the two puts every click on the right frame.',
  },
  {
    title: 'A camera you can seek',
    body: 'The follow camera is a critically damped spring with a dead zone, so it never overshoots and small movements don’t make the picture swim. It’s precomputed at 120 Hz into arrays, which makes the camera a pure function of time: preview, seeking and export render exactly the same frame.',
  },
  {
    title: 'Export faster than real time',
    body: 'WebCodecs through Mediabunny decodes each recorded frame once, draws it with the same renderer as the preview, and encodes H.264 at 14 Mbps for crisp text. It doesn’t wait on playback, keeps working in a background tab, and is only loaded when you export.',
  },
  {
    title: 'An engine with no framework',
    body: 'Zoom generation, easing, the camera, layout, cuts and export planning are plain TypeScript with no React and no DOM beyond the canvas, each with its own unit tests. The UI on top can change without touching how a frame is drawn.',
  },
]

const stack = [
  { name: 'Chrome MV3 · WXT', role: 'Extension and build' },
  { name: 'React 19 · TypeScript', role: 'Popup and editor' },
  { name: 'Tailwind CSS v4', role: 'Styling' },
  { name: 'tabCapture · MediaRecorder', role: 'Recording, in an offscreen document' },
  { name: 'Canvas 2D', role: 'Frame rendering' },
  { name: 'WebCodecs · Mediabunny', role: 'MP4 encoding' },
  { name: 'IndexedDB', role: 'Recordings and edits' },
  { name: 'Vitest', role: 'Engine tests' },
]

const next = [
  'Record Demodrop’s own launch demo with Demodrop',
  'Keep logging the pointer when the recorded tab navigates to a new page',
  'Follow the pointer inside cross-origin iframes',
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
            A good product demo on X is zoomed in on what matters, smooth, and framed. Getting
            there usually means a screen recorder, a video editor and an hour of keyframes.
            Demodrop is a Chrome extension that does it from one tab: record, and it zooms where
            you clicked, follows your pointer and frames the page, ready to export as an MP4.
          </p>

          <dl className='mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4'>
            <Meta label='Role'>Solo: product, design, engineering</Meta>
            <Meta label='Timeline'>Oct 2026</Meta>
            <Meta label='Platform'>Chrome extension</Meta>
            <Meta label='Status'>
              <ProjectStatusBadge status={project.status} className='text-sm text-foreground' />
            </Meta>
          </dl>

          <div className='mt-6 flex flex-wrap items-center gap-2'>
            <a
              href={chromeStoreUrl}
              target='_blank'
              rel='noopener noreferrer'
              data-track='project_site_clicked'
              data-track-slug={project.slug}
              data-track-source='case_study'
              className='inline-flex h-9 items-center gap-1 rounded-full bg-foreground px-4 text-sm font-medium text-background transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97] motion-reduce:transition-none'>
              Add to Chrome
              <ArrowUpRight className='h-4 w-4' />
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
                    src={`/projects/demodrop/${shot.src}`}
                    alt={shot.alt}
                    width={1280}
                    height={800}
                    sizes='320px'
                    priority={i < 2}
                    className='w-[320px] rounded-xl border bg-muted'
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
              <p className='text-sm font-medium'>Shipping something?</p>
              <p className='text-sm text-muted-foreground'>Turn a tab into a demo worth posting.</p>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='mt-14'>
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

function Decisions({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div className='flex flex-col gap-5'>
      {items.map((item) => (
        <div key={item.title}>
          <h3>{item.title}</h3>
          <p className='text-muted-foreground'>{item.body}</p>
        </div>
      ))}
    </div>
  )
}
