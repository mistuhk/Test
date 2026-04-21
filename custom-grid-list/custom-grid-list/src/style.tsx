export const containerStyle: {} = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as 'column',
    overflow: 'hidden',
    position: 'relative' as 'relative',
    fontFamily: 'Arial',
    fontSize: '13px'
}

export const titleStyle: {} = {
    flexShrink: 0,
    backgroundColor: '#076FE5',
    color: 'white',
    textAlign: 'center' as 'center',
    fontWeight: 'bold',
    fontSize: '13px',
    padding: '8px',
    letterSpacing: '0.8px'
}

export const messageLabelStyle = (type: 'success' | 'error' | 'info'): {} => ({
    flexShrink: 0,
    fontSize: '12px',
    padding: '7px 10px',
    fontWeight: 'bold',
    fontStyle: 'italic',
    fontFamily: 'Arial',
    borderLeft: '4px solid',
    ...(type === 'success' && { background: '#e8f8f0', color: '#03b161', borderColor: '#03b161' }),
    ...(type === 'error' && { background: '#fde8e8', color: '#cc0000', borderColor: '#cc0000' }),
    ...(type === 'info' && { background: '#e6f1fb', color: '#076FE5', borderColor: '#076FE5' })
})

export const searchRowStyle: {} = {
    flexShrink: 0,
    display: 'flex',
    gap: '4px',
    padding: '5px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #D3D3D3',
    alignItems: 'center'
}

export const searchInputStyle: {} = {
    flex: 1,
    padding: '4px 6px',
    border: '1px solid #ccc',
    fontSize: '12px',
    borderRadius: '0',
    fontFamily: 'Arial'
}

export const searchBtnStyle: {} = {
    padding: '4px 8px',
    backgroundColor: '#555',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    borderRadius: '0'
}

export const clearBtnStyle: {} = {
    padding: '4px 8px',
    backgroundColor: '#076FE5',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    borderRadius: '0'
}

export const tbodyWrapStyle: {} = {
    flex: 1,
    overflowY: 'auto' as 'auto',
    overflowX: 'auto' as 'auto'
}

export const tableStyle: {} = {
    width: 'max-content',
    minWidth: '100%',
    borderCollapse: 'collapse' as 'collapse',
    tableLayout: 'auto' as 'auto'
}

export const thStyle: {} = {
    position: 'sticky' as 'sticky',
    top: 0,
    zIndex: 1,
    backgroundColor: '#076FE5',
    color: 'white',
    padding: '6px 7px',
    textAlign: 'left' as 'left',
    fontWeight: 'bold',
    border: '1px solid #0559be',
    whiteSpace: 'nowrap' as 'nowrap',
    fontSize: '12px',
    maxWidth: '250px'
}

export const tdStyle = (isSelected: boolean, isEven: boolean): {} => ({
    padding: '5px 7px',
    border: '1px solid #D3D3D3',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as 'nowrap',
    maxWidth: '250px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: isSelected ? 'bold' : 'normal',
    backgroundColor: isSelected ? '#9ecef5' : isEven ? '#f2f6fb' : '#fff'
})

export const cbCellStyle: {} = {
    textAlign: 'center' as 'center',
    padding: '4px',
    border: '1px solid #D3D3D3',
    width: '30px'
}

export const rowActionBtnStyle: {} = {
    backgroundColor: '#076FE5',
    color: 'white',
    border: 'none',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: '10px',
    padding: '2px 5px',
    cursor: 'pointer',
    borderRadius: '0'
}

export const pgRowStyle: {} = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 6px',
    borderTop: '1px solid #D3D3D3',
    backgroundColor: '#fff'
}

export const pgLeftStyle: {} = {
    display: 'flex',
    alignItems: 'center',
    gap: '3px'
}

export const pgRightStyle: {} = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
}

export const countLabelStyle: {} = {
    fontSize: '11px',
    color: '#555',
    fontStyle: 'italic'
}

export const globalBtnStyle: {} = {
    backgroundColor: '#076FE5',
    color: 'white',
    border: 'none',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: '11px',
    padding: '5px 9px',
    cursor: 'pointer',
    borderRadius: '0',
    whiteSpace: 'nowrap' as 'nowrap'
}

export const noDataStyle: {} = {
    padding: '12px',
    textAlign: 'center' as 'center',
    color: '#888',
    fontStyle: 'italic',
    fontSize: '12px'
}

// NEW CHANGE: Loading cell style — improvement #1.
// Applied to the td in the loading row rendered while isLoading is true.
// Uses a CSS linear-gradient animation to produce a pulsing shimmer effect
// consistent with the widget's existing blue colour scheme, requiring no
// external dependencies or additional components.
export const loadingCellStyle: {} = {
    padding: '12px',
    textAlign: 'center' as 'center',
    color: '#076FE5',
    fontSize: '12px',
    fontStyle: 'italic',
    fontFamily: 'Arial',
    animation: 'custom-grid-list-pulse 1.2s ease-in-out infinite'
}

// NEW CHANGE: Keyframe injection for the pulse animation — improvement #1.
// Injected once into the document head at module load time.
// Scoped to a unique animation name to avoid colliding with any other widget
// or ExB component that may also inject keyframes into the same document.
// Using a style tag rather than a CSS file keeps the widget fully self-contained.
;(() => {
    const STYLE_ID = 'custom-grid-list-loading-keyframes'
    if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
        const tag = document.createElement('style')
        tag.id = STYLE_ID
        tag.textContent = `
            @keyframes custom-grid-list-pulse {
                0%   { opacity: 1; }
                50%  { opacity: 0.3; }
                100% { opacity: 1; }
            }
        `
        document.head.appendChild(tag)
    }
})()

// NEW CHANGE: Sort indicator span style — improvement #4.
// Applied to the small arrow character rendered inside each sortable column header.
// floats right so the label text and arrow sit at opposite ends of the th.
export const sortIndicatorStyle: {} = {
    marginLeft: '5px',
    fontSize: '10px',
    opacity: 0.85,
    userSelect: 'none' as 'none'
}
