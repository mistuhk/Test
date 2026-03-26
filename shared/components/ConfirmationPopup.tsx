/**
 * ConfirmationPopup.tsx
 * Reusable confirmation popup — usable by any widget.
 * Accepts dynamic title, message, and confirm/cancel callbacks.
 */

import { React } from 'jimu-core'

interface Props {
  show: boolean
  title: string
  message: string
  confirmLabel?: string   // defaults to 'Yes'
  cancelLabel?: string    // defaults to 'No'
  onConfirm: () => void
  onCancel: () => void
}

const overlayStyle: React.CSSProperties = {
  display: 'flex',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 1000,
  alignItems: 'center',
  justifyContent: 'center'
}

const boxStyle: React.CSSProperties = {
  background: '#fff',
  border: '2px solid #076FE5',
  minWidth: '320px',
  maxWidth: '420px',
  borderRadius: '0'
}

const headerStyle: React.CSSProperties = {
  background: '#076FE5',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '13px',
  padding: '10px 14px',
  letterSpacing: '0.5px',
  fontFamily: 'Arial'
}

const bodyStyle: React.CSSProperties = {
  padding: '16px 14px',
  fontSize: '13px',
  color: '#333',
  lineHeight: '1.5',
  fontFamily: 'Arial'
}

const footerStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderTop: '1px solid #ddd',
  display: 'flex',
  gap: '8px',
  justifyContent: 'flex-end',
  backgroundColor: '#f4f4f4'
}

const confirmBtnStyle: React.CSSProperties = {
  background: '#03b161',
  color: '#fff',
  border: 'none',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  fontSize: '12px',
  padding: '6px 16px',
  cursor: 'pointer',
  borderRadius: '0'
}

const cancelBtnStyle: React.CSSProperties = {
  background: '#cc0000',
  color: '#fff',
  border: 'none',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  fontSize: '12px',
  padding: '6px 16px',
  cursor: 'pointer',
  borderRadius: '0'
}

export const ConfirmationPopup = ({
  show,
  title,
  message,
  confirmLabel = 'Yes',
  cancelLabel = 'No',
  onConfirm,
  onCancel
}: Props): React.ReactElement | null => {
  if (!show) return null

  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
        <div style={headerStyle}>{title}</div>
        <div style={bodyStyle}>{message}</div>
        <div style={footerStyle}>
          <button style={confirmBtnStyle} onClick={onConfirm}>{confirmLabel}</button>
          <button style={cancelBtnStyle} onClick={onCancel}>{cancelLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationPopup
