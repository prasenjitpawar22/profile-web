import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { CopyButton } from './copy-button'

/**
 * An article code block that follows the site theme: a lightly tinted card
 * with the language and a copy button on top. Prism only tags the tokens;
 * their colors come from `.code-block .token` in globals.css.
 */
export function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <figure className='not-prose code-block'>
      <div className='code-block-head'>
        <span>{language}</span>
        <CopyButton text={code} />
      </div>
      <SyntaxHighlighter language={language} useInlineStyles={false} PreTag={ScrollablePre}>
        {code}
      </SyntaxHighlighter>
    </figure>
  )
}

// Long lines scroll inside the block, so it takes focus for keyboard scrolling
function ScrollablePre(props: React.ComponentProps<'pre'>) {
  return <pre {...props} tabIndex={0} />
}
