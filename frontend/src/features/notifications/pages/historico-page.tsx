import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Globe,
  User,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  MoreHorizontal,
  Bell,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_DESTINATION,
  NOTIFICATION_SCOPE,
  type Notification,
  type NotificationDestination,
  type PaginatedNotificationsResponse,
} from '@flow/shared'
import { useLoggedUserStore } from '@/src/stores/logged-user.store'
import { cn } from '@/lib/utils'
import { sanitizeHtml, stripHtml } from '@/src/lib/sanitize'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInfiniteNotifications, useMarkAsRead, notificationKeys } from '../hooks/use-notifications'
import { useNotificationSocket } from '../hooks/use-notification-socket'

const typeConfig = {
  [NOTIFICATION_TYPE.INFO]: { icon: Info, label: 'Info' },
  [NOTIFICATION_TYPE.SUCCESS]: { icon: CircleCheck, label: 'Sucesso' },
  [NOTIFICATION_TYPE.WARNING]: { icon: TriangleAlert, label: 'Aviso' },
  [NOTIFICATION_TYPE.ERROR]: { icon: CircleX, label: 'Erro' },
}

// ─── Filter pill ────────────────────────────────────────────────────────────

function FilterPill<T extends string>({
  value,
  active,
  onClick,
  children,
}: {
  value: T
  active: boolean
  onClick: (v: T) => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

// ─── Notification item ───────────────────────────────────────────────────────

function HistoryItem({
  notification,
  onMarkRead,
  onOpenDetail,
}: {
  notification: Notification
  onMarkRead: (id: string, read: boolean) => void
  onOpenDetail: (n: Notification) => void
}) {
  const config = typeConfig[notification.type]
  const isSystem = notification.destination === NOTIFICATION_DESTINATION.SYSTEM
  const DestIcon = isSystem ? Globe : User

  return (
    <div className="relative group">
      <button
        onClick={() => onOpenDetail(notification)}
        className={cn(
          'w-full text-left flex gap-3 px-4 py-4 transition-colors',
          'hover:bg-accent/40 focus-visible:outline-none focus-visible:bg-accent/40',
          !notification.read && 'bg-primary/[0.025]',
        )}
      >
        <div className="mt-0.5 flex-none size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <DestIcon className="size-[14px]" />
        </div>

        <div className="flex-1 min-w-0 pr-3">
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
            {notification.senderName && (
              <>
                <span className="text-[11px] font-normal text-muted-foreground/60 leading-none">
                  {notification.senderName}
                </span>
                <span className="text-muted-foreground/25 leading-none text-[11px]">·</span>
              </>
            )}
            <span className="text-[11px] font-light text-muted-foreground/50 leading-none">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
            <span className="text-muted-foreground/25 leading-none text-[11px]">·</span>
            <span className="text-[11px] font-light text-primary/60 leading-none flex items-center gap-0.5">
              <config.icon className="size-2.5" />
              {isSystem ? 'Sistema' : 'Pessoal'}
            </span>
          </div>
        </div>
      </button>

      {!notification.read && (
        <span className="absolute top-[18px] right-4 size-1.5 rounded-full bg-primary pointer-events-none transition-opacity group-hover:opacity-0" />
      )}

      <div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              className="size-6 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => onMarkRead(notification.id, !notification.read)}
              className="text-sm font-light cursor-pointer"
            >
              {notification.read ? 'Marcar como não lida' : 'Marcar como lida'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── Detail dialog ───────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-light text-muted-foreground/50">{label}</span>
      <span className="text-xs font-normal text-foreground">{value}</span>
    </div>
  )
}

function NotificationDetail({
  notification,
  open,
  onOpenChange,
}: {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!notification) return null

  const isSystem = notification.destination === NOTIFICATION_DESTINATION.SYSTEM
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
          <MetaRow
            label="Data e hora"
            value={format(new Date(notification.createdAt), "dd 'de' MMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          />
          <MetaRow label="Origem" value={notification.senderName ?? 'Sistema'} />
          <MetaRow label="Categoria" value={typeConfig[notification.type]?.label ?? notification.type} />
          <MetaRow label="Status" value={notification.read ? 'Lida' : 'Não lida'} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Empty / loading states ──────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
        <Bell className="size-4 text-muted-foreground/30" />
      </div>
      <p className="text-xs font-light text-muted-foreground/40">Nenhuma notificação encontrada</p>
    </div>
  )
}

function SkeletonItem() {
  return (
    <div className="flex gap-3 px-4 py-4 animate-pulse">
      <div className="mt-0.5 size-8 rounded-full bg-muted/50 shrink-0" />
      <div className="flex-1 min-w-0 space-y-2 pt-1">
        <div className="h-3 bg-muted/50 rounded w-3/4" />
        <div className="h-2.5 bg-muted/30 rounded w-1/2" />
        <div className="h-2 bg-muted/20 rounded w-1/3" />
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

type DestinationFilter = NotificationDestination | 'ALL'

export function HistoricoPage() {
  const queryClient = useQueryClient()
  const userId = useLoggedUserStore((s) => s.loggedUser?.id ?? null)
  const [destFilter, setDestFilter] = useState<DestinationFilter>('ALL')
  const [readFilter, setReadFilter] = useState<boolean | undefined>(undefined)
  const [detail, setDetail] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const filters = {
    scope: NOTIFICATION_SCOPE.RECEIVED,
    ...(destFilter !== 'ALL' && { destination: destFilter as NotificationDestination }),
    ...(readFilter !== undefined && { read: readFilter }),
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNotifications(filters)

  const { mutate: markAsRead } = useMarkAsRead()

  const handleSocketNotification = useCallback(
    (notification: Notification) => {
      // Skip if destination filter excludes this notification
      if (destFilter !== 'ALL' && notification.destination !== destFilter) return
      // New notifications are unread; skip if showing read-only
      if (readFilter === true) return

      queryClient.setQueryData(
        notificationKeys.infinite(filters),
        (old: InfiniteData<PaginatedNotificationsResponse> | undefined) => {
          if (!old?.pages[0]) return old
          if (old.pages[0].data.some((n) => n.id === notification.id)) return old
          return {
            ...old,
            pages: [
              {
                ...old.pages[0],
                data: [notification, ...old.pages[0].data],
                meta: {
                  ...old.pages[0].meta,
                  total: old.pages[0].meta.total + 1,
                  unreadCount: old.pages[0].meta.unreadCount + 1,
                },
              },
              ...old.pages.slice(1),
            ],
          }
        },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [queryClient, destFilter, readFilter],
  )

  useNotificationSocket(userId, handleSocketNotification)

  const allNotifications = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.meta.total

  // Infinite scroll via IntersectionObserver
  const handleSentinel = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(handleSentinel, { threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [handleSentinel])

  function handleMarkRead(id: string, read: boolean) {
    markAsRead({ id, read })
  }

  function handleOpenDetail(notification: Notification) {
    setDetail(notification)
    setDetailOpen(true)
    if (!notification.read) {
      markAsRead({ id: notification.id, read: true })
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-foreground">Histórico</h2>
          <p className="text-sm font-light text-muted-foreground mt-0.5">
            {total !== undefined ? `${total} notificação${total !== 1 ? 'ões' : ''}` : 'Carregando...'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-y-2 gap-x-3 items-center pb-3 border-b border-border/40">
          {/* Destination */}
          <div className="flex items-center gap-0.5">
            <FilterPill value={'ALL' as DestinationFilter} active={destFilter === 'ALL'} onClick={setDestFilter}>
              Qualquer destino
            </FilterPill>
            <FilterPill value={NOTIFICATION_DESTINATION.USER} active={destFilter === NOTIFICATION_DESTINATION.USER} onClick={setDestFilter}>
              Pessoal
            </FilterPill>
            <FilterPill value={NOTIFICATION_DESTINATION.SYSTEM} active={destFilter === NOTIFICATION_DESTINATION.SYSTEM} onClick={setDestFilter}>
              Sistema
            </FilterPill>
          </div>

          <div className="h-3 w-px bg-border/40 hidden sm:block" />

          {/* Read status */}
          <div className="flex items-center gap-0.5">
            <FilterPill<'all' | 'unread' | 'read'>
              value="all"
              active={readFilter === undefined}
              onClick={() => setReadFilter(undefined)}
            >
              Todas
            </FilterPill>
            <FilterPill<'all' | 'unread' | 'read'>
              value="unread"
              active={readFilter === false}
              onClick={() => setReadFilter(false)}
            >
              Não lidas
            </FilterPill>
            <FilterPill<'all' | 'unread' | 'read'>
              value="read"
              active={readFilter === true}
              onClick={() => setReadFilter(true)}
            >
              Lidas
            </FilterPill>
          </div>
        </div>

        {/* List */}
        <div className="-mx-6 divide-y divide-border/30">
          {isLoading && (
            <>
              <SkeletonItem />
              <SkeletonItem />
              <SkeletonItem />
            </>
          )}

          {!isLoading && allNotifications.length === 0 && <EmptyState />}

          {allNotifications.map((n) => (
            <HistoryItem
              key={n.id}
              notification={n}
              onMarkRead={handleMarkRead}
              onOpenDetail={handleOpenDetail}
            />
          ))}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <>
              <SkeletonItem />
              <SkeletonItem />
            </>
          )}

          {!hasNextPage && allNotifications.length > 0 && (
            <p className="text-center text-xs font-light text-muted-foreground/40 py-6">
              Fim do histórico
            </p>
          )}
        </div>
      </div>

      <NotificationDetail
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
