import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className='group -ml-1 inline-flex items-center gap-1.5 rounded-sm px-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'>
      <ArrowLeft className='h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5' />
      {label}
    </Link>
  )
}
