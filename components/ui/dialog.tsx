import * as React from "react"
import { cn } from "@/lib/utils"

interface DialogProps {
  children: React.ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div 
        className="fixed inset-0" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

const DialogContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("w-full max-w-lg p-6", className)}
    {...props}
  >
    {children}
  </div>
)

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}
    {...props}
  />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}
    {...props}
  />
)

const DialogTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
)

const DialogDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
)

export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
}
