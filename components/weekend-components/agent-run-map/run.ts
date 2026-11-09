import type { GraphNode } from './engine'

export type ToolId = 'read' | 'search' | 'web' | 'test' | 'edit' | 'explore' | 'files' | 'history'

export const ROOT: GraphNode = { id: 'agent', x: 0.5, y: 0.5, parent: null, size: 10 }

export const TOOLS: Record<ToolId, GraphNode & { label: string }> = {
  read: { id: 'read', label: 'Read', x: 0.2, y: 0.74, parent: 'agent', size: 6 },
  search: { id: 'search', label: 'Search', x: 0.16, y: 0.34, parent: 'agent', size: 6 },
  web: { id: 'web', label: 'Web', x: 0.52, y: 0.9, parent: 'agent', size: 6 },
  test: { id: 'test', label: 'Test', x: 0.86, y: 0.44, parent: 'agent', size: 6 },
  edit: { id: 'edit', label: 'Edit', x: 0.8, y: 0.8, parent: 'agent', size: 6 },
  explore: { id: 'explore', label: 'Explore', x: 0.54, y: 0.2, parent: 'agent', size: 8 },
  files: { id: 'files', label: 'Files', x: 0.3, y: 0.1, parent: 'explore', size: 6 },
  history: { id: 'history', label: 'History', x: 0.8, y: 0.12, parent: 'explore', size: 6 },
}

export type Step =
  | { at: number; tool: ToolId; text: string }
  | { at: number; note: string; drop?: ToolId }

/** A believable bug hunt: at is seconds from the start of the run */
export const TASK = 'Fix the flaky checkout test'

export const STEPS: Step[] = [
  { at: 0.8, tool: 'read', text: 'checkout.test.ts' },
  { at: 2.0, tool: 'search', text: 'retry in src/payments' },
  { at: 3.2, tool: 'read', text: 'payments/retry.ts' },
  { at: 4.4, tool: 'read', text: 'payments/queue.ts' },
  { at: 5.8, tool: 'test', text: 'checkout, 1 failed' },
  { at: 7.4, tool: 'web', text: 'jest fake timers flaky' },
  { at: 8.8, tool: 'web', text: 'backoff and fake timers' },
  { at: 10.2, tool: 'read', text: 'jest.config.ts' },
  { at: 11.6, tool: 'web', text: 'jest legacy timers' },
  { at: 13.6, note: 'The docs aren’t the answer, dropping that path', drop: 'web' },
  { at: 15.0, note: 'Started a sub-agent to trace the timers' },
  { at: 16.2, tool: 'files', text: 'src/**/*.setup.ts' },
  { at: 17.2, tool: 'history', text: 'blame payments/queue.ts' },
  { at: 18.2, tool: 'files', text: 'test/**/poll*' },
  { at: 19.4, tool: 'history', text: 'log payments/poller.ts' },
  { at: 20.6, tool: 'files', text: 'src/**/poller*' },
  { at: 21.8, tool: 'read', text: 'test/setup.ts' },
  { at: 23.0, tool: 'search', text: 'setInterval' },
  { at: 24.2, tool: 'read', text: 'payments/poller.ts' },
  { at: 25.4, tool: 'edit', text: 'poller.ts, clear on stop' },
  { at: 27.0, tool: 'test', text: 'checkout, 1 failed' },
  { at: 28.6, tool: 'read', text: 'payments/poller.ts' },
  { at: 29.8, tool: 'search', text: 'new Poller(' },
  { at: 31.0, tool: 'edit', text: 'checkout.test.ts, await stop' },
  { at: 32.4, tool: 'edit', text: 'test/setup.ts, stop pollers' },
  { at: 34.0, tool: 'test', text: 'checkout, passed' },
  { at: 35.4, tool: 'read', text: 'checkout.test.ts' },
  { at: 36.6, tool: 'test', text: 'full suite, passed' },
  { at: 38.0, note: 'A poller outlived its test. Fixed.' },
]
