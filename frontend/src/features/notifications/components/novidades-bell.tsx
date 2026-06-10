import { useState, useCallback } from 'react'
import { Megaphone, Globe, Info, CircleCheck, TriangleAlert, CircleX } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { sanitizeHtml, stripHtml } from '@/src/lib/sanitize'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_DESTINATION,
  type Notification,
  type PaginatedNotificationsResponse,
} from '@flow/shared'
import { fetchNotifications } from '../api'
import { useNotificationSocket } from '../hooks/use-notification-socket'

// ─── Query ────────────────────────────────────────────────────────────────────

export const novadesKeys = {
  all: ['novidades'] as const,
  list: () => [...novadesKeys.all, 'list'] as const,
}

function useNovadesNotifications() {
  return useQuery({
    queryKey: novadesKeys.list(),
    queryFn: () =>
      fetchNotifications({ page: 1, limit: 20, destination: NOTIFICATION_DESTINATION.SYSTEM }),
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeConfig = {
  [NOTIFICATION_TYPE.INFO]: { icon: Info, label: 'Informação' },
  [NOTIFICATION_TYPE.SUCCESS]: { icon: CircleCheck, label: 'Sucesso' },
  [NOTIFICATION_TYPE.WARNING]: { icon: TriangleAlert, label: 'Aviso' },
  [NOTIFICATION_TYPE.ERROR]: { icon: CircleX, label: 'Erro' },
}

// ─── Item ─────────────────────────────────────────────────────────────────────

function NovadesItem({
  notification,
  onOpenDetail,
}: {
  notification: Notification
  onOpenDetail: (n: Notification) => void
}) {
  const config = typeConfig[notification.type]

  return (
    <button
      onClick={() => onOpenDetail(notification)}
      className={cn(
        'w-full text-left flex gap-3 px-4 py-4 transition-colors',
        'hover:bg-accent/40 focus-visible:outline-none focus-visible:bg-accent/40',
        !notification.read && 'bg-primary/[0.025]',
      )}
    >
      <div className="mt-0.5 flex-none size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Globe className="size-[14px]" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            notification.read
              ? 'font-light text-muted-foreground'
              : 'font-medium text-foreground',
          )}
        >
          {notification.title ?? notification.content}
        </p>

        {notification.title && (
          <p className="mt-0.5 text-xs font-light text-muted-foreground/70 leading-relaxed line-clamp-1">
            {stripHtml(notification.content)}
          </p>
        )}

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[11px] font-light text-muted-foreground/50 leading-none">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
          <span className="text-muted-foreground/25 leading-none text-[11px]">·</span>
          <span className="text-[11px] font-light text-primary/60 leading-none flex items-center gap-0.5">
            <config.icon className="size-2.5" />
            {config.label}
          </span>
        </div>
      </div>
    </button>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 gap-3">
      <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
        <Megaphone className="size-4 text-muted-foreground/30" />
      </div>
      <p className="text-xs font-light text-muted-foreground/40 text-center">
        Nenhum comunicado por enquanto
      </p>
    </div>
  )
}

// ─── Detail dialog ────────────────────────────────────────────────────────────

function NovadesDetail({
  notification,
  open,
  onOpenChange,
}: {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!notification) return null

  const config = typeConfig[notification.type]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 pr-8">
            <div className="mt-0.5 size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-none">
              <Globe className="size-[14px]" />
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
            <span className="text-[11px] font-light text-muted-foreground/50">Categoria</span>
            <span className="text-xs font-normal text-foreground">{config.label}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface NovadesBellProps {
  userId: string
}

export function NovadesBell({ userId }: NovadesBellProps) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data } = useNovadesNotifications()
  const notifications = data?.data ?? []
  const hasUnread = notifications.some((n) => !n.read)

  const handleSocketNotification = useCallback(
    (notification: Notification) => {
      if (notification.destination !== NOTIFICATION_DESTINATION.SYSTEM) return

      queryClient.setQueryData(
        novadesKeys.list(),
        (old: PaginatedNotificationsResponse | undefined) => {
          if (!old) return old
          if (old.data.some((n) => n.id === notification.id)) return old
          return { ...old, data: [notification, ...old.data] }
        },
      )
      setOpen(true)
    },
    [queryClient],
  )

  useNotificationSocket(userId, handleSocketNotification)

  function handleOpenDetail(notification: Notification) {
    setDetail(notification)
    setOpen(false)
    setDetailOpen(true)
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Comunicados">
            <Megaphone className="size-5" />
            {hasUnread && (
              <>
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary animate-ping" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[340px] p-0 overflow-hidden" sideOffset={8}>
          <div className="px-4 pt-4 pb-3 border-b border-border/40">
            <p className="text-sm font-medium text-foreground">Comunicados</p>
          </div>

          <div className="divide-y divide-border/30">
            {notifications.length === 0 ? (
              <EmptyState />
            ) : (
              notifications.map((n) => (
                <NovadesItem key={n.id} notification={n} onOpenDetail={handleOpenDetail} />
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <NovadesDetail
        notification={detail}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetail(null)
        }}
      />
    </>
  )
}
