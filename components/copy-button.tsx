'use client'

import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** Copies `text`, then shows a tick for a moment (styles: .copy-button in globals.css) */
export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked: leave the button as it was
    }
  }

  return (
    <button
      type='button'
      className='copy-button'
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      data-copied={copied ? '' : undefined}>
      <Copy data-icon='copy' aria-hidden />
      <Check data-icon='check' aria-hidden />
      <span className='sr-only' aria-live='polite'>
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  )
}
