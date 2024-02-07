import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

const exampleMessages = [
  {
    heading: 'Figure out your vacation days',
    message: `What is the minimum length of vacation?`
  },
  {
    heading: 'Eine Firma gründen',
    message: 'Was sind die Voraussetzungen für die Gründung einer GmbH?'
  },
  {
    heading: 'Estimer durée de préavis',
    message: `Quelle est la durée de préavis pour un contrat de bail?`
  }
]

export function EmptyScreen({ setInput }: Pick<UseChatHelpers, 'setInput'>) {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="rounded-lg border bg-background p-8">
        <h1 className="mb-2 text-lg font-semibold">
          Welcome to the Law Bot project!
        </h1>
        <p className="mb-2 leading-normal text-muted-foreground">
          This is an open source project aiming to build a conversational
          interface, giving sound legal advice for laypeople in Switzerland.
          Take a look at our Github repository{' '}
          <ExternalLink href="https://github.com/access2justice/law-bot">
            Github repo
          </ExternalLink>
          .
        </p>
        <p className="leading-normal text-muted-foreground">
          You can start a conversation here or try the following examples:
        </p>
        <div className="mt-4 flex flex-col items-start space-y-2">
          {exampleMessages.map((message, index) => (
            <Button
              key={index}
              variant="link"
              className="h-auto p-0 text-base"
              onClick={() => setInput(message.message)}
            >
              <IconArrowRight className="mr-2 text-muted-foreground" />
              {message.heading}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
