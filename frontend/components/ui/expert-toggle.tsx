'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './button'

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
      {isExpertMode && (
        <Link href="/">
          <Button>Go back</Button>
        </Link>
      )}
      <Link href="/expert">
        <Button>New Expert Chat</Button>
      </Link>
      {isExpertMode && (
        <span className="ms-3 text-sm font-medium text-green-700 dark:text-green-500">
          Expert Mode
        </span>
      )}
    </label>
  )
}
