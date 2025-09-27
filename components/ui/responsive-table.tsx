'use client'

import { ReactNode } from 'react'

interface Column {
  key: string
  label: string
  className?: string
  render?: (value: any, row: any) => ReactNode
}

interface ResponsiveTableProps {
  columns: Column[]
  data: any[]
  onRowClick?: (row: any) => void
  className?: string
}

export function ResponsiveTable({ 
  columns, 
  data, 
  onRowClick,
  className = "" 
}: ResponsiveTableProps) {
  return (
    <div className={className}>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((column, colIndex) => {
              const value = column.render ? column.render(row[column.key], row) : row[column.key]
              
              // Пропускаем пустые значения
              if (!value && value !== 0) return null
              
              return (
                <div key={column.key} className={colIndex === 0 ? 'mb-3' : 'mb-2'}>
                  {colIndex === 0 ? (
                    // Первое поле - заголовок карточки
                    <div className="font-medium text-gray-900 text-lg">
                      {value}
                    </div>
                  ) : (
                    // Остальные поля
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-gray-500 min-w-0 flex-shrink-0 mr-3">
                        {column.label}:
                      </span>
                      <span className="text-sm text-gray-900 text-right">
                        {value}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {data.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-medium">Нет данных</p>
            <p className="text-sm mt-1">Данные отсутствуют или еще не загружены</p>
          </div>
        </div>
      )}
    </div>
  )
}
