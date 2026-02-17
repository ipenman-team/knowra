import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-blue-500 text-white shadow hover:bg-blue-600",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-blue-50 hover:text-blue-500 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-500 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-500 aria-[pressed=true]:bg-blue-50 aria-[pressed=true]:text-blue-500 aria-[selected=true]:bg-blue-50 aria-[selected=true]:text-blue-500",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "hover:bg-blue-50 hover:text-blue-500 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-500 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-500 aria-[pressed=true]:bg-blue-50 aria-[pressed=true]:text-blue-500 aria-[selected=true]:bg-blue-50 aria-[selected=true]:text-blue-500",
        link: "text-primary/70 underline-offset-4 hover:text-blue-500 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-500 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-500 aria-[pressed=true]:bg-blue-50 aria-[pressed=true]:text-blue-500 aria-[selected=true]:bg-blue-50 aria-[selected=true]:text-blue-500",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  tooltip?: string | React.ComponentPropsWithoutRef<typeof TooltipContent>
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, tooltip, title, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        title={title}
        {...props}
      />
    )

    if (!tooltip) return button

    const tooltipContentProps =
      typeof tooltip === "string" ? { children: tooltip } : tooltip

    const trigger =
      props.disabled && !asChild ? (
        <span className="inline-flex">{button}</span>
      ) : (
        button
      )

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent {...tooltipContentProps} />
        </Tooltip>
      </TooltipProvider>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
