import { React, AllWidgetProps } from 'jimu-core'
import { Pagination } from 'jimu-ui'
import { IMConfig } from '../config'
import { fetchCases, callRowAction, callGlobalAction } from './services/caseApiService'
import { getAllUrlParams } from '../../../../shared/services/urlParamsService'
import { ConfirmationPopup } from '../../../../shared/components/ConfirmationPopup'
import { NotificationBanner } from '../../../../shared/components/NotificationBanner'
import defaultMessages from './translations/default'

const { useState, useEffect, useRef, useCallback } = React

// ─── Types ────────────────────────────────────────────────────────────────────

interface Column {
  field: string
  label: string
}

type PopupContext = 'row' | 'global' | null

// ─── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
  fontFamily: 'Arial',
  fontSize: '13px'
}

const titleStyle: React.CSSProperties = {
  flexShrink: 0,
  backgroundColor: '#076FE5',
  color: 'white',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '13px',
  padding: '8px',
  letterSpacing: '0.8px'
}

const messageLabelStyle = (type: 'success' | 'error' | 'info'): React.CSSProperties => ({
  flexShrink: 0,
  fontSize: '12px',
  padding: '7px 10px',
  fontWeight: 'bold',
  fontStyle: 'italic',
  fontFamily: 'Arial',
  borderLeft: '4px solid',
  ...(type === 'success' && { background: '#e8f8f0', color: '#03b161', borderColor: '#03b161' }),
  ...(type === 'error'   && { background: '#fde8e8', color: '#cc0000', borderColor: '#cc0000' }),
  ...(type === 'info'    && { background: '#e6f1fb', color: '#076FE5', borderColor: '#076FE5' })
})

const searchRowStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  gap: '4px',
  padding: '5px',
  backgroundColor: '#fff',
  borderBottom: '1px solid #D3D3D3',
  alignItems: 'center'
}

const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: '4px 6px',
  border: '1px solid #ccc',
  fontSize: '12px',
  borderRadius: '0',
  fontFamily: 'Arial'
}

const iconBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#555',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  borderRadius: '0'
}

const clearBtnStyle: React.CSSProperties = {
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

const theadWrapStyle: React.CSSProperties = {
  flexShrink: 0,
  overflowX: 'hidden',
  backgroundColor: '#076FE5'
}

const tbodyWrapStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'auto'
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed'
}

const thStyle: React.CSSProperties = {
  backgroundColor: '#076FE5',
  color: 'white',
  padding: '6px 7px',
  textAlign: 'left',
  fontWeight: 'bold',
  border: '1px solid #0559be',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  fontSize: '12px'
}

const tdStyle = (isSelected: boolean, isEven: boolean): React.CSSProperties => ({
  padding: '5px 7px',
  border: '1px solid #D3D3D3',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: isSelected ? 'bold' : 'normal',
  backgroundColor: isSelected ? '#9ecef5' : isEven ? '#f2f6fb' : '#fff'
})

const pgRowStyle: React.CSSProperties = {
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '4px 6px',
  borderTop: '1px solid #D3D3D3',
  backgroundColor: '#fff'
}

const pgLeftStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '3px'
}

const pgRightStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
}

const countLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#555',
  fontStyle: 'italic'
}

const globalBtnStyle: React.CSSProperties = {
  backgroundColor: '#076FE5',
  color: 'white',
  border: 'none',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  fontSize: '11px',
  padding: '5px 9px',
  cursor: 'pointer',
  borderRadius: '0',
  whiteSpace: 'nowrap'
}

const rowActionBtnStyle: React.CSSProperties = {
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

const noDataStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'center',
  color: '#888',
  fontStyle: 'italic',
  fontSize: '12px'
}

const cbStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '4px',
  border: '1px solid #ddd',
  width: '30px'
}

// ─── Widget ───────────────────────────────────────────────────────────────────

