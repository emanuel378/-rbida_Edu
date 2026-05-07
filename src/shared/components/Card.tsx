import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', hoverable = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        ${hoverable ? 'hover:shadow-md hover:border-gray-200 cursor-pointer transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  action?: ReactNode
}

export function CardHeader({ title, subtitle, icon: Icon, action }: CardHeaderProps) {
  return (
    <div className="p-6 border-b border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

interface CardContentProps {
  children: ReactNode
  className?: string
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  )
}

interface BadgeProps {
  text: string
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  icon?: LucideIcon
}

const badgeColors = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
}

export function Badge({ text, color = 'blue', icon: Icon }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${badgeColors[color]}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {text}
    </span>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6">{description}</p>
      {action}
    </div>
  )
}
