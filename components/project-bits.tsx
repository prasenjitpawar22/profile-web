import type { Project, ProjectStatus } from '@/lib/projects'
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
