import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'

const links = [
  { name: 'X', href: 'https://x.com/PrasenjitPawar' },
  { name: 'GitHub', href: 'https://github.com/prasenjitpawar22' },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/in/prasenjit-pawar-2b378b77/',
  },
]

export function SiteFooter({
  className,
  socials = true,
  themeToggle = true,
}: {
  className?: string
  /** The home page shows its socials at the top instead */
  socials?: boolean
  /** The Lab is always dark, so it has nothing to toggle */
  themeToggle?: boolean
}) {
  return (
    <footer className={cn('page', className)}>
      <div className='hairline' />
      <div className='flex min-h-[4.75rem] items-center justify-between py-6 text-sm'>
        {socials ? (
          <ul className='flex gap-4'>
            {links.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='hit-area rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <span />
        )}
        {themeToggle ? <ThemeToggle /> : null}
      </div>
    </footer>
  )
}
