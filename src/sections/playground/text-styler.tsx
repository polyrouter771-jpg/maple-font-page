import { createSignal } from 'solid-js'

export default function TextStyler() {
  let editor: HTMLDivElement | undefined
  const [active, setActive] = createSignal({ bold: false, italic: false })

  function format(command: 'bold' | 'italic') {
    editor?.focus()
    document.execCommand(command)
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
    })
  }

  return (
    <section class="mt-8 overflow-hidden rounded-xl border border-#44444b bg-#1e1e1f text-#cbd5e1">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-#44444b bg-#171718 px-4 py-3">
        <div>
          <div class="font-600">Rich Text Preview</div>
          <div class="text-xs text-#999999">Select text, then apply Maple Mono styles</div>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            aria-label="Bold selected text"
            aria-pressed={active().bold}
            onMouseDown={event => event.preventDefault()}
            onClick={() => format('bold')}
            class="rounded border border-#64748b px-3 py-1.5 font-bold hover:bg-#334155"
          >B</button>
          <button
            type="button"
            aria-label="Italic selected text"
            aria-pressed={active().italic}
            onMouseDown={event => event.preventDefault()}
            onClick={() => format('italic')}
            class="rounded border border-#64748b px-3 py-1.5 italic hover:bg-#334155"
          >I</button>
        </div>
      </header>
      <div
        ref={editor}
        contentEditable
        spellcheck={false}
        class="min-h-36 whitespace-pre-wrap p-4 font-mono text-base leading-relaxed outline-none focus:ring-1 focus:ring-inset focus:ring-#64748b"
        style={{ 'font-family': 'MapleMono, monospace' }}
        onKeyUp={() => setActive({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') })}
        onMouseUp={() => setActive({ bold: document.queryCommandState('bold'), italic: document.queryCommandState('italic') })}
      >
        Maple Mono KR 미리보기
        <br />
        Select this sentence and try Bold or Italic.
        <br />
        한글과 영문을 함께 입력해 보세요.
      </div>
      <footer class="border-t border-#44444b px-4 py-2 text-xs text-#999999">
        Formatting is applied to the selected range.
      </footer>
    </section>
  )
}
