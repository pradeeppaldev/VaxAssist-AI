import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    id={id}
    onClick={() => !disabled && onCheckedChange?.(!checked)}
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors flex items-center justify-center",
      checked ? "bg-primary text-primary-foreground" : "bg-card border-input",
      className
    )}
    {...props}
  >
    {checked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
  </button>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
