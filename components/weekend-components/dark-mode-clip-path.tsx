import { useTheme } from 'next-themes'
import { Button } from '../ui/button'

export function DarkModeClipPath() {
  const { setTheme, theme, themes } = useTheme()

  return (
    <div className='relative flex p-2 border bg-background text-slate-700 rounded-md h-[200px]  text-sm w-full items-center justify-center'>
      <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme} 
      </Button>
    </div>
  )
}
