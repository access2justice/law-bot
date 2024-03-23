import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import lawBotTemporaryLogo from '../public/law-bot-temporary-logo.png'

import { cn } from '@/lib/utils'
import { auth } from '@/auth'
import { clearChats } from '@/app/actions'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar'
import { SidebarList } from '@/components/sidebar-list'
import {
  IconGitHub,
  IconNextChat,
  IconSeparator,
  IconVercel
} from '@/components/ui/icons'
import { SidebarFooter } from '@/components/sidebar-footer'
import { ThemeToggle } from '@/components/theme-toggle'
import { ClearHistory } from '@/components/clear-history'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { nanoid } from '@/lib/utils'
import { usePathname, useRouter } from 'next/navigation'

async function UserOrLogin() {
  const session = await auth()
  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
        <Link href="/" target="_blank" rel="nofollow">
          <Image
            className="w-6 h-6 transition-opacity duration-300 rounded-full select-none ring-1 ring-zinc-100/10 hover:opacity-80"
            src={lawBotTemporaryLogo}
            alt={'Law bot temporary logo'}
            height={64}
            width={64}
          />
        </Link>
      )}
      <div className="flex items-center">
        <IconSeparator className="w-6 h-6 text-muted-foreground/50" />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Button variant="link" asChild className="-ml-2">
            <Link href="/sign-in?callbackUrl=/">Login</Link>
          </Button>
        )}
      </div>
    </>
  )
}

export function Header() {
  const router = useRouter()
  const path = usePathname()

  const handleToggle = () => {
    if (path === '/expert') {
      router.push('/')
    } else {
      router.push('/expert')
    }
  }

  const expertMode = path.includes('/expert')

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      <label
        className="inline-flex items-center cursor-pointer"
        onClick={handleToggle}
      >
        <input
          type="checkbox"
          value=""
          checked={expertMode}
          onChange={() => {}}
          className="sr-only peer"
        />
        <div
          className={`relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer ${expertMode ? 'peer-checked:bg-blue-600' : ''}`}
        ></div>
        <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {expertMode ? 'Expert Mode' : 'Normal Mode'}
        </span>
      </label>
    </header>
  )
}
