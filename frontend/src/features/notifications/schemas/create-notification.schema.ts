import { z } from 'zod'

export const createNotificationFormSchema = z.object({
  recipientId: z.string().min(1, 'Selecione um destinatário'),
  subject: z
    .string()
    .min(1, 'Assunto é obrigatório')
    .max(150, 'Máximo de 150 caracteres'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  categoryId: z.string().min(1, 'Selecione um tipo'),
})

export type CreateNotificationFormData = z.infer<typeof createNotificationFormSchema>
