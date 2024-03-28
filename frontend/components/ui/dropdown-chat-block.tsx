import * as React from 'react'

const DropdownBlock = ({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <details
      open={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
      className="mb-4 bg-background p-4 rounded-lg"
    >
      <summary className="cursor-pointer text-lg text-gray-900 dark:text-gray-300">
        {title}
      </summary>
      {isOpen && <div className="pl-4">{children}</div>}
    </details>
  )
}

export default DropdownBlock
