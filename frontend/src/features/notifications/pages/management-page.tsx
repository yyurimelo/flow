import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Globe,
  User,
  Info,
  CircleCheck,
  TriangleAlert,
  CircleX,
  MoreHorizontal,
  Settings2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  NOTIFICATION_TYPE,
  NOTIFICATION_DESTINATION,
  type Notification,
  type NotificationDestination,
  type NotificationType,
} from '@flow/shared'
import { cn } from '@/lib/utils'
import { stripHtml } from '@/src/lib/sanitize'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useInfiniteManagedNotifications, useSetNotificationActive } from '../hooks/use-notifications'
import { sanitizeHtml } from '@/src/lib/sanitize'

// ─── Config ─────────────────────────────────────────────────────────────────

const typeConfig = {
  [NOTIFICATION_TYPE.INFO]: { icon: Info, label: 'Informação' },
  [NOTIFICATION_TYPE.SUCCESS]: { icon: CircleCheck, label: 'Sucesso' },
  [NOTIFICATION_TYPE.WARNING]: { icon: TriangleAlert, label: 'Aviso' },
  [NOTIFICATION_TYPE.ERROR]: { icon: CircleX, label: 'Erro' },
} as const

// ─── Filter pill ─────────────────────────────────────────────────────────────

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

// ─── MetaRow ─────────────────────────────────────────────────────────────────

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-light text-muted-foreground/50">{label}</span>
      <span className="text-xs font-normal text-foreground">{value}</span>
    </div>
  )
}

// ─── Detail dialog ────────────────────────────────────────────────────────────

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
          <MetaRow
            label="Destinatário"
            value={
              isSystem
                ? 'Todos (Sistema)'
                : (notification.receiverName ?? notification.receiverId ?? '—')
            }
          />
          <MetaRow label="Categoria" value={config.label} />
          <MetaRow label="Status" value={notification.active ? 'Ativo' : 'Inativo'} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Management item ──────────────────────────────────────────────────────────

