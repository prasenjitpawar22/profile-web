import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/navbar'
import { BreakToastProvider } from '@/components/break-toast/provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Prasenjit Pawar',
  description: 'Prasenjit Pawar Portfolio',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.className} min-h-screen`}>
        <BreakToastProvider>
          <NavBar />
          <main className='p-4 md:p-16 lg:p-24'>{children}</main>
        </BreakToastProvider>
      </body>
    </html>
  )
}
