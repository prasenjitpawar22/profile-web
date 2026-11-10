export type ToolId = 'read' | 'search' | 'web' | 'test' | 'edit' | 'explore' | 'files' | 'history'
/** Anything on the graph: a tool, a sub-agent, or the agent itself */
export type NodeId = ToolId | 'agent'

/** `parent` is who makes the call: the agent, or the sub-agent the tool belongs to */
export const TOOLS: Record<ToolId, { label: string; parent: NodeId }> = {
  read: { label: 'Read', parent: 'agent' },
  search: { label: 'Search', parent: 'agent' },
  web: { label: 'Web', parent: 'agent' },
  test: { label: 'Test', parent: 'agent' },
  edit: { label: 'Edit', parent: 'agent' },
  explore: { label: 'Explore', parent: 'agent' },
  files: { label: 'Files', parent: 'explore' },
  history: { label: 'History', parent: 'explore' },
}

export type Step =
  | { at: number; tool: ToolId; text: string; fail?: true }
  | { at: number; note: string; drop?: ToolId; spawn?: ToolId }

/** A believable bug hunt: at is seconds from the start of the run. Steps that share
    a time are calls made in parallel. */
export const TASK = 'Fix the flaky checkout test'

export const STEPS: Step[] = [
  { at: 0.8, tool: 'read', text: 'checkout.test.ts' },
  { at: 2.0, tool: 'search', text: 'retry in src/payments' },
  { at: 3.2, tool: 'read', text: 'payments/retry.ts' },
  { at: 4.4, tool: 'read', text: 'payments/queue.ts' },
  { at: 5.8, tool: 'test', text: 'checkout, 1 failed', fail: true },
  { at: 7.4, tool: 'web', text: 'jest fake timers flaky' },
  { at: 8.8, tool: 'web', text: 'backoff and fake timers' },
  { at: 10.2, tool: 'read', text: 'jest.config.ts' },
  { at: 11.6, tool: 'web', text: 'jest legacy timers' },
  { at: 13.6, note: 'The docs aren’t the answer, dropping that path', drop: 'web' },
  { at: 15.0, note: 'Started a sub-agent to trace the timers', spawn: 'explore' },
  { at: 16.2, tool: 'files', text: 'src/**/*.setup.ts' },
  { at: 16.2, tool: 'history', text: 'blame payments/queue.ts' },
  { at: 17.8, tool: 'files', text: 'test/**/poll*' },
  { at: 17.8, tool: 'history', text: 'log payments/poller.ts' },
  { at: 19.4, tool: 'files', text: 'src/**/poller*' },
  { at: 21.4, tool: 'read', text: 'test/setup.ts' },
  { at: 21.4, tool: 'search', text: 'setInterval' },
  { at: 23.2, tool: 'read', text: 'payments/poller.ts' },
  { at: 24.8, tool: 'edit', text: 'poller.ts, clear on stop' },
  { at: 26.6, tool: 'test', text: 'checkout, 1 failed', fail: true },
  { at: 28.4, tool: 'read', text: 'payments/poller.ts' },
  { at: 28.4, tool: 'search', text: 'new Poller(' },
  { at: 30.2, tool: 'edit', text: 'checkout.test.ts, await stop' },
  { at: 31.6, tool: 'edit', text: 'test/setup.ts, stop pollers' },
  { at: 33.4, tool: 'test', text: 'checkout, passed' },
  { at: 34.8, tool: 'read', text: 'checkout.test.ts' },
  { at: 36.2, tool: 'test', text: 'full suite, passed' },
  { at: 38.0, note: 'A poller outlived its test. Fixed.' },
]

/** The run in five acts, each from its start time, for the timeline */
export const CHAPTERS = [
  { at: 0, name: 'Investigate' },
  { at: 7.4, name: 'Dead end' },
  { at: 15, name: 'Sub-agent' },
  { at: 21.4, name: 'Fix' },
  { at: 33.4, name: 'Verify' },
]
