interface Props {
  progress: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export default function ProgressBar({ progress, showLabel = false, size = 'md' }: Props) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-100 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${clampedProgress}%` }}
        >
          {size === 'lg' && clampedProgress > 10 && (
            <div className="h-full flex items-center justify-center">
              <span className="text-xs font-medium text-white">{clampedProgress}%</span>
            </div>
          )}
        </div>
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1 text-right">{clampedProgress}% concluído</p>
      )}
    </div>
  )
}
