import { ProteinTracker } from '@/components/weekend-components/protein-tracker'
import { Metadata, Viewport } from 'next'

/* My own daily log: the Lab tracker, full screen and starting empty.
   Kept out of search; add it to the home screen to open it like an app.
   The log stays on the device, with Back up / Restore at the bottom. */
export const metadata: Metadata = {
  title: 'Protein',
  description: 'Daily protein log.',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Protein', statusBarStyle: 'default' },
  manifest: '/protein.webmanifest',
  icons: { apple: '/protein-apple-touch-icon.png' },
}

export const viewport: Viewport = {
  // Draw under the notch (the header pads itself with the safe area) and let
  // Android shrink the page for the keyboard, so the add sheet stays usable
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
}

export default function Page() {
  return (
    <div className='flex flex-1 flex-col'>
      <ProteinTracker variant='page' storageKey='protein-tracker:mine' sample={false} />
    </div>
  )
}
