import { createEffect, createSignal } from 'solid-js'

interface TextStylerProps {
  text: string
  onTextChange: (text: string) => void
  style: Record<string, string | number>
  class?: string
  krLoaded: boolean
  krLoading: boolean
  krError: string
  onLoadKR: () => void
}

export default function TextStyler(props: TextStylerProps) {
  let editor: HTMLDivElement | undefined
  const [active, setActive] = createSignal({ bold: false, italic: false })

  function readEditorText() {
    // eslint-disable-next-line unicorn/prefer-dom-node-text-content -- innerText preserves newlines from contenteditable block elements.
    return editor?.innerText ?? ''
  }

  createEffect(() => {
    const value = props.text
    if (editor && readEditorText() !== value) {
      editor.textContent = value
    }
  })

  function updateActive() {
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
    })
  }

  function format(command: 'bold' | 'italic') {
    editor?.focus()
    document.execCommand(command)
    updateActive()
    props.onTextChange(readEditorText() || props.text)
  }

  return (
    <section class="flex min-h-0 w-full flex-col overflow-hidden rounded-lg border border-#44444b bg-#1e1e1f">
      <header class="flex flex-wrap items-center justify-between gap-2 border-b border-#44444b bg-#171718 px-3 py-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-500">Text preview</span>
          <span class="text-xs text-#999999">Select text to format</span>
        </div>
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-label="Bold selected text"
            aria-pressed={active().bold}
            title="Bold"
            onMouseDown={event => event.preventDefault()}
            onClick={() => format('bold')}
            class="size-8 rounded border border-#64748b text-sm font-bold hover:bg-#334155 aria-pressed:bg-#334155"
          >B</button>
          <button
            type="button"
            aria-label="Italic selected text"
            aria-pressed={active().italic}
            title="Italic"
            onMouseDown={event => event.preventDefault()}
            onClick={() => format('italic')}
            class="size-8 rounded border border-#64748b text-sm italic hover:bg-#334155 aria-pressed:bg-#334155"
          >I</button>
          <button
            type="button"
            disabled={props.krLoaded || props.krLoading}
            onClick={() => props.onLoadKR()}
            class="rounded border border-#64748b px-2.5 py-1.5 text-xs hover:bg-#334155 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {props.krLoaded ? 'Maple Mono KR loaded' : props.krLoading ? 'Loading KR…' : 'Load Maple Mono KR'}
          </button>
        </div>
      </header>
      <div
        ref={editor}
        contentEditable
        role="textbox"
        aria-label="Maple Mono text preview"
        aria-multiline="true"
        spellcheck={false}
        class={`rich-preview min-h-36 flex-1 overflow-auto whitespace-pre-wrap break-words p-3 font-liga text-base leading-relaxed outline-none focus:ring-1 focus:ring-inset focus:ring-#64748b ${props.class ?? ''}`}
        style={props.style}
        onInput={() => props.onTextChange(readEditorText())}
        onKeyUp={updateActive}
        onMouseUp={updateActive}
        onBlur={updateActive}
      />
      <style>{'.rich-preview b, .rich-preview strong { font-weight: 700 !important; font-variation-settings: "wght" 700 !important; } .rich-preview i, .rich-preview em { font-style: italic !important; }'}</style>
      <footer class="flex flex-wrap items-center justify-between gap-2 border-t border-#44444b px-3 py-1.5 text-xs text-#999999">
        <span>Bold / Italic apply to the selected range.</span>
        <span>{props.krError || (props.krLoaded ? 'Official Maple Mono KR variable font' : 'Korean font loads on demand')}</span>
      </footer>
    </section>
  )
}
