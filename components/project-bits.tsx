import type { Download, Project, ProjectStatus } from '@/lib/projects'
import { ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** The project's logo, or a quiet monogram tile when it doesn't have one */
export function ProjectIcon({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  if (project.icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- tiny SVG, nothing to optimise
      <img
        src={project.icon}
        alt=''
        className={cn('h-9 w-9 shrink-0 rounded-[10px]', className)}
      />
    )
  }
  return (
    <span
      aria-hidden
      className={cn(
        'grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border bg-muted text-xs font-semibold tracking-tight text-muted-foreground',
        className,
      )}>
      {project.monogram}
    </span>
  )
}

const dotColor: Record<ProjectStatus, string> = {
  Live: 'bg-grass',
  'In progress': 'bg-amber-500',
  Completed: 'bg-muted-foreground/60',
  Offline: 'bg-red-500/70',
}

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground',
        className,
      )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColor[status])} />
      {status}
    </span>
  )
}

/**
 * A desktop app's platforms: the ready ones download, the rest say they're
 * coming. Sits inside a row, so it never wraps the row in a link itself.
 */
export function PlatformDownloads({
  downloads,
  slug,
  className,
}: {
  downloads: Download[]
  slug: string
  className?: string
}) {
  return (
    <span className={cn('flex flex-wrap items-center gap-x-3 gap-y-2 text-sm', className)}>
      {downloads.map((download) =>
        download.url ? (
          <a
            key={download.platform}
            href={download.url}
            data-track='project_download_clicked'
            data-track-slug={slug}
            data-track-platform={download.platform}
            className='hit-area inline-flex items-center gap-1 rounded-sm text-foreground [--hit-x:6px] [--hit-y:4px] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
            <ArrowDown aria-hidden className='h-3.5 w-3.5' />
            {download.platform}
            {download.note ? <span className='text-muted-foreground'>{download.note}</span> : null}
          </a>
        ) : (
          <span key={download.platform} className='text-muted-foreground'>
            {download.platform} <span className='italic'>soon</span>
          </span>
        ),
      )}
    </span>
  )
}
