import { createMemo, createSignal } from 'solid-js'

const sample = `fun main() {
    val numbers = listOf(1, 2, 3, 4, 5)
    val doubled = numbers.map { it * 2 }

    println("Maple Mono + Kotlin")
    doubled.forEach { value ->
        println(value)
    }
}`

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function highlightKotlin(source: string) {
  const token = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\b(?:package|import|as|is|in|this|super|val|var|fun|class|interface|object|typealias|constructor|init|where|by|delegate|dynamic|if|else|when|try|catch|finally|for|do|while|throw|return|break|continue|true|false|null|public|private|protected|internal|open|final|abstract|override|inline|noinline|crossinline|suspend|tailrec|operator|infix|external|enum|annotation|sealed|data|inner|companion|const|lateinit|vararg|reified|out|expect|actual)\b|\b\d+(?:\.\d+)?\b|@[A-Za-z_][\w.]*|[A-Za-z_][\w]*)/g
  let result = ''
  let last = 0
  for (const match of source.matchAll(token)) {
    const value = match[0]
    const index = match.index ?? 0
    result += escapeHtml(source.slice(last, index))
    let kind = 'plain'
    if (value.startsWith('//') || value.startsWith('/*')) kind = 'comment'
    else if (value.startsWith('"') || value.startsWith("'")) kind = 'string'
    else if (value.startsWith('@')) kind = 'annotation'
    else if (/^\d/.test(value)) kind = 'number'
    else if (/^(fun|val|var|class|interface|object|typealias|return|if|else|when|for|while|do|try|catch|throw|is|in|as|this|super|package|import|true|false|null|public|private|protected|internal|override|suspend|data|sealed|enum|annotation|const|lateinit|companion)$/.test(value)) kind = 'keyword'
    else if (/^[A-Z]/.test(value)) kind = 'type'
    result += `<span class="kt-${kind}">${escapeHtml(value)}</span>`
    last = index + value.length
  }
  return result + escapeHtml(source.slice(last)) + '\n'
}

export default function KotlinEditor() {
  const [code, setCode] = createSignal(sample)
  const highlighted = createMemo(() => highlightKotlin(code()))
  const lineCount = createMemo(() => code().split('\n').length)
  return (
    <section class="mt-8 overflow-hidden rounded-xl border border-#44444b bg-#1e1e1f text-#cbd5e1">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-#44444b bg-#171718 px-4 py-3">
        <div>
          <div class="font-600">Kotlin Playground</div>
          <div class="text-xs text-#999999">Maple Theme · syntax highlighting</div>
        </div>
        <span class="rounded bg-#334155 px-2 py-1 text-xs text-#cbd5e1">Kotlin</span>
      </header>
      <div class="relative min-h-72 font-mono text-sm leading-6">
        <div class="pointer-events-none absolute inset-0 flex overflow-hidden">
          <div class="w-12 shrink-0 select-none bg-#171718 py-3 pr-3 text-right text-#64748b">
            <ForLines count={lineCount()} />
          </div>
          <pre class="m-0 flex-1 overflow-hidden whitespace-pre-wrap break-words p-3" aria-hidden="true" innerHTML={highlighted()} />
        </div>
        <textarea
          aria-label="Kotlin source code"
          spellcheck={false}
          autocapitalize="off"
          autocomplete="off"
          autocorrect="off"
          value={code()}
          onInput={event => setCode(event.currentTarget.value)}
          onScroll={event => {
            const pre = event.currentTarget.parentElement?.querySelector('pre')
            const gutter = event.currentTarget.parentElement?.querySelector('.kotlin-gutter')
            if (pre) { pre.scrollTop = event.currentTarget.scrollTop; pre.scrollLeft = event.currentTarget.scrollLeft }
            if (gutter) gutter.scrollTop = event.currentTarget.scrollTop
          }}
          class="relative z-1 block min-h-72 w-full resize-y bg-transparent py-3 pl-15 pr-3 font-mono text-sm leading-6 text-transparent caret-#f5e7d6 outline-none selection:bg-#475569/70"
          style={{ 'white-space': 'pre', 'overflow-wrap': 'normal' }}
        />
      </div>
      <footer class="flex items-center justify-between border-t border-#44444b px-4 py-2 text-xs text-#999999">
        <span>Live highlighting · No lint diagnostics</span>
        <span>{lineCount()} lines</span>
      </footer>
      <style>
        {`
          .kt-keyword { color: #c792ea; }
          .kt-string { color: #a4dfae; }
          .kt-comment { color: #7f848e; font-style: italic; }
          .kt-number { color: #f5a97f; }
          .kt-annotation { color: #eecfa0; }
          .kt-type { color: #8fc7ff; }
          .kt-plain { color: #cbd5e1; }
        `}
      </style>
    </section>
  )
}

function ForLines(props: { count: number }) {
  return <div class="kotlin-gutter overflow-hidden pr-3">{Array.from({ length: props.count }, (_, index) => <div>{index + 1}</div>)}</div>
}