function ManagementItem({
  notification,
  onToggleActive,
  onOpenDetail,
}: {
  notification: Notification
  onToggleActive: (id: string, active: boolean) => void
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
          !notification.active && 'opacity-50',
        )}
      >
        <div className="mt-0.5 flex-none size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <DestIcon className="size-[14px]" />
        </div>

        <div className="flex-1 min-w-0 pr-10">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground leading-snug truncate">
              {notification.title ?? notification.content}
            </p>
            {!notification.active && (
              <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0 text-[10px] font-medium text-muted-foreground shrink-0">
                Inativo
              </span>
            )}
          </div>

          {notification.title && (
            <p className="mt-0.5 text-xs font-light text-muted-foreground/70 leading-relaxed line-clamp-1">
              {stripHtml(notification.content)}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className="text-[11px] font-light text-muted-foreground/50 leading-none">
              {format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
            <span className="text-muted-foreground/25 leading-none text-[11px]">·</span>
            <span className="text-[11px] font-light text-primary/60 leading-none flex items-center gap-0.5">
              <config.icon className="size-2.5" />
              {config.label}
            </span>
            <span className="text-muted-foreground/25 leading-none text-[11px]">·</span>
            <span className="text-[11px] font-light text-muted-foreground/50 leading-none">
              {isSystem ? 'Sistema' : (notification.receiverName ?? 'Usuário')}
            </span>
          </div>
        </div>
      </button>

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
              onClick={() => onOpenDetail(notification)}
              className="text-sm font-light cursor-pointer"
            >
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onToggleActive(notification.id, !notification.active)}
              className={cn(
                'text-sm font-light cursor-pointer',
                notification.active && 'text-destructive focus:text-destructive',
              )}
            >
              {notification.active ? 'Desativar' : 'Reativar'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── Empty / loading ──────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="size-10 rounded-full bg-muted/50 flex items-center justify-center">
        <Settings2 className="size-4 text-muted-foreground/30" />
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

// ─── Main page ────────────────────────────────────────────────────────────────

type DestFilter = NotificationDestination | 'ALL'
type TypeFilter = NotificationType | 'ALL'
type ActiveFilter = 'ALL' | 'ACTIVE'

export function ManagementPage() {
  const [destFilter, setDestFilter] = useState<DestFilter>('ALL')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('ALL')
  const [detail, setDetail] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const filters = {
    ...(destFilter !== 'ALL' && { destination: destFilter as NotificationDestination }),
    ...(typeFilter !== 'ALL' && { type: typeFilter as NotificationType }),
    ...(activeFilter === 'ACTIVE' && { active: true }),
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteManagedNotifications(filters)

  const { mutate: setActive } = useSetNotificationActive()

  const allNotifications = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.meta.total

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

  function handleToggleActive(id: string, active: boolean) {
    setActive(
      { id, active },
      {
        onSuccess: () => {
          toast.success(active ? 'Notificação reativada' : 'Notificação desativada')
        },
        onError: () => {
          toast.error('Erro ao alterar status da notificação')
        },
      },
    )
  }

  function handleOpenDetail(notification: Notification) {
    setDetail(notification)
    setDetailOpen(true)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-foreground">Gerenciamento</h2>
          <p className="text-sm font-light text-muted-foreground mt-0.5">
            {total !== undefined
              ? `${total} ${total !== 1 ? 'notificações' : 'notificação'} ${total !== 1 ? 'enviadas' : 'enviada'}`
              : 'Carregando...'}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-y-2 gap-x-3 items-center pb-3 border-b border-border/40">
          {/* Destination */}
          <div className="flex items-center gap-0.5">
            <FilterPill<DestFilter> value="ALL" active={destFilter === 'ALL'} onClick={setDestFilter}>
              Todos
            </FilterPill>
            <FilterPill<DestFilter>
              value={NOTIFICATION_DESTINATION.USER}
              active={destFilter === NOTIFICATION_DESTINATION.USER}
              onClick={setDestFilter}
            >
              Pessoal
            </FilterPill>
            <FilterPill<DestFilter>
              value={NOTIFICATION_DESTINATION.SYSTEM}
              active={destFilter === NOTIFICATION_DESTINATION.SYSTEM}
              onClick={setDestFilter}
            >
              Sistema
            </FilterPill>
          </div>

          <div className="h-3 w-px bg-border/40 hidden sm:block" />

          {/* Type */}
          <div className="flex items-center gap-0.5">
            <FilterPill<TypeFilter> value="ALL" active={typeFilter === 'ALL'} onClick={setTypeFilter}>
              Qualquer tipo
            </FilterPill>
            {(Object.keys(typeConfig) as NotificationType[]).map((t) => (
              <FilterPill<TypeFilter> key={t} value={t} active={typeFilter === t} onClick={setTypeFilter}>
                {typeConfig[t].label}
              </FilterPill>
            ))}
          </div>

          <div className="h-3 w-px bg-border/40 hidden sm:block" />

          {/* Active status */}
          <div className="flex items-center gap-0.5">
            <FilterPill<ActiveFilter> value="ALL" active={activeFilter === 'ALL'} onClick={setActiveFilter}>
              Todos os status
            </FilterPill>
            <FilterPill<ActiveFilter> value="ACTIVE" active={activeFilter === 'ACTIVE'} onClick={setActiveFilter}>
              Ativos
            </FilterPill>
          </div>
        </div>

        {/* List */}
        <div className="rounded-lg border border-border/60 overflow-hidden">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonItem key={i} />)
          ) : allNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-border/40">
              {allNotifications.map((n) => (
                <ManagementItem
                  key={n.id}
                  notification={n}
                  onToggleActive={handleToggleActive}
                  onOpenDetail={handleOpenDetail}
                />
              ))}
            </div>
          )}

          {/* Sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="divide-y divide-border/40">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonItem key={`next-${i}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <NotificationDetail
        notification={detail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
