import { ThemeToggle } from './theme-toggle'

/**
 * The first row of every page: whatever opens the page on the left, the theme
 * toggle on the right, so the toggle is always in the same place.
 */
export function PageTop({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className ?? ''}`}>
      <div className='min-w-0'>{children}</div>
      {/* The 32px button overhangs the ~24px first line equally top and bottom,
          so it centres on that line without pushing the row taller */}
      <div className='-my-1 shrink-0'>
        <ThemeToggle />
      </div>
    </div>
  )
}
