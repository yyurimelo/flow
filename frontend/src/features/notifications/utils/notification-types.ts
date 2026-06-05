import { NOTIFICATION_TYPE, USER_ROLE, type UserRole, type NotificationType } from '@flow/shared'

export interface NotificationCategory {
  id: string
  label: string
  description: string
  type: NotificationType
}

const ADMIN_CATEGORIES: NotificationCategory[] = [
  { id: 'comunicado-geral', label: 'Comunicado Geral', description: 'Mensagem ampla para toda a equipe', type: NOTIFICATION_TYPE.INFO },
  { id: 'atualizacao-sistema', label: 'Atualização do Sistema', description: 'Mudanças ou melhorias na plataforma', type: NOTIFICATION_TYPE.INFO },
  { id: 'aviso-operacional', label: 'Aviso Operacional', description: 'Alertas sobre processos e operações', type: NOTIFICATION_TYPE.WARNING },
  { id: 'financeiro', label: 'Financeiro', description: 'Informações financeiras e contábeis', type: NOTIFICATION_TYPE.INFO },
  { id: 'juridico', label: 'Jurídico', description: 'Avisos legais e compliance', type: NOTIFICATION_TYPE.WARNING },
  { id: 'rh', label: 'RH', description: 'Comunicados de recursos humanos', type: NOTIFICATION_TYPE.INFO },
]

const USER_CATEGORIES: NotificationCategory[] = [
  { id: 'tarefa', label: 'Tarefa', description: 'Atribuição ou atualização de tarefa', type: NOTIFICATION_TYPE.INFO },
  { id: 'projeto', label: 'Projeto', description: 'Atualizações de projeto', type: NOTIFICATION_TYPE.INFO },
  { id: 'implementacao', label: 'Implementação', description: 'Notificações de deploy e entrega', type: NOTIFICATION_TYPE.SUCCESS },
]

export function getAvailableNotificationCategories(role: UserRole): NotificationCategory[] {
  if (role === USER_ROLE.ADMIN) return ADMIN_CATEGORIES
  return USER_CATEGORIES
}
