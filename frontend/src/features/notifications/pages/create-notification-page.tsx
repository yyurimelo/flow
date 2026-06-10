import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Send, FileText, X, Trash2, FolderOpen, Globe, User } from 'lucide-react'
import { NOTIFICATION_DESTINATION, NOTIFICATION_TYPE, USER_ROLE } from '@flow/shared'
import type { NotificationType } from '@flow/shared'
import { api } from '@/src/api/client'
import { API_ENDPOINTS } from '@flow/shared'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

import { notificationKeys } from '@/src/features/notifications/hooks/use-notifications'
import { RichTextEditor } from '../components/rich-text-editor'
import { RecipientCombobox } from '../components/recipient-combobox'
import { NotificationPreview } from '../components/notification-preview'
import {
  createNotificationFormSchema,
  type CreateNotificationFormData,
} from '../schemas/create-notification.schema'
import { getAvailableNotificationCategories } from '../utils/notification-types'
import { useLoggedUser } from '@/src/hooks/use-logged-user'

const TYPE_COLOR: Record<NotificationType, string> = {
  [NOTIFICATION_TYPE.INFO]: 'bg-primary',
  [NOTIFICATION_TYPE.SUCCESS]: 'bg-emerald-500',
  [NOTIFICATION_TYPE.WARNING]: 'bg-amber-400',
  [NOTIFICATION_TYPE.ERROR]: 'bg-destructive',
}

function TypeDot({ type, className }: { type: NotificationType; className?: string }) {
  return (
    <span
      className={cn('inline-block size-2 rounded-full flex-none', TYPE_COLOR[type], className)}
    />
  )
}

const EMPTY_DEFAULTS: CreateNotificationFormData = {
  destination: NOTIFICATION_DESTINATION.USER,
  recipientId: '',
  subject: '',
  content: '',
  categoryId: '',
}

