import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Spinner } from '@/components/ui/spinner'

interface SearchableSelectProps<T> {
  value?: string
  onChange: (value: string) => void
  items: T[]
  isLoading?: boolean
  searchValue: string
  onSearchChange: (search: string) => void
  searchPlaceholder?: string
  placeholder?: string
  emptyMessage?: string
  getItemKey: (item: T) => string
  getItemValue: (item: T) => string
  renderItem: (item: T) => React.ReactNode
  renderSelectedContent?: (item: T | null) => React.ReactNode
  getDisplayText?: (item: T | null) => string | undefined
  className?: string
}

export function SearchableSelect<T>({
  value,
  onChange,
  items,
  isLoading = false,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  placeholder = 'Selecione...',
  emptyMessage = 'Nenhum resultado',
  getItemKey,
  getItemValue,
  renderItem,
  renderSelectedContent,
  getDisplayText,
  className,
}: SearchableSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [buttonWidth, setButtonWidth] = useState(0)

  const selectedItem = items.find((item) => getItemValue(item) === value) ?? null

  useEffect(() => {
    if (!buttonRef.current) return
    const observer = new ResizeObserver(() => {
      setButtonWidth(buttonRef.current?.offsetWidth ?? 0)
    })
    observer.observe(buttonRef.current)
    setButtonWidth(buttonRef.current.offsetWidth)
    return () => observer.disconnect()
  }, [])

  function handleSelect(itemValue: string) {
    onChange(itemValue === value ? '' : itemValue)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between px-3', className)}
        >
          {renderSelectedContent ? (
            renderSelectedContent(selectedItem)
          ) : (
            <span className={cn('truncate text-sm', !selectedItem && 'text-muted-foreground')}>
              {getDisplayText?.(selectedItem) ?? placeholder}
            </span>
          )}

          <div className="flex items-center gap-1">
            {selectedItem && (
              <button type="button" onClick={handleClear} className="rounded-sm p-1 hover:bg-accent">
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
        style={{ width: buttonWidth > 0 ? `${buttonWidth}px` : undefined }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={getItemKey(item)}
                      value={getItemValue(item)}
                      onSelect={() => handleSelect(getItemValue(item))}
                      className="py-2.5"
                    >
                      {renderItem(item)}
                      <Check
                        className={cn(
                          'size-4 text-primary',
                          value === getItemValue(item) ? 'opacity-100' : 'opacity-0',
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
