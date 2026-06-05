import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Send, FileText } from 'lucide-react'
import { NOTIFICATION_DESTINATION, NOTIFICATION_TYPE } from '@flow/shared'
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

import type { NotificationType } from '@flow/shared'
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

export function CreateNotificationPage() {
  const { loggedUser } = useLoggedUser()
  const queryClient = useQueryClient()

  const form = useForm<CreateNotificationFormData>({
    resolver: zodResolver(createNotificationFormSchema),
    defaultValues: {
      recipientId: '',
      subject: '',
      content: '',
      categoryId: '',
    },
  })

  const categories = loggedUser
    ? getAvailableNotificationCategories(loggedUser.role)
    : []

  const selectedCategoryId = form.watch('categoryId')
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null

  const watchedValues = form.watch()

  const { mutate: sendNotification, isPending } = useMutation({
    mutationFn: (data: CreateNotificationFormData) => {
      const category = categories.find((c) => c.id === data.categoryId)!
      return api.post(API_ENDPOINTS.NOTIFICATION.CREATE, {
        receiverId: data.recipientId,
        destination: NOTIFICATION_DESTINATION.USER,
        title: data.subject,
        content: data.content,
        type: category.type,
      })
    },
    onSuccess: () => {
      toast.success('Notificação enviada com sucesso')
      form.reset()
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
    onError: () => {
      toast.error('Erro ao enviar notificação')
    },
  })

  const { mutate: saveDraft, isPending: isSavingDraft } = useMutation({
    mutationFn: async (data: CreateNotificationFormData) => {
      toast.info('Rascunho salvo localmente')
      localStorage.setItem('flow:notification-draft', JSON.stringify(data))
    },
  })

  function onSubmit(data: CreateNotificationFormData) {
    sendNotification(data)
  }

  function onSaveDraft() {
    const values = form.getValues()
    saveDraft(values)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-8 items-start">
      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 min-w-0 space-y-6"
        >
          {/* Assunto */}
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Assunto
                </FormLabel>
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
                <FormLabel className="text-sm font-medium">
                  Conteúdo
                </FormLabel>
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

          {/* Destinatário + Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => {
                const selected = categories.find((c) => c.id === field.value) ?? null
                return (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full rounded-md border-input bg-background">
                          {selected ? (
                            <span className="flex items-center gap-2 min-w-0">
                              <TypeDot type={selected.type} />
                              <span className="truncate text-sm font-normal">{selected.label}</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm font-normal">
                              Selecionar tipo...
                            </span>
                          )}
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
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSaveDraft}
              disabled={isSavingDraft}
              className="gap-2"
            >
              <FileText className="size-4" />
              Salvar rascunho
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Send className="size-4" />
              {isPending ? 'Enviando...' : 'Enviar notificação'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Preview */}
      <div className="w-full lg:w-[300px] lg:flex-none lg:sticky lg:top-6">
        <p className="text-xs font-medium text-muted-foreground/60 mb-3 uppercase tracking-widest">
          Prévia
        </p>
        <NotificationPreview
          subject={watchedValues.subject}
          content={watchedValues.content}
          category={selectedCategory}
          senderName={loggedUser?.name ?? 'Você'}
        />
      </div>
    </div>
  )
}
