import { Globe, User, Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/src/lib/sanitize'
import type { NotificationCategory } from '../utils/notification-types'

const typeConfig = {
  INFO: { icon: Info, label: 'Informação', color: 'text-primary' },
  SUCCESS: { icon: CircleCheck, label: 'Sucesso', color: 'text-primary' },
  WARNING: { icon: TriangleAlert, label: 'Aviso', color: 'text-primary' },
  ERROR: { icon: CircleX, label: 'Erro', color: 'text-primary' },
} as const

interface NotificationPreviewProps {
  subject: string
  content: string
  category: NotificationCategory | null
  senderName: string
}

export function NotificationPreview({
  subject,
  content,
  category,
  senderName,
}: NotificationPreviewProps) {
  const isEmpty = !subject && !content && !category

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
          <User className="size-4 text-muted-foreground/30" />
        </div>
        <p className="text-xs font-light text-muted-foreground/40">
          Preencha o formulário para visualizar a prévia
        </p>
      </div>
    )
  }

  const config = category ? typeConfig[category.type] : null
  const TypeIcon = config?.icon ?? Info

  return (
    <div className="flex flex-col gap-0">
      {/* Preview item */}
      <div className="flex gap-3 px-4 py-4 bg-primary/[0.025] border border-primary/10 rounded-lg">
        <div className="mt-0.5 flex-none size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Globe className="size-[14px]" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Subject */}
          {subject ? (
            <p className="text-sm font-medium text-foreground leading-snug">
              {subject}
            </p>
          ) : (
            <p className="text-sm font-medium text-muted-foreground/40 leading-snug italic">
              Sem assunto
            </p>
          )}

          {/* Content preview */}
          {content ? (
            <div
              className="mt-0.5 text-xs font-light text-muted-foreground/70 leading-relaxed line-clamp-2"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            />
          ) : (
            <p className="mt-0.5 text-xs font-light text-muted-foreground/30 italic">
              Sem conteúdo
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[11px] font-light text-muted-foreground/50 leading-none">
              {senderName}
            </span>
            {category && (
              <>
                <span className="text-muted-foreground/25 text-[11px]">·</span>
                <span className="text-[11px] font-light text-primary/60 leading-none flex items-center gap-0.5">
                  <TypeIcon className="size-2.5" />
                  {category.label}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Full dialog preview */}
      {(subject || content) && (
        <div className="mt-4 rounded-lg border border-border/50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/40 bg-muted/10">
            <p className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-wider">
              Visualização completa
            </p>
          </div>
          <div className="px-4 py-4 flex gap-3">
            <div className="mt-0.5 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-none shrink-0">
              <Globe className="size-[14px]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium leading-snug', !subject && 'text-muted-foreground/40 italic')}>
                {subject || 'Sem assunto'}
              </p>
              {content && (
                <div
                  className="mt-3 text-sm font-light leading-relaxed text-foreground/80 prose prose-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                />
              )}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border/40 mt-4 pt-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-light text-muted-foreground/50">De</span>
                  <span className="text-xs font-normal text-foreground">{senderName || '—'}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-light text-muted-foreground/50">Categoria</span>
                  <span className="text-xs font-normal text-foreground">{category?.label ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
