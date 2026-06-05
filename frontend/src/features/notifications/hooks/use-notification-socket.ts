import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import type { Notification } from '@flow/shared'

const API_URL = (import.meta as ImportMeta & { env: Record<string, string> }).env.VITE_API_URL ?? 'http://localhost:3000'

export function useNotificationSocket(
  userId: string | null,
  onNotification: (notification: Notification) => void,
) {
  const callbackRef = useRef(onNotification)
  useEffect(() => { callbackRef.current = onNotification })

  useEffect(() => {
    if (!userId) return

    const socket = io(API_URL, {
      query: { userId },
      transports: ['websocket'],
    })

    socket.on('notification', (n: Notification) => callbackRef.current(n))

    return () => { socket.disconnect() }
  }, [userId])
}
