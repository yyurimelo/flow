import { useState } from 'react'
import { User } from 'lucide-react'
import { USER_ROLE } from '@flow/shared'
import { cn } from '@/lib/utils'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { useUsers } from '@/src/features/users/hooks/use-users'

interface RecipientComboboxProps {
  value?: string
  onChange: (value: string) => void
  excludeId?: string
}

export function RecipientCombobox({
  value,
  onChange,
  excludeId,
}: RecipientComboboxProps) {
  const [search, setSearch] = useState('')
  const { users, isLoading } = useUsers(search.trim() || undefined)
  const filteredUsers = users.filter((user) => user.id !== excludeId)

  return (
    <SearchableSelect
      value={value}
      onChange={onChange}
      items={filteredUsers}
      isLoading={isLoading}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar usuário..."
      placeholder="Selecione um destinatário"
      emptyMessage="Nenhum usuário encontrado"
      getItemKey={(u) => u.id}
      getItemValue={(u) => u.id}
      getDisplayText={(u) => u?.name || u?.email || undefined}
      renderItem={(user) => (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <User className="size-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-medium">
              {user.name ?? user.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {user.role === USER_ROLE.ADMIN ? 'Administrador' : 'Usuário'}
            </span>
          </div>
        </div>
      )}
      renderSelectedContent={(user) => (
        <div className="flex items-center gap-3 overflow-hidden">
          <User className="size-4 shrink-0 text-muted-foreground" />
          <span
            className={cn(
              'truncate text-sm',
              !user && 'text-muted-foreground',
            )}
          >
            {user ? (user.name || user.email) : 'Selecione um destinatário'}
          </span>
        </div>
      )}
    />
  )
}
