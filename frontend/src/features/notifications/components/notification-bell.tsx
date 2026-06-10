import { useState, useCallback } from 'react'
import {
  Bell,
  Globe,
  User,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  MoreHorizontal,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { sanitizeHtml, stripHtml } from '@/src/lib/sanitize'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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

// Filters for USER-destination notifications only
function userOnly(notifications: Notification[]) {
  return notifications.filter((n) => n.destination === NOTIFICATION_DESTINATION.USER)
}
import { useNotifications, useMarkAsRead, notificationKeys } from '../hooks/use-notifications'
import { useNotificationSocket } from '../hooks/use-notification-socket'

const typeConfig = {
  [NOTIFICATION_TYPE.INFO]: { icon: Info, label: 'Informação' },
  [NOTIFICATION_TYPE.SUCCESS]: { icon: CircleCheck, label: 'Sucesso' },
  [NOTIFICATION_TYPE.WARNING]: { icon: TriangleAlert, label: 'Aviso' },
  [NOTIFICATION_TYPE.ERROR]: { icon: CircleX, label: 'Erro' },
}

function NotificationItem({
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
      {/* Clickable body → opens detail dialog */}
      <button
        onClick={() => onOpenDetail(notification)}
        className={cn(
          'w-full text-left flex gap-3 px-4 py-4 transition-colors',
          'hover:bg-accent/40 focus-visible:outline-none focus-visible:bg-accent/40',
          !notification.read && 'bg-primary/[0.025]',
        )}
      >
        {/* Icon: destination shape, primary color */}
        <div className="mt-0.5 flex-none size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <DestIcon className="size-[14px]" />
        </div>

        <div className="flex-1 min-w-0 pr-3">
          {/* Title */}
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

          {/* Content preview */}
          {notification.title && (
            <p className="mt-0.5 text-xs font-light text-muted-foreground/70 leading-relaxed line-clamp-1">
              {stripHtml(notification.content)}
            </p>
          )}

          {/* Metadata row */}
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

      {/* Unread dot — fades out on hover (replaced by 3-dot) */}
      {!notification.read && (
        <span className="absolute top-[18px] right-4 size-1.5 rounded-full bg-primary pointer-events-none transition-opacity group-hover:opacity-0" />
      )}

      {/* 3-dot action menu — appears on hover */}
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

function EmptyState({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 gap-3">
      <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
        <Bell className="size-4 text-muted-foreground/30" />
      </div>
      <p className="text-xs font-light text-muted-foreground/40 text-center">
        {tab === 'unread' ? 'Tudo em dia por aqui' : 'Nenhuma notificação lida ainda'}
      </p>
    </div>
  )
}

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

  const config = typeConfig[notification.type]
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

        {/* Full message */}
        {notification.title && (
          <div
            className="notification-content text-sm text-foreground/90 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(notification.content) }}
          />
        )}

        {/* Metadata grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border/40 pt-4">
          <MetaRow
            label="Data e hora"
            value={format(new Date(notification.createdAt), "dd 'de' MMM 'de' yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          />
          <MetaRow label="Origem" value={notification.senderName ?? 'Sistema'} />
          <MetaRow label="Categoria" value={config.label} />
          <MetaRow
            label="Status"
            value={notification.read ? 'Lida' : 'Não lida'}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface NotificationBellProps {
  userId: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'unread' | 'read'>('unread')
  const [detail, setDetail] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const queryClient = useQueryClient()

  const unread = useNotifications(false)
  const read = useNotifications(true)
  const { mutate: markAsRead } = useMarkAsRead()

  const unreadNotifications = userOnly(unread.data?.data ?? [])
  const readNotifications = userOnly(read.data?.data ?? [])
  const unreadCount = unreadNotifications.length

  const handleSocketNotification = useCallback(
    (notification: Notification) => {
      if (notification.destination !== NOTIFICATION_DESTINATION.USER) return
      queryClient.setQueryData(
        notificationKeys.list(false),
        (old: PaginatedNotificationsResponse | undefined) => {
          if (!old) return old
          if (old.data.some((n) => n.id === notification.id)) return old
          return {
            ...old,
            data: [notification, ...old.data].slice(0, 3),
            meta: {
              ...old.meta,
              unreadCount: old.meta.unreadCount + 1,
              total: old.meta.total + 1,
            },
          }
        },
      )
      setTab('unread')
      setOpen(true)
    },
    [queryClient],
  )

  useNotificationSocket(userId, handleSocketNotification)

  function handleMarkRead(id: string, read: boolean) {
    markAsRead({ id, read })
  }

  function handleOpenDetail(notification: Notification) {
    setDetail(notification)
    setOpen(false)
    setDetailOpen(true)
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
            <Bell className="size-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-[3px] text-[10px] font-semibold leading-none text-primary-foreground">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[340px] p-0 overflow-hidden" sideOffset={8}>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'unread' | 'read')} className="gap-0">
            {/* Header */}
            <div className="px-4 pt-4 pb-0">
              <p className="text-sm font-medium text-foreground mb-3">Notificações</p>
            </div>

            {/* Full-width tabs with line — border-b on list itself so active underline overlaps it */}
            <TabsList
              variant="line"
              className="w-full h-auto rounded-none bg-transparent px-4 pb-0 gap-0 border-b border-border/40"
            >
              <TabsTrigger
                value="unread"
                className="flex-1 justify-center gap-2 pt-2 pb-3 text-xs font-medium rounded-none px-0 [&::after]:bg-primary [&::after]:bottom-[-1px] [&::after]:z-10 data-active:text-foreground"
              >
                Não lidas
                {unreadCount > 0 && (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="read"
                className="flex-1 justify-center pt-2 pb-3 text-xs font-medium rounded-none px-0 [&::after]:bg-primary [&::after]:bottom-[-1px] [&::after]:z-10 data-active:text-foreground"
              >
                Lidas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unread" className="mt-0">
              <div className="divide-y divide-border/30">
                {unreadNotifications.length === 0 ? (
                  <EmptyState tab="unread" />
                ) : (
                  unreadNotifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      onOpenDetail={handleOpenDetail}
                    />
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="read" className="mt-0">
              <div className="divide-y divide-border/30">
                {readNotifications.length === 0 ? (
                  <EmptyState tab="read" />
                ) : (
                  readNotifications.map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={handleMarkRead}
                      onOpenDetail={handleOpenDetail}
                    />
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DropdownMenuContent>
      </DropdownMenu>

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
