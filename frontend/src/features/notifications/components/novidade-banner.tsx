import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/src/lib/sanitize'
import { NOTIFICATION_DESTINATION, type Notification } from '@flow/shared'
import { useQuery } from '@tanstack/react-query'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { fetchNotifications } from '../api'
import { novadesKeys } from './novidades-bell'

function NovaBannerDetail({
  notification,
  open,
  onOpenChange,
}: {
  notification: Notification
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <div className="mt-0.5 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-none">
              <Sparkles className="size-[14px]" />
            </div>
            <DialogTitle className="text-base font-medium leading-snug">
              {notification.title ?? notification.content}
            </DialogTitle>
          </div>
        </DialogHeader>

        {notification.title && (
          <div
            className="notification-content text-sm text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(notification.content) }}
          />
        )}

        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border/40 pt-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-light text-muted-foreground/50">Data e hora</span>
            <span className="text-xs font-normal text-foreground">
              {format(new Date(notification.createdAt), "dd 'de' MMM 'de' yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-light text-muted-foreground/50">Origem</span>
            <span className="text-xs font-normal text-foreground">Sistema</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function NovaBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(true)
  const [detailOpen, setDetailOpen] = useState(false)

  const { data } = useQuery({
    queryKey: novadesKeys.list(),
    queryFn: () =>
      fetchNotifications({ page: 1, limit: 20, destination: NOTIFICATION_DESTINATION.SYSTEM }),
    staleTime: 60_000,
  })

  const notification = data?.data[0] ?? null

  if (!notification || !visible) return null

  function handleDismiss() {
    setDismissed(true)
    setTimeout(() => setVisible(false), 300)
  }

  return (
    <>
      <div
        className={cn(
          'relative rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-4 transition-all duration-300 mb-8',
          dismissed && 'opacity-0 -translate-y-1',
        )}
      >
        <div className="flex gap-3">
          <div className="mt-0.5 size-8 flex-none rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="size-[14px]" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <p className="text-[11px] font-medium text-primary/70 uppercase tracking-widest leading-none mb-1.5">
              Novidade
            </p>
            <p className="text-sm font-medium text-foreground leading-snug">
              {notification.title ?? notification.content}
            </p>
            {notification.title && (
              <div
                className="notification-content mt-1.5 text-sm text-foreground/85 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(notification.content) }}
              />
            )}
            <div className="flex items-center gap-3 mt-2.5">
              <span className="text-[11px] font-light text-muted-foreground/50">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </span>
              <button
                onClick={() => setDetailOpen(true)}
                className="text-[11px] font-medium text-primary/70 hover:text-primary transition-colors"
              >
                Ver detalhes
              </button>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDismiss}
          className="absolute top-3 right-3 size-6 text-muted-foreground/40 hover:text-muted-foreground"
        >
          <X className="size-3" />
        </Button>
      </div>

      <NovaBannerDetail
        notification={notification}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
