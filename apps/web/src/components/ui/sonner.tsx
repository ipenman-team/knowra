"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      icons={{
        success: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        error: <XCircle className="h-4 w-4 text-red-600" />,
        warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
