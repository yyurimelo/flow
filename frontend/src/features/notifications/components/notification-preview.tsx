import { useState } from 'react'
import { User, Globe, Info, CircleCheck, TriangleAlert, CircleX, Bell } from 'lucide-react'
import { NOTIFICATION_DESTINATION, type NotificationDestination } from '@flow/shared'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/src/lib/sanitize'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { NotificationCategory } from '../utils/notification-types'

const typeConfig = {
  INFO: { icon: Info },
  SUCCESS: { icon: CircleCheck },
  WARNING: { icon: TriangleAlert },
  ERROR: { icon: CircleX },
} as const

interface NotificationPreviewProps {
  subject: string
  content: string
  category: NotificationCategory | null
  senderName: string
  destination?: NotificationDestination
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-light text-muted-foreground/50">{label}</span>
      <span className="text-xs font-normal text-foreground">{value}</span>
    </div>
  )
}

function DetailDialog({
  subject,
  content,
  category,
  senderName,
  destination,
  open,
  onOpenChange,
}: {
  subject: string
  content: string
  category: NotificationCategory | null
  senderName: string
  destination: NotificationDestination
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isSystem = destination === NOTIFICATION_DESTINATION.SYSTEM
  const DestIcon = isSystem ? Globe : User

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="mt-0.5 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-none">
              <DestIcon className="size-[14px]" />
            </div>
            <DialogTitle className="text-base font-medium leading-snug">
              {subject || 'Sem assunto'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {content && (
          <div
            className="notification-content text-sm text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
          />
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border/40 pt-4">
          <MetaRow label="Data e hora" value={format(new Date(), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })} />
          <MetaRow label="Origem" value={senderName || '—'} />
          <MetaRow label="Categoria" value={category?.label ?? '—'} />
          <MetaRow label="Status" value="Não lida" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function NotificationPreview({
  subject,
  content,
  category,
  senderName,
  destination = NOTIFICATION_DESTINATION.USER,
}: NotificationPreviewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const isEmpty = !subject && !content && !category

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
        <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
          <Bell className="size-4 text-muted-foreground/30" />
        </div>
        <p className="text-xs font-light text-muted-foreground/40">
          Preencha o formulário para visualizar a prévia
        </p>
      </div>
    )
  }

  const isSystem = destination === NOTIFICATION_DESTINATION.SYSTEM
  const DestIcon = isSystem ? Globe : User
  const config = category ? typeConfig[category.type] : null
  const TypeIcon = config?.icon ?? Info

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Bell dropdown panel replica */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="px-4 pt-4 pb-0">
            <p className="text-sm font-medium text-foreground mb-3">Notificações</p>
          </div>
          <div className="flex border-b border-border/40 px-4">
            <div className="pb-2.5 text-xs font-medium text-foreground border-b-2 border-primary -mb-px flex items-center gap-1.5">
              Não lidas
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                1
              </span>
            </div>
            <div className="pb-2.5 text-xs font-medium text-muted-foreground ml-4">Lidas</div>
          </div>
          <div className="relative">
            <div className="flex gap-3 px-4 py-4 bg-primary/[0.025]">
              <div className="mt-0.5 flex-none size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <DestIcon className="size-[14px]" />
              </div>
              <div className="flex-1 min-w-0 pr-3">
                <p
                  className={cn(
                    'text-sm leading-snug',
                    subject ? 'font-medium text-foreground' : 'font-light text-muted-foreground/40 italic',
                  )}
                >
                  {subject || 'Sem assunto'}
                </p>
                {content && (
                  <div
                    className="mt-0.5 text-xs font-light text-muted-foreground/70 leading-relaxed line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                  />
                )}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-[11px] font-normal text-muted-foreground/60 leading-none">
                    {senderName}
                  </span>
                  <span className="text-muted-foreground/25 leading-none text-[11px]">·</span>
                  <span className="text-[11px] font-light text-muted-foreground/50 leading-none">agora</span>
                  {category && (
                    <>
                      <span className="text-muted-foreground/25 leading-none text-[11px]">·</span>
                      <span className="text-[11px] font-light text-primary/60 leading-none flex items-center gap-0.5">
                        <TypeIcon className="size-2.5" />
                        {isSystem ? 'Sistema' : 'Pessoal'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <span className="absolute top-[18px] right-4 size-1.5 rounded-full bg-primary pointer-events-none" />
          </div>
        </div>

        {/* Open detail dialog button */}
        {(subject || content) && (
          <Button
            variant="outline"
            className="w-full text-sm"
            onClick={() => setDialogOpen(true)}
          >
            Visualizar prévia completa
          </Button>
        )}
      </div>

      <DetailDialog
        subject={subject}
        content={content}
        category={category}
        senderName={senderName}
        destination={destination}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}
