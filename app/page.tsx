// import { Grass } from '@/components/grass'
import { PageTop } from '@/components/page-top'
import { SocialLinks } from '@/components/social-links'
import { LAB_URL } from '@/lib/site'
import Link from 'next/link'

// Fade each block in a beat after the one above it
const enter =
  'animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:animate-none'

const sections = [
  { name: 'Projects', href: '/projects' },
  { name: 'Lab', href: LAB_URL },
  { name: 'Writing', href: '/writing' },
]

export default function Home() {
  return (
    <div className='flex flex-1 flex-col pb-20 md:pb-28'>
      <div className='page pt-20 md:pt-28'>
        <PageTop className={enter}>
          {/* 18px leads the page without shouting; 450, not 500, because
              Geist is variable and medium read too heavy here */}
          <h1 className='text-lg font-[450] leading-[1.35] tracking-[-0.005em]'>Prasenjit Pawar</h1>
          <p className='mt-0.5 text-muted-foreground'>Software/Design Engineer</p>
        </PageTop>

        <nav className={`mt-7 ${enter} delay-[60ms]`}>
          <ul className='flex gap-4'>
            {sections.map((section) => (
              <li key={section.name}>
                <Link
                  href={section.href}
                  data-track='home_section_clicked'
                  data-track-section={section.name.toLowerCase()}
                  className='hit-area rounded-sm underline decoration-transparent decoration-[0.09em] underline-offset-4 transition-[text-decoration-color] duration-150 [--hit-x:8px] hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                  {section.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* 9px + the icons' 5px padding = 14px of visible space below the links */}
        <SocialLinks className={`mt-[9px] ${enter} delay-[120ms]`} />
      </div>

      {/* <div className='mt-auto pt-20'>
        <Grass />
      </div> */}
    </div>
  )
}
