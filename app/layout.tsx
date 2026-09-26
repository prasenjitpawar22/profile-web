import type { Metadata } from 'next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { PostHogProvider } from '@/components/posthog-provider'

export const metadata: Metadata = {
  title: {
    default: 'Prasenjit Pawar',
    template: '%s · Prasenjit Pawar',
  },
  description: 'Prasenjit Pawar, design engineer.',
}

// Runs before next-themes reads storage: a visitor's pick lasts until the next
// day/night flip, then the theme follows the clock again (dark after 7pm)
const nightTheme = `try{var h=new Date().getHours(),p=h>=6&&h<19?'day':'night';if(localStorage.getItem('theme-period')!==p){localStorage.setItem('theme',p==='day'?'light':'dark');localStorage.setItem('theme-period',p)}}catch(e){}`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: nightTheme }} />
      </head>
      <body
        className='flex min-h-svh flex-col font-sans'
        suppressHydrationWarning={true}
      >
        <PostHogProvider>
          <ThemeProvider>
            <main className='flex flex-1 flex-col'>{children}</main>
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