export function CreateNotificationPage() {
  const { loggedUser } = useLoggedUser()
  const queryClient = useQueryClient()
  const isAdmin = loggedUser?.role === USER_ROLE.ADMIN

  const form = useForm({
    resolver: zodResolver(createNotificationFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const categories = loggedUser
    ? getAvailableNotificationCategories(loggedUser.role)
    : []

  const selectedCategoryId = form.watch('categoryId')
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null
  const watchedValues = form.watch()
  const watchedDestination = watchedValues.destination ?? NOTIFICATION_DESTINATION.USER
  const isSystem = watchedDestination === NOTIFICATION_DESTINATION.SYSTEM

  const { mutate: sendNotification, isPending } = useMutation({
    mutationFn: (data: CreateNotificationFormData) => {
      const category = categories.find((c) => c.id === data.categoryId)!
      return api.post(API_ENDPOINTS.NOTIFICATION.CREATE, {
        receiverId: data.destination === NOTIFICATION_DESTINATION.USER ? data.recipientId : null,
        destination: data.destination,
        title: data.subject,
        content: data.content,
        type: category.type,
      })
    },
    onSuccess: () => {
      toast.success('Notificação enviada com sucesso')
      form.reset(EMPTY_DEFAULTS)
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
    onError: () => {
      toast.error('Erro ao enviar notificação')
    },
  })

  const { mutate: saveDraft, isPending: isSavingDraft } = useMutation({
    mutationFn: async (data: CreateNotificationFormData) => {
      localStorage.setItem('flow:notification-draft', JSON.stringify(data))
      toast.info('Rascunho salvo localmente')
    },
  })

  function onSubmit(data: CreateNotificationFormData) {
    sendNotification(data)
  }

  function onSaveDraft() {
    saveDraft(form.getValues())
  }

  function onClearAll() {
    form.reset(EMPTY_DEFAULTS)
  }

  function onLoadDraft() {
    const raw = localStorage.getItem('flow:notification-draft')
    if (!raw) {
      toast.info('Nenhum rascunho salvo')
      return
    }
    try {
      const draft = JSON.parse(raw) as Partial<CreateNotificationFormData>
      form.reset({
        destination: draft.destination ?? NOTIFICATION_DESTINATION.USER,
        recipientId: draft.recipientId ?? '',
        subject: draft.subject ?? '',
        content: draft.content ?? '',
        categoryId: draft.categoryId ?? '',
      })
      toast.success('Rascunho carregado')
    } catch {
      toast.error('Rascunho inválido')
    }
  }

  return (
    <div className="flex flex-col xl:flex-row w-full gap-0 items-start">
      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full xl:flex-1 xl:min-w-0 space-y-6 xl:pr-8 xl:border-r xl:border-border/40"
        >
          {/* Assunto */}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Assunto</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      placeholder="Título da notificação"
                      maxLength={150}
                      className="pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-light text-muted-foreground/50 pointer-events-none tabular-nums">
                      {field.value.length}/150
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conteúdo */}
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Conteúdo</FormLabel>
                <FormControl>
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Escreva o conteúdo da notificação..."
                    error={!!form.formState.errors.content}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Delivery section */}
          <div className="flex flex-col gap-4 pt-2 border-t border-border/40 min-w-0">
            {/* Destination — admin only */}
            {isAdmin && (
              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Destino</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} deselectable>
                      <FormControl>
                        <SelectTrigger className="w-full rounded-md border-input bg-background">
                          {field.value === NOTIFICATION_DESTINATION.SYSTEM ? (
                            <span className="flex items-center gap-2">
                              <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-sm font-normal">Sistema — todos os usuários</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <User className="size-3.5 shrink-0 text-muted-foreground" />
                              <span className="text-sm font-normal">Pessoal — usuário específico</span>
                            </span>
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        <SelectItem value={NOTIFICATION_DESTINATION.USER} className="rounded-sm py-2.5">
                          <span className="flex items-center gap-2.5">
                            <User className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium leading-none">Pessoal</span>
                              <span className="text-[11px] font-light text-muted-foreground mt-0.5">
                                Enviada para um usuário específico
                              </span>
                            </span>
                          </span>
                        </SelectItem>
                        <SelectItem value={NOTIFICATION_DESTINATION.SYSTEM} className="rounded-sm py-2.5">
                          <span className="flex items-center gap-2.5">
                            <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                            <span className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium leading-none">Sistema</span>
                              <span className="text-[11px] font-light text-muted-foreground mt-0.5">
                                Broadcast para todos os usuários
                              </span>
                            </span>
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Recipient + Type row */}
            <div className={cn('grid gap-3', isSystem ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2')}>
              {/* Recipient — hidden when SYSTEM */}
              {!isSystem && (
                <FormField
                  control={form.control}
                  name="recipientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Destinatário</FormLabel>
                      <FormControl>
                        <RecipientCombobox
                          value={field.value}
                          onChange={field.onChange}
                          excludeId={loggedUser?.id}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Type + clear X */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => {
                  const selected = categories.find((c) => c.id === field.value) ?? null
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tipo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} deselectable>
                        <FormControl>
                          <SelectTrigger className="w-full rounded-md border-input bg-background">
                            <span className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden mr-1">
                              {selected ? (
                                <>
                                  <TypeDot type={selected.type} className="shrink-0" />
                                  <span className="truncate text-sm font-normal flex-1">{selected.label}</span>
                                  <span
                                    role="button"
                                    aria-label="Remover tipo"
                                    onPointerDown={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      field.onChange('')
                                    }}
                                    className="ml-1 flex items-center justify-center size-5 rounded-sm hover:bg-accent text-muted-foreground/50 hover:text-foreground shrink-0"
                                  >
                                    <X className="size-3.5" />
                                  </span>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-sm font-normal">
                                  Selecionar tipo...
                                </span>
                              )}
                            </span>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent
                          position="popper"
                          className="rounded-md shadow-sm ring-1 ring-border/60 dark:ring-border/40"
                        >
                          {categories.map((cat) => (
                            <SelectItem
                              key={cat.id}
                              value={cat.id}
                              className="rounded-sm py-2.5"
                            >
                              <span className="flex items-start gap-2.5">
                                <TypeDot type={cat.type} className="mt-[3px] flex-none" />
                                <span className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-sm font-medium leading-none">{cat.label}</span>
                                  <span className="text-[11px] font-light text-muted-foreground leading-snug mt-0.5">
                                    {cat.description}
                                  </span>
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 min-w-0">
              {/* Draft row — each button fills half */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onLoadDraft}
                  className="flex-1 gap-2 text-muted-foreground"
                >
                  <FolderOpen className="size-4" />
                  Carregar rascunho
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onSaveDraft}
                  disabled={isSavingDraft}
                  className="flex-1 gap-2 text-muted-foreground"
                >
                  <FileText className="size-4" />
                  Salvar rascunho
                </Button>
              </div>
              {/* Clear — full width, same size as Enviar */}
              <Button
                type="button"
                variant="ghost"
                onClick={onClearAll}
                className="w-full gap-2 text-muted-foreground/60 hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Limpar tudo
              </Button>
              {/* Primary CTA */}
              <Button
                type="submit"
                disabled={isPending}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                <Send className="size-4" />
                {isPending ? 'Enviando...' : 'Enviar notificação'}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Mobile separator */}
      <div className="xl:hidden border-t border-border/40 w-full my-6" />

      {/* Preview */}
      <div className="w-full xl:w-[360px] xl:flex-none xl:sticky xl:top-8 xl:pl-8">
        <p className="text-xs font-medium text-muted-foreground mb-3">Prévia</p>
        <NotificationPreview
          subject={watchedValues.subject}
          content={watchedValues.content}
          category={selectedCategory}
          senderName={loggedUser?.name ?? 'Você'}
          destination={watchedDestination}
        />
      </div>
    </div>
  )
}
