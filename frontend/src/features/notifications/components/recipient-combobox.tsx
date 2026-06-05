import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  User,
  X,
} from 'lucide-react'

import { USER_ROLE } from '@flow/shared'

import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

import { Spinner } from '@/components/ui/spinner'

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
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const buttonRef = useRef<HTMLButtonElement>(null)

  const [buttonWidth, setButtonWidth] = useState(0)

  const { users, isLoading } = useUsers(
    search.trim() || undefined,
  )

  const filteredUsers = users.filter(
    (user) => user.id !== excludeId,
  )

  const selectedUser =
    filteredUsers.find(
      (user) => user.id === value,
    ) ?? null

  useEffect(() => {
    if (!buttonRef.current) return

    const observer = new ResizeObserver(() => {
      setButtonWidth(
        buttonRef.current?.offsetWidth ?? 0,
      )
    })

    observer.observe(buttonRef.current)

    setButtonWidth(buttonRef.current.offsetWidth)

    return () => observer.disconnect()
  }, [])

  function handleSelect(userId: string) {
    onChange(userId)
    setOpen(false)
  }

  function handleClear(
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between px-3"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <User className="size-4 shrink-0 text-muted-foreground" />

            <span
              className={cn(
                'truncate text-sm',
                !selectedUser &&
                  'text-muted-foreground',
              )}
            >
              {selectedUser
                ? selectedUser.name ||
                  selectedUser.email
                : 'Selecione um destinatário'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {selectedUser && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm p-1 hover:bg-accent"
              >
                <X className="size-3.5" />
              </button>
            )}

            <ChevronDown className="size-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="p-0"
        style={{
          width:
            buttonWidth > 0
              ? `${buttonWidth}px`
              : undefined,
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar usuário..."
            value={search}
            onValueChange={setSearch}
          />

          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            ) : (
              <>
                <CommandEmpty>
                  Nenhum usuário encontrado
                </CommandEmpty>

                <CommandGroup>
                  {filteredUsers.map((user) => (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() =>
                        handleSelect(user.id)
                      }
                      className="py-2.5"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                          <User className="size-4" />
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="truncate text-sm font-medium">
                            {user.name ??
                              user.email}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {user.role ===
                            USER_ROLE.ADMIN
                              ? 'Administrador'
                              : 'Usuário'}
                          </span>
                        </div>
                      </div>

                      <Check
                        className={cn(
                          'size-4 text-primary',
                          value === user.id
                            ? 'opacity-100'
                            : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}