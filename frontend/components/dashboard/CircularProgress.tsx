'use client'

interface CircularProgressProps {
  /** Current count of items being processed */
  current: number
  /** Total count of items */
  total: number
  /** Size of the circle in pixels */
  size?: number
  /** Stroke width */
  strokeWidth?: number
}

export function CircularProgress({
  current,
  total,
  size = 24,
  strokeWidth = 3,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = total > 0 ? (current / total) * 100 : 0
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="text-gray-200"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-blue-500 transition-all duration-300 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center text - show count */}
      {size >= 40 && (
        <span className="absolute text-xs font-medium text-gray-700">
          {current}
        </span>
      )}
    </div>
  )
}

export default CircularProgress
