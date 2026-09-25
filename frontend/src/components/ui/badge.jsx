import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        cyan: "border-transparent bg-primary/10 text-primary border-primary/20",
        success:
          "border-status-completed/30 bg-status-completed-bg text-status-completed-fg",
        warning:
          "border-status-catchup/30 bg-status-catchup-bg text-status-catchup-fg",
        info: "border-status-due/30 bg-status-due-bg text-status-due-fg",
        review:
          "border-status-review/30 bg-status-review-bg text-status-review-fg",
        overdue:
          "border-status-overdue/30 bg-status-overdue-bg text-status-overdue-fg",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
