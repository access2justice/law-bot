// Inspired by Chatbot-UI and modified to fit the needs of this project
// @see https://github.com/mckaywrigley/chatbot-ui/blob/main/components/Chat/ChatMessage.tsx

import { Message } from 'ai'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { CodeBlock } from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { IconAI, IconUser } from '@/components/ui/icons'
import { ChatMessageActions } from '@/components/chat-message-actions'
import { usePathname } from 'next/navigation'
import DropdownBlock from './ui/dropdown-chat-block'

export interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  const path = usePathname()
  if (path.includes('expert')) {
    console.log('this is working in expert mode')
    let data: any = ''
    if (message.role === 'assistant') {
      data = JSON.parse(message.content)
      console.log('data recieved', data)
    }

    const renderArticleLinks = (results: {
      eIds: string[][]
      metadata: string[][][]
    }) => {
      return results.metadata.map((item, index) => {
        const metaUrl = JSON.stringify(item[0])
        const url = metaUrl.replace(/"/g, '')
        const articleName = item[item.length - 1]
        return (
          <div key={index}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block hover:underline"
            >
              🔗 {articleName}
            </a>
          </div>
        )
      })
    }

    return (
      <div
        className={cn('group relative mb-4 flex items-start md:-ml-12')}
        {...props}
      >
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
            message.role === 'user'
              ? 'bg-background'
              : 'bg-primary text-primary-foreground'
          )}
        >
          {message.role === 'user' ? <IconUser /> : <IconAI />}
        </div>
        <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
          <MemoizedReactMarkdown
            className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>
              },
              code({ node, inline, className, children, ...props }) {
                if (children.length) {
                  if (children[0] == '▍') {
                    return (
                      <span className="mt-1 cursor-default animate-pulse">
                        ▍
                      </span>
                    )
                  }

                  children[0] = (children[0] as string).replace('`▍`', '▍')
                }

                const match = /language-(\w+)/.exec(className || '')

                if (inline) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }

                return (
                  <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || ''}
                    value={String(children).replace(/\n$/, '')}
                    {...props}
                  />
                )
              }
            }}
          >
            {message.role === 'user' ? message.content : data.content}
          </MemoizedReactMarkdown>
          <>
            {message.role === 'assistant' && (
              <>
                <br />
                <div className="text-center w-full pb-4">Legal reasoning</div>
                {data.reasoning_thread?.map((item: any, index: number) => {
                  if (item.type === 'search') {
                    return (
                      <DropdownBlock key={index} title="⚙️ Search">
                        {renderArticleLinks(item.results)}
                      </DropdownBlock>
                    )
                  } else if (item.type === 'llm') {
                    return (
                      <DropdownBlock key={index} title="⚙️ LLM">
                        {item.prompt.map((prompt: any, i: number) => (
                          <p key={i} className="mb-2 last:mb-0">
                            {prompt.content}
                          </p>
                        ))}
                      </DropdownBlock>
                    )
                  }
                  return null
                })}
              </>
            )}
          </>
          <ChatMessageActions message={message} />
        </div>
      </div>
    )
  }

  console.log('this is working in normal mode')
  return (
    <div
      className={cn('group relative mb-4 flex items-start md:-ml-12')}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-md border shadow',
          message.role === 'user'
            ? 'bg-background'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? <IconUser /> : <IconAI />}
      </div>
      <div className="flex-1 px-1 ml-4 space-y-2 overflow-hidden">
        <MemoizedReactMarkdown
          className="prose break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 cursor-default animate-pulse">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              if (inline) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              )
            }
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
        <ChatMessageActions message={message} />
      </div>
    </div>
  )
}
