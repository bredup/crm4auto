'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Car,
  FileText,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,
  Wrench,
  UserCircle,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavItem[]
  roles?: string[]
}

const navigation: NavItem[] = [
  {
    title: 'Главная',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Записи',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    title: 'Пользователи',
    href: '/dashboard/users',
    icon: Users,
    roles: ['admin', 'manager'],
  },
  {
    title: 'Клиенты',
    href: '/dashboard/clients',
    icon: UserCircle,
  },
  {
    title: 'Автомобили',
    href: '/dashboard/vehicles',
    icon: Car,
  },
  {
    title: 'Заказ-наряды',
    href: '/dashboard/orders',
    icon: FileText,
    badge: '3',
  },
  {
    title: 'Справочники',
    href: '#',
    icon: Package,
    children: [
      {
        title: 'Услуги',
        href: '/dashboard/services',
        icon: Wrench,
      },
      {
        title: 'Запчасти',
        href: '/dashboard/inventory',
        icon: Package,
      },
    ],
  },
  {
    title: 'Настройки',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin'],
  },
]

export function Sidebar({ isOpen, onClose, className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Справочники'])

  // Фильтрация навигации по ролям пользователя
  const getFilteredNavigation = () => {
    const userRole = session?.user?.role || 'user'
    
    return navigation.filter(item => {
      if (!item.roles) return true
      return item.roles.includes(userRole)
    })
  }

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const handleLinkClick = () => {
    if (onClose) {
      onClose()
    }
  }

  const isItemActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const isActive = isItemActive(item.href)

    if (hasChildren) {
      return (
        <div key={item.title}>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-left font-normal h-11 text-gray-300 hover:text-white hover:bg-gray-700',
              level > 0 && 'pl-8',
              isActive && 'bg-gray-700 text-white border-r-2 border-blue-400'
            )}
            onClick={() => toggleExpanded(item.title)}
          >
            <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronRight className="ml-2 h-4 w-4" />
            )}
          </Button>
          
          {isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children?.map(child => renderNavItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    if (item.href === '#') {
      return null
    }

    return (
      <Link key={item.href} href={item.href} onClick={handleLinkClick}>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-left font-normal h-11 text-gray-300 hover:text-white hover:bg-gray-700',
            level > 0 && 'pl-8',
            isActive && 'bg-gray-700 text-white border-r-2 border-blue-400'
          )}
        >
          <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {item.badge}
            </span>
          )}
        </Button>
      </Link>
    )
  }

  return (
    <nav className={cn('flex flex-col h-full bg-gray-800', className)}>
      {/* Header внутри сайдбара для мобильных */}
      {isOpen !== undefined && (
        <div className="p-4 border-b border-gray-700 lg:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Меню</h2>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-300 hover:text-white">
                ✕
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Навигационные элементы */}
      <div className="flex-1 space-y-1 p-4 pb-2">
        {getFilteredNavigation().map(item => renderNavItem(item))}
      </div>

      {/* Footer с версией CRM - приподнят */}
      <div className="p-4 pt-2 border-t border-gray-700">
        {/* Версия CRM */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-300">CRM4Auto</p>
          <p className="text-xs text-gray-500">Версия 1.0.0</p>
          <p className="text-xs text-gray-600 mt-1">© 2024</p>
        </div>
      </div>
    </nav>
  )
}
