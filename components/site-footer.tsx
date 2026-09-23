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

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn('page', className)}>
      <div className='hairline' />
      <div className='flex items-center justify-between py-6 text-sm'>
        <ul className='flex gap-4'>
          {links.map((link) => (
            <li key={link.name}>
              <a
                href={link.href}
                target='_blank'
                rel='noopener noreferrer'
                className='rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                {link.name}
              </a>
            </li>
          ))}
        </ul>
        <ThemeToggle />
      </div>
    </footer>
  )
}
