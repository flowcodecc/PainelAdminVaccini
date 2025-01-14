import { Button } from "./button"
import { ChevronDown, ChevronUp, Pencil, Save, X, Trash2 } from "lucide-react"

interface TableActionsProps {
  onEdit?: () => void
  onDelete?: () => void
  onToggle?: () => void
  onSave?: () => void
  isExpanded?: boolean
  isEditing?: boolean
  onCancel?: () => void
}

export function TableActions({
  onToggle,
  onEdit,
  onDelete,
  isExpanded,
  isEditing,
  onSave,
  onCancel
}: TableActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="icon" onClick={onToggle}>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>
      {isEditing ? (
        <>
          <Button variant="ghost" size="icon" onClick={onSave}>
            <Save className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </>
      ) : (
        <>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </>
      )}
    </div>
  )
}

