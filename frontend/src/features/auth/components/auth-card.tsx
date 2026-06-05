import type { ReactNode } from 'react'

interface AuthCardProps {
  children: ReactNode
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[380px]">
      <div className="mb-8 text-center">
        <span
          className="font-display italic text-primary leading-none select-none"
          style={{ fontSize: '3.25rem', letterSpacing: '-0.015em' }}
        >
          Flow
        </span>
      </div>

      <div className="px-2">
        {children}
      </div>
    </div>
  )
}
