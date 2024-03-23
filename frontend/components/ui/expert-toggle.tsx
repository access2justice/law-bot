'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function ExpertToggle() {
  const router = useRouter()
  const path = usePathname()
  const [isExpertMode, setIsExpertMode] = useState(path === '/expert')

  useEffect(() => {
    setIsExpertMode(path === '/expert')
  }, [path])

  const handleToggleChange = async () => {
    if (isExpertMode) {
      router.push('/')
    } else {
      router.push('/expert')
    }
  }
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={isExpertMode}
        onChange={handleToggleChange}
        className="sr-only peer"
      />
      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-700"></div>
      <span
        className={`ms-3 text-sm font-medium ${isExpertMode ? 'text-green-700 dark:text-green-500' : 'text-gray-900 dark:text-gray-300'}`}
      >
        Expert Mode
      </span>
    </label>
  )
}
