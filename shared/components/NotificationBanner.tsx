/**
 * NotificationBanner.tsx
 * Reusable auto-dismissing notification banner — usable by any widget.
 * Renders a yellow banner when message is non-empty.
 * Auto-dismisses after the specified duration (default 3 seconds).
 */

import { React } from 'jimu-core'

const { useEffect, useState } = React

interface Props {
  message: string
  durationMs?: number       // auto-dismiss duration in ms, default 3000
  icon?: string             // optional icon character e.g. '⚡'
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
