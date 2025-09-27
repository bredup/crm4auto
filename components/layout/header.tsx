'use client'

import { Bell, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  onMenuClick: () => void
  isMobileMenuOpen: boolean
}

export function Header({ onMenuClick, isMobileMenuOpen }: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const handleProfileClick = () => {
    router.push('/dashboard/profile')
  }

  const handleSettingsClick = () => {
    router.push('/dashboard/settings')
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700 h-16">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button - только на мобильных */}
          <div data-mobile-menu-btn className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="p-2 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-blue-400">CRM4Auto</h1>
            <span className="text-sm text-gray-400 ml-1">.ru</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Имя пользователя - отображается на desktop */}
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-300">
            <span>Добро пожаловать, </span>
            <span className="font-medium text-white">{session?.user?.name || 'Пользователь'}</span>
          </div>

          {/* Уведомления */}
          <Button variant="ghost" size="sm" className="relative text-gray-300 hover:text-white hover:bg-gray-700">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full text-gray-300 hover:text-white hover:bg-gray-700">
                <Avatar className="h-9 w-9">
                  <AvatarImage 
                    src={session?.user?.image || undefined} 
                    alt={session?.user?.name || "User"} 
                  />
                  <AvatarFallback className="bg-blue-500 text-white">
                    {session?.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg" align="end" forceMount>
              <div className="flex flex-col space-y-1 p-3">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || 'Пользователь'}
                </p>
                <p className="text-xs text-gray-600">
                  {session?.user?.email}
                </p>
              </div>
              <DropdownMenuSeparator className="bg-gray-200" />
              
              <DropdownMenuItem 
                className="cursor-pointer text-gray-700 hover:bg-gray-100 px-3 py-2"
                onClick={handleProfileClick}
              >
                Мой профиль
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer text-gray-700 hover:bg-gray-100 px-3 py-2"
                onClick={handleSettingsClick}
              >
                Настройки
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 hover:bg-red-50 px-3 py-2 font-medium"
                onClick={handleSignOut}
              >
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
