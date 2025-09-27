"use client"

import * as React from "react"

// Простой Select компонент без Radix UI
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode
}

const Select = ({ children, ...props }: { children: React.ReactNode; value?: string; onValueChange?: (value: string) => void }) => {
  return (
    <div className="relative">
      {children}
    </div>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = "", children, ...props }, ref) => (
    <button
      ref={ref}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </button>
  )
)
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ children }: SelectContentProps) => (
  <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50">
    {children}
  </div>
)

const SelectItem = React.forwardRef<HTMLDivElement, { value: string; children: React.ReactNode; className?: string }>(
  ({ value, children, className = "", ...props }, ref) => (
    <div
      ref={ref}
      className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
)
SelectItem.displayName = "SelectItem"

const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <span className="text-gray-500">{placeholder}</span>
)

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
}
