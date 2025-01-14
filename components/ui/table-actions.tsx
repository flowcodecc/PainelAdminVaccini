import React from 'react'
import { Edit2, Trash2, ChevronDown, ChevronUp, Save } from 'lucide-react'
import { Button } from './button'

interface TableActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  onToggle?: () => void
  onSave?: () => void
  isExpanded?: boolean
  isEditing?: boolean
  disabled?: boolean
}

export function TableActions({
  onEdit,
  onDelete,
  onToggle,
  onSave,
  isExpanded,
  isEditing,
  disabled = false
}: TableActionsProps) {
  return (
    <div className="flex space-x-2">
      {onToggle && (
        <Button variant="ghost" size="sm" onClick={onToggle}>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      )}
      {isEditing ? (
        <Button variant="ghost" size="sm" onClick={onSave} disabled={disabled}>
          <Save className="h-4 w-4" />
        </Button>
      ) : (
        <>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} disabled={disabled}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} disabled={disabled}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
    </div>
  )
}

