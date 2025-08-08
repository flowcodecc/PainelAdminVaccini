'use client'

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
  value: string
  label: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
  id?: string
  placeholder?: string
}

export function MultiSelect({ options, selected, onChange, className, id, placeholder }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    console.log('handleSelect chamado para:', value)
    console.log('Selected atual:', selected)
    
    const isSelected = selected.includes(value)
    let newSelected: string[]
    
    if (isSelected) {
      newSelected = selected.filter((item) => item !== value)
      console.log('Removendo - novo array:', newSelected)
    } else {
      newSelected = [...selected, value]
      console.log('Adicionando - novo array:', newSelected)
    }
    
    onChange(newSelected)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          id={id}
        >
          {selected.length === 0
            ? (placeholder ?? "Selecione...")
            : `${selected.length} selecionado(s)`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="py-6 text-center text-sm">Nenhuma opção encontrada.</div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSelect(option.value)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 