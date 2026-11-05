'use client'

import { useId, useRef, useState } from 'react'
import { useLiquidLens } from './liquid-lens'
import { Droplet, MistedPasswordInput } from './misted-password-input'
import { NightWindow } from './night-window'
import './rainy-window.css'

/**
 * A sign-in screen behind a rainy car window at night. The password field is
 * misted glass: the password shows through only as blurred lamp light until
 * it's wiped clear. Fills its container edge to edge.
 */
export function RainyWindow() {
  const uid = useId()
  const ids = { title: `${uid}-title`, email: `${uid}-email`, password: `${uid}-password`, note: `${uid}-note` }
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  // While the password is wiped, the street outside pulls into focus too
  const [revealing, setRevealing] = useState(false)
  const cardRef = useRef<HTMLElement>(null)
  useLiquidLens(cardRef)

  return (
    // Cancels the Lab stage's padding so the window fills the card
    <div className='rainy-window -m-6 h-[620px] w-[calc(100%+3rem)]'>
      <NightWindow focus={revealing ? 0.85 : 0} />

      <section ref={cardRef} className='glass-card' aria-labelledby={ids.title}>
        <div className='glass-mark' aria-hidden='true'>
          <Droplet size={20} />
        </div>
        <p id={ids.title} className='glass-title'>
          Welcome back
        </p>
        <p className='glass-sub'>Sign in to pick up where you left off.</p>

        <form
          className='glass-form'
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (!password) {
              setError('Enter your password to continue.')
              return
            }
            setError('')
            setState('busy')
            setTimeout(() => setState('done'), 1000)
          }}>
          <div className='glass-field'>
            <label htmlFor={ids.email}>Email</label>
            <input
              id={ids.email}
              name='email'
              type='email'
              autoComplete='username'
              placeholder='you@example.com'
              className='glass-input'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className='glass-field'>
            <div className='glass-label-row'>
              <label htmlFor={ids.password}>Password</label>
              <a href='#' onClick={(e) => e.preventDefault()}>
                Forgot?
              </a>
            </div>
            <MistedPasswordInput
              id={ids.password}
              name='password'
              value={password}
              onChange={(v) => {
                setPassword(v)
                if (error && v) setError('')
              }}
              placeholder='Enter your password'
              onRevealChange={setRevealing}
              aria-invalid={!!error}
              aria-describedby={ids.note}
            />
            <p id={ids.note} className={error ? 'glass-note glass-error' : 'glass-note'}>
              {error || 'Hold the drop and wipe across the glass to read it.'}
            </p>
          </div>

          <button type='submit' className='glass-submit' disabled={state === 'busy'}>
            {state === 'busy' ? 'Signing in…' : state === 'done' ? 'Signed in' : 'Sign in'}
          </button>
        </form>

        <p className='glass-foot'>
          New here?{' '}
          <a href='#' onClick={(e) => e.preventDefault()}>
            Create an account
          </a>
        </p>
      </section>
    </div>
  )
}
