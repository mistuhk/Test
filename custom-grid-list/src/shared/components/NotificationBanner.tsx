/**
 * NotificationBanner.tsx
 * Reusable auto-dismissing notification banner — self-contained within custom-grid-list.
 */

import { React } from 'jimu-core'

const { useEffect, useState } = React

interface Props {
  message: string
  durationMs?: number
  icon?: string
}

const bannerStyle: React.CSSProperties = {
  fontSize: '11px',
  padding: '5px 8px',
  backgroundColor: '#fff8e0',
  borderLeft: '3px solid #ffce2f',
  color: '#b38f00',
  fontStyle: 'italic',
  fontFamily: 'Arial'
}

export const NotificationBanner = ({
  message,
  durationMs = 3000,
  icon = '⚡'
}: Props): React.ReactElement | null => {
  const [visible, setVisible] = useState<boolean>(false)

  useEffect(() => {
    if (!message) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), durationMs)
    return () => clearTimeout(timer)
  }, [message, durationMs])

  if (!visible || !message) return null

  return (
    <div style={bannerStyle}>
      {icon} {message}
    </div>
  )
}

export default NotificationBanner
