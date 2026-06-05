import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  CornerDownLeft,
  Undo2,
  Redo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
  disabled?: boolean
}

function ToolbarButton({ onClick, active, title, children, disabled }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'size-7 rounded-md flex items-center justify-center transition-colors',
        'text-muted-foreground hover:bg-accent hover:text-foreground',
        'disabled:pointer-events-none disabled:opacity-30',
        active && 'bg-primary/10 text-primary',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-border/60 mx-0.5 flex-none" />
}

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
  error?: boolean
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Escreva o conteúdo da notificação...',
  minHeight = 220,
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: { HTMLAttributes: { class: 'tiptap-code-block' } },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'tiptap-link' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
  })

  if (!editor) return null

  function handleLink() {
    const prev = editor!.getAttributes('link').href as string | undefined
    const url = window.prompt('URL do link:', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor!.chain().focus().unsetLink().run()
    } else {
      editor!.chain().focus().setLink({ href: url }).run()
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border bg-background overflow-hidden transition-colors',
        'focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-ring',
        error ? 'border-destructive' : 'border-input',
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-2 border-b border-border/50 bg-muted/20">
        <ToolbarButton
          title="Desfazer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Refazer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 className="size-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          title="Negrito"
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Itálico"
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Sublinhado"
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Tachado"
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="size-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          title="Título 1"
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Título 2"
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Título 3"
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          title="Lista"
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Lista numerada"
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          title="Citação"
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Bloco de código"
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <Code className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Link"
          active={editor.isActive('link')}
          onClick={handleLink}
        >
          <LinkIcon className="size-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          title="Quebra de linha"
          onClick={() => editor.chain().focus().setHardBreak().run()}
        >
          <CornerDownLeft className="size-3.5" />
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="tiptap-editor px-4 py-3 text-sm focus-visible:outline-none"
      />
    </div>
  )
}
