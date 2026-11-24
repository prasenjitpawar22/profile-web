// Throwaway prototype — delete this folder once a direction is picked
import { readFileSync } from 'fs'
import path from 'path'
import Harness from './harness'

// The page you read through the glass is the lens's own source
export default function Page() {
  const dir = path.join(process.cwd(), 'app', 'proto', 'code-lens')
  const source = readFileSync(path.join(dir, 'lens.ts'), 'utf8') + '\n' + readFileSync(path.join(dir, 'syntax.ts'), 'utf8')
  return <Harness source={source} />
}