const Widget = (props: AllWidgetProps<IMConfig>) => {

  const [originalData, setOriginalData]       = useState<any[]>([])
  const [currentItems, setCurrentItems]       = useState<any[]>([])
  const [currentPage, setCurrentPage]         = useState<number>(1)
  const [totalPage, setTotalPage]             = useState<number>(0)
  const [searchText, setSearchText]           = useState<string>('')

  // Message label — top of widget
  const [message, setMessage]                 = useState<string>('')
  const [messageType, setMessageType]         = useState<'success' | 'error' | 'info'>('info')

  // Notification banner
  const [refreshNotif, setRefreshNotif]       = useState<string>('')

  // Popup state
  const [showPopup, setShowPopup]             = useState<boolean>(false)
  const [popupContext, setPopupContext]        = useState<PopupContext>(null)
  const [popupTitle, setPopupTitle]           = useState<string>('')
  const [popupMessage, setPopupMessage]       = useState<string>('')
  const [activeRow, setActiveRow]             = useState<any>(null)   // row targeted by per-row button

  // Loading state
  const [isLoading, setIsLoading]             = useState<boolean>(false)

  // Column widths — shared between thead and tbody tables
  const [colWidths, setColWidths]             = useState<string[]>([])

  const theadRef = useRef<HTMLDivElement>(null)
  const tbodyRef = useRef<HTMLDivElement>(null)

  // ─── Column helpers ─────────────────────────────────────────────────────────

  const getColumns = useCallback((): Column[] => {
    if (!props.config.columnHeaders) return []
    return props.config.columnHeaders.split(',').map(pair => {
      const parts = pair.trim().split(':')
      return {
        field: parts[0].trim(),
        label: parts[1] ? parts[1].trim() : parts[0].trim()
      }
    })
  }, [props.config.columnHeaders])

  const getShowButtons = (): boolean => props.config.showButtons || false

  // ─── Checked rows helpers ───────────────────────────────────────────────────

  const getCheckedRows = (): any[] => {
    if (!tbodyRef.current) return []
    const checkboxes = tbodyRef.current.querySelectorAll('input[type="checkbox"]:checked')
    return Array.from(checkboxes).map((cb: Element) => {
      const idx = parseInt((cb as HTMLInputElement).dataset.rowindex || '0')
      return currentItems[idx]
    }).filter(Boolean)
  }

  const getCheckedCount = (): number => {
    if (!tbodyRef.current) return 0
    return tbodyRef.current.querySelectorAll('input[type="checkbox"]:checked').length
  }

  const uncheckAll = () => {
    if (!tbodyRef.current) return
    tbodyRef.current.querySelectorAll('input[type="checkbox"]').forEach((cb: Element) => {
      (cb as HTMLInputElement).checked = false
    })
  }

  // ─── Column width sync — keeps thead and tbody aligned ──────────────────────

  useEffect(() => {
    const columns = getColumns()
    const showButtons = getShowButtons()
    const total = (showButtons ? 1 : 0) + columns.length + (showButtons ? 1 : 0)
    if (total === 0) return

    // Distribute widths: checkbox col fixed, action col fixed, rest equal
    const widths: string[] = []
    if (showButtons) widths.push('30px')    // checkbox column
    const actionWidth = showButtons ? '90px' : '0px'
    const remaining = showButtons ? `calc((100% - 30px - 90px) / ${columns.length})` : `${100 / columns.length}%`
    columns.forEach(() => widths.push(remaining))
    if (showButtons) widths.push(actionWidth)
    setColWidths(widths)
  }, [props.config.columnHeaders, props.config.showButtons])

  // Sync horizontal scroll between thead and tbody
  useEffect(() => {
    const bodyEl = tbodyRef.current
    const headEl = theadRef.current
    if (!bodyEl || !headEl) return
    const onScroll = () => { headEl.scrollLeft = bodyEl.scrollLeft }
    bodyEl.addEventListener('scroll', onScroll)
    return () => bodyEl.removeEventListener('scroll', onScroll)
  }, [])

  // ─── Data loading ───────────────────────────────────────────────────────────

  const loadData = useCallback(async (page: number = 1) => {
    setIsLoading(true)
    setMessage('')

    const result = await fetchCases(
      props.config.webApiUrl,
      props.config.urlParams,
      props.config.use_username_for_datafilter
    )

    if (!result.ok) {
      console.error('available-cases-grid-list - fetchCases error:', result.error)
      setIsLoading(false)
      return
    }

    const data = result.data
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    const indexOfLast  = page * itemsPerPage
    const indexOfFirst = indexOfLast - itemsPerPage

    setOriginalData(data)
    setCurrentItems(data.slice(indexOfFirst, indexOfLast))
    setTotalPage(Math.ceil(data.length / itemsPerPage))
    setCurrentPage(page)
    setIsLoading(false)
  }, [props.config.webApiUrl, props.config.urlParams, props.config.use_username_for_datafilter, props.config.itemsPerPage])

  // On mount
  useEffect(() => {
    loadData(1)
  }, [])

  // ─── Token validation ───────────────────────────────────────────────────────

  useEffect(() => {
    const urlParams = getAllUrlParams(window.location.href)
    if (urlParams['draft']) return
    const token = urlParams['token']
    if (!token || !props.config.tokenValidate_webapiURL) return
    const tokenUrl = props.config.tokenValidate_webapiURL + token
    fetch(tokenUrl)
      .then(r => { if (!r.ok) window.open(props.config.tokenExpired_appUrl, '_self') })
      .catch(() => window.open(props.config.tokenExpired_appUrl, '_self'))
  }, [])

  // ─── Pagination ─────────────────────────────────────────────────────────────

  const handlePagination = (page: number) => {
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    const indexOfLast  = page * itemsPerPage
    const indexOfFirst = indexOfLast - itemsPerPage
    setCurrentPage(page)
    setCurrentItems(originalData.slice(indexOfFirst, indexOfLast))
    uncheckAll()
  }

  // ─── Search ─────────────────────────────────────────────────────────────────

  const searchItem = () => {
    const columns = getColumns()
    const lower = searchText.toLowerCase()
    const filtered = originalData.filter(item =>
      columns.some(col =>
        String(item[col.field] !== undefined ? item[col.field] : '').toLowerCase().includes(lower)
      )
    )
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    setCurrentItems(filtered.slice(0, itemsPerPage))
    setTotalPage(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1)
    uncheckAll()
  }

  const clearSearch = () => {
    setSearchText('')
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    setCurrentItems(originalData.slice(0, itemsPerPage))
    setTotalPage(Math.ceil(originalData.length / itemsPerPage))
    setCurrentPage(1)
    uncheckAll()
  }

  // ─── Popup helpers ──────────────────────────────────────────────────────────

  const openPopup = (context: PopupContext, title: string, msg: string, row: any = null) => {
    setPopupContext(context)
    setPopupTitle(title)
    setPopupMessage(msg)
    setActiveRow(row)
    setShowPopup(true)
  }

  const onPopupCancel = () => {
    setShowPopup(false)
    // On cancel — uncheck all rows (global) or do nothing (per-row)
    if (popupContext === 'global') uncheckAll()
    setPopupContext(null)
    setActiveRow(null)
  }

  const onPopupConfirm = async () => {
    setShowPopup(false)

    if (popupContext === 'row') {
      await handleRowActionConfirmed()
    } else if (popupContext === 'global') {
      await handleGlobalActionConfirmed()
    }

    setPopupContext(null)
    setActiveRow(null)
  }

  // ─── Per-row action ─────────────────────────────────────────────────────────

  const onRowActionClick = (row: any) => {
    openPopup(
      'row',
      props.config.buttonConfirmTitle || 'Confirm Action',
      props.config.buttonConfirmMessage || 'Do you want to proceed?',
      row
    )
  }

  const handleRowActionConfirmed = async () => {
    if (!activeRow) return

    const result = await callRowAction(
      props.config.listButton1APIUrl,
      props.config.button1ParamExpression,
      activeRow,
      props.config.use_username_for_button_action
    )

    if (result.ok) {
      setMessage(defaultMessages.successSingle)
      setMessageType('success')
      // Refresh list from server — completed case should no longer appear
      await loadData(1)
      setRefreshNotif(defaultMessages.refreshNotif)
    } else {
      setMessage(defaultMessages.errorMessage)
      setMessageType('error')
      console.error('available-cases-grid-list - row action error:', result.error)
    }
  }

  // ─── Global action ──────────────────────────────────────────────────────────

  const onGlobalActionClick = () => {
    openPopup(
      'global',
      props.config.globalButtonConfirmTitle || 'Confirm Action',
      props.config.globalButtonConfirmMessage || 'Do you want to proceed?'
    )
  }

  const handleGlobalActionConfirmed = async () => {
    const checkedRows = getCheckedRows()
    if (checkedRows.length === 0) return

    const result = await callGlobalAction(
      props.config.globalButtonAPIUrl,
      props.config.globalButtonHttpMethod,
      checkedRows,
      props.config.globalButtonPayloadFields,
      props.config.globalButtonDefaultValues,
      props.config.use_username_for_global_action
    )

    if (result.ok) {
      const n = checkedRows.length
      const msg = n === 1
        ? defaultMessages.successSingle
        : defaultMessages.successMultiple.replace('{n}', String(n))
      setMessage(msg)
      setMessageType('success')
      uncheckAll()
      // Refresh list from server — completed cases should no longer appear
      await loadData(1)
      setRefreshNotif(defaultMessages.refreshNotif)
    } else {
      // On failure — rows remain, checkboxes remain checked
      setMessage(defaultMessages.errorMessage)
      setMessageType('error')
      console.error('available-cases-grid-list - global action error:', result.error)
    }
  }

  // ─── Checked count for global button visibility ──────────────────────────────

  const [checkedCount, setCheckedCount] = useState<number>(0)

  const onCheckboxChange = () => {
    // Use setTimeout to allow DOM to update before counting
    setTimeout(() => setCheckedCount(getCheckedCount()), 0)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  const columns     = getColumns()
  const showButtons = getShowButtons()
  const showGlobal  = showButtons && checkedCount >= 2

  // Build colgroup widths string for both tables
  const renderColGroup = () => (
    <colgroup>
      {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
    </colgroup>
  )

  return (
    <div style={containerStyle}>

      {/* Confirmation popup — reusable shared component */}
      <ConfirmationPopup
        show={showPopup}
        title={popupTitle}
        message={popupMessage}
        onConfirm={onPopupConfirm}
        onCancel={onPopupCancel}
      />

      {/* Optional title */}
      {props.config.addTitle && props.config.list_title && (
        <div style={titleStyle}>{props.config.list_title}</div>
      )}

      {/* Message label — top of widget */}
      {message !== '' && (
        <div style={messageLabelStyle(messageType)}>{message}</div>
      )}

      {/* Refresh notification banner */}
      <NotificationBanner message={refreshNotif} durationMs={3000} />

      {/* Search bar — sticky */}
      <div style={searchRowStyle}>
        <input
          style={searchInputStyle}
          type='text'
          placeholder={defaultMessages.searchPlaceholder}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') searchItem() }}
        />
        <button style={iconBtnStyle} onClick={searchItem}>&#9906;</button>
        <button style={clearBtnStyle} onClick={clearSearch}>{defaultMessages.clearButton}</button>
      </div>

      {/* Single scrollable container — thead sticks naturally via CSS */}
<div ref={tbodyRef} style={tbodyWrapStyle}>
  <table style={tableStyle}>
    {renderColGroup()}
    <thead>
      <tr>
        {showButtons && (
          <th style={{ ...thStyle, width: '30px' }}></th>
        )}
        {columns.map((col, i) => (
          <th key={i} style={thStyle}>{col.label}</th>
        ))}
        {showButtons && (
          <th style={{ ...thStyle, width: '90px' }}>Action</th>
        )}
      </tr>
    </thead>
    <tbody>
      {currentItems.length === 0 && !isLoading && (
        <tr>
          <td
            colSpan={columns.length + (showButtons ? 2 : 0)}
            style={noDataStyle}
          >
            {defaultMessages.noData}
          </td>
        </tr>
      )}
      {currentItems.map((item, rowIndex) => {
        const isEven = rowIndex % 2 === 1
        return (
          <tr key={rowIndex}>
            {showButtons && originalData.length > 1 && (
              <td style={cbStyle}>
                <input
                  type='checkbox'
                  data-rowindex={String(rowIndex)}
                  onChange={onCheckboxChange}
                  style={{ cursor: 'pointer', accentColor: '#076FE5' }}
                />
              </td>
            )}
            {showButtons && originalData.length <= 1 && (
              <td style={cbStyle}></td>
            )}
            {columns.map((col, colIndex) => (
              <td key={colIndex} style={tdStyle(false, isEven)}>
                {item[col.field] !== undefined ? String(item[col.field]) : ''}
              </td>
            ))}
            {showButtons && (
              <td style={{ ...tdStyle(false, isEven), textAlign: 'center' }}>
                <button
                  style={rowActionBtnStyle}
                  onClick={() => onRowActionClick(item)}
                >
                  {props.config.buttonCaption || 'QA Complete'}
                </button>
              </td>
            )}
          </tr>
        )
      })}
    </tbody>
  </table>
</div>

      {/* Pagination row — sticky bottom: pagination left, global button right */}
      <div style={pgRowStyle}>
        <div style={pgLeftStyle}>
          <Pagination
            current={currentPage}
            onChangePage={handlePagination}
            size='default'
            totalPage={totalPage}
          />
        </div>
        <div style={pgRightStyle}>
          {showButtons && checkedCount > 0 && (
            <span style={countLabelStyle}>
              {checkedCount} {checkedCount === 1 ? 'row' : 'rows'} selected
            </span>
          )}
          {showGlobal && (
            <button style={globalBtnStyle} onClick={onGlobalActionClick}>
              {props.config.globalButtonCaption || 'QA Complete All (Selected)'}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

export default Widget
