'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)

  // Отслеживание размера окна
  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth)
    }

    updateWindowWidth()
    window.addEventListener('resize', updateWindowWidth)
    return () => window.removeEventListener('resize', updateWindowWidth)
  }, [])

  // Определение мобильного режима
  const isMobile = windowWidth > 0 && windowWidth < 1024

  // Автозакрытие мобильного меню при увеличении экрана
  useEffect(() => {
    if (!isMobile && isMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }, [isMobile, isMobileMenuOpen])

  // Блокировка скролла при открытом мобильном меню
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobile, isMobileMenuOpen])

  const handleMenuClick = () => {
    setIsMobileMenuOpen(prev => !prev)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - всегда видимый */}
      <Header
        onMenuClick={handleMenuClick}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* Desktop Sidebar - data-атрибут для принудительного CSS */}
      <aside 
        data-desktop-sidebar
        className="hidden lg:block w-64 min-h-screen bg-white border-r border-gray-200 fixed left-0 top-16 z-30"
      >
        <Sidebar />
      </aside>

      {/* Mobile Overlay - только для мобильных */}
      {isMobile && isMobileMenuOpen && (
        <div data-mobile-overlay>
          {/* Затемненный фон */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMobileMenu}
          />
          
          {/* Мобильное меню */}
          <aside className={`
            fixed left-0 top-16 bottom-0 w-80 max-w-[85vw]
            bg-white border-r border-gray-200 z-50
            transform transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <Sidebar 
              isOpen={isMobileMenuOpen} 
              onClose={closeMobileMenu}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main 
        data-desktop-main
        className="flex-1 min-h-screen pt-18 p-6 lg:ml-64"
      >
        <div className="max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
