import { NextResponse, type NextRequest } from 'next/server'

// Hosts are derived from the request so this works on any port in dev
// and on the real domain in production.
const LAB_PREFIX = 'lab.'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname, search, protocol } = request.nextUrl

  if (host.startsWith(LAB_PREFIX)) {
    // lab.<domain>/ serves the craft page
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/craft', request.url))
    }
    if (pathname === '/craft') {
      return NextResponse.redirect(`${protocol}//${host}/`, 308)
    }
    // Everything else belongs to the main site
    const siteHost = host.slice(LAB_PREFIX.length)
    return NextResponse.redirect(`${protocol}//${siteHost}${pathname}${search}`, 308)
  }

  // Old /craft links move to the subdomain; browsers keep the #hash
  if (pathname === '/craft') {
    const labHost = LAB_PREFIX + host.replace(/^www\./, '')
    return NextResponse.redirect(`${protocol}//${labHost}/`, 308)
  }

  return NextResponse.next()
}

export const config = {
  // Pages only: skip Next internals, API routes and files like /icon.svg
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
