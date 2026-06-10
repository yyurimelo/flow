import { z } from 'zod'
import { NOTIFICATION_DESTINATION } from '@flow/shared'

export const createNotificationFormSchema = z
  .object({
    destination: z.enum([NOTIFICATION_DESTINATION.USER, NOTIFICATION_DESTINATION.SYSTEM]),
    recipientId: z.string(),
    subject: z
      .string()
      .min(1, 'Assunto é obrigatório')
      .max(150, 'Máximo de 150 caracteres'),
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    categoryId: z.string().min(1, 'Selecione um tipo'),
  })
  .superRefine((data, ctx) => {
    if (
      data.destination === NOTIFICATION_DESTINATION.USER &&
      !data.recipientId
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['recipientId'],
        message: 'Selecione um destinatário',
      })
    }
  })

export type CreateNotificationFormData = z.infer<typeof createNotificationFormSchema>
