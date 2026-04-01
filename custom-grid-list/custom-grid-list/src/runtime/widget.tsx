import { React, AllWidgetProps, appActions, DataSourceComponent, FeatureLayerDataSource, DataSourceManager } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import { Pagination } from 'jimu-ui'
import Graphic from 'esri/Graphic'
import { IMConfig } from '../config'
import { fetchData, callRowAction, callGlobalAction } from 'widgets/shared-code/gridApiService'
import { getAllUrlParams } from 'widgets/shared-code/urlParamService'
import { ConfirmationPopup } from 'widgets/shared-code/ConfirmationPopup'
import { NotificationBanner } from 'widgets/shared-code/NotificationBanner'
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
  ...(type === 'error' && { background: '#fde8e8', color: '#cc0000', borderColor: '#cc0000' }),
  ...(type === 'info' && { background: '#e6f1fb', color: '#076FE5', borderColor: '#076FE5' })
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
  borderRadius: 0,
  fontFamily: 'Arial'
}

const searchBtnStyle: React.CSSProperties = {
  padding: '4px 8px',
  backgroundColor: '#555',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '13px',
  borderRadius: 0
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
  borderRadius: 0
}

const tbodyWrapStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'auto'
}

const tableStyle: React.CSSProperties = {
  width: 'max-content',
  minWidth: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'auto'
}

const thStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
  backgroundColor: '#076FE5',
  color: 'white',
  padding: '6px 7px',
  textAlign: 'left',
  fontWeight: 'bold',
  border: '1px solid #0559be',
  whiteSpace: 'nowrap',
  fontSize: '12px',
  maxWidth: '250px'
}

const tdStyle = (isSelected: boolean, isEven: boolean): React.CSSProperties => ({
  padding: '5px 7px',
  border: '1px solid #D3D3D3',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '250px',
  fontSize: '12px',
  cursor: 'pointer',
  fontWeight: isSelected ? 'bold' : 'normal',
  backgroundColor: isSelected ? '#9ecef5' : isEven ? '#f2f6fb' : '#fff'
})

const cbCellStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '4px',
  border: '1px solid #D3D3D3',
  width: '30px'
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
  borderRadius: 0
}

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
  borderRadius: 0,
  whiteSpace: 'nowrap'
}

const noDataStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'center',
  color: '#888',
  fontStyle: 'italic',
  fontSize: '12px'
}

// ─── Widget ───────────────────────────────────────────────────────────────────

const Widget = (props: AllWidgetProps<IMConfig>) => {

  // ─── State ───────────────────────────────────────────────────────────────────

  const [originalData, setOriginalData]     = useState<any[]>([])
  const [currentItems, setCurrentItems]     = useState<any[]>([])
  const [currentPage, setCurrentPage]       = useState<number>(1)
  const [totalPage, setTotalPage]           = useState<number>(0)
  const [searchText, setSearchText]         = useState<string>('')
  const [recvText, setRecvText]             = useState<string>('Empty')

  const [message, setMessage]               = useState<string>('')
  const [messageType, setMessageType]       = useState<'success' | 'error' | 'info'>('info')

  const [refreshBanner, setRefreshBanner]   = useState<string>('')
  const [dispatchBanner, setDispatchBanner] = useState<string>('')

  const [selectedRowKey, setSelectedRowKey] = useState<any>(null)
  const [jimuMapView, setJimuMapView]       = useState<JimuMapView>(null)
  const [checkedCount, setCheckedCount]     = useState<number>(0)
  const [isLoading, setIsLoading]           = useState<boolean>(false)

  const [showPopup, setShowPopup]           = useState<boolean>(false)
  const [popupContext, setPopupContext]      = useState<PopupContext>(null)
  const [popupTitle, setPopupTitle]         = useState<string>('')
  const [popupMessage, setPopupMessage]     = useState<string>('')
  const [activeRow, setActiveRow]           = useState<any>(null)

  const tbodyRef = useRef<HTMLDivElement>(null)
  const urlParamsObj = useRef<any>(getAllUrlParams(window.location.href))

  // ─── Column helpers ───────────────────────────────────────────────────────────

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

  const getCellValue = (item: any, field: string): string =>
    item[field] !== undefined ? String(item[field]) : ''

  // ─── Checkbox helpers ─────────────────────────────────────────────────────────

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
    setCheckedCount(0)
  }

  const onCheckboxChange = () => {
    setTimeout(() => setCheckedCount(getCheckedCount()), 0)
  }

  // ─── Token validation ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (urlParamsObj.current['draft']) return
    const token = urlParamsObj.current['token']
    if (!token || !props.config.tokenValidate_webapiURL) return
    const tokenUrl = props.config.tokenValidate_webapiURL + token
    fetch(tokenUrl)
      .then(r => { if (!r.ok) window.open(props.config.tokenExpired_appUrl, '_self') })
      .catch(() => window.open(props.config.tokenExpired_appUrl, '_self'))
  }, [])

  // ─── Data loading ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async (page: number = 1) => {
    setIsLoading(true)
    setMessage('')

    const result = await fetchData(
      props.config.webApiUrl,
      props.config.urlParams,
      props.config.use_username_for_datafilter
    )

    if (!result.ok) {
      console.error('custom-grid-list - fetchData error:', result.error)
      setIsLoading(false)
      return
    }

    const data = result.data
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    const indexOfLast = page * itemsPerPage
    const indexOfFirst = indexOfLast - itemsPerPage

    setOriginalData(data)
    setCurrentItems(data.slice(indexOfFirst, indexOfLast))
    setTotalPage(Math.ceil(data.length / itemsPerPage))
    setCurrentPage(page)
    setIsLoading(false)
  }, [
    props.config.webApiUrl,
    props.config.urlParams,
    props.config.use_username_for_datafilter,
    props.config.itemsPerPage
  ])

  useEffect(() => {
    loadData(1)
  }, [])

  // ─── TextContent listener (search widget) ────────────────────────────────────

  useEffect(() => {
    const incoming = props.stateProps?.TextContent
    if (!incoming || incoming === recvText) return
    setRecvText(incoming)
    setCurrentPage(1)
    loadData(1)
  }, [props.stateProps?.TextContent])

  // ─── Incoming notification listener ──────────────────────────────────────────

  useEffect(() => {
    const channel = props.config.listenNotificationChannel
    if (!channel) return

    const payload = props.stateProps?.[channel]
    if (!payload) return

    console.log(`custom-grid-list - received notification on channel '${channel}':`, JSON.stringify(payload))

    if (props.config.listenAction === 'refresh') {
      loadData(1)
      setRefreshBanner(defaultMessages.refreshBanner)
    } else if (props.config.listenAction === 'populate') {
      // Forward the received payload to all populateTargetWidgetIds
      const populateChannel = props.config.populateNotificationChannel
      const populateTargets = props.config.populateTargetWidgetIds

      if (populateChannel && populateTargets && populateTargets.length > 0) {
        console.log(`custom-grid-list - forwarding payload on channel '${populateChannel}':`, JSON.stringify(payload))
        populateTargets.forEach((widgetId: string) => {
          props.dispatch(
            appActions.widgetStatePropChange(widgetId, populateChannel, payload)
          )
        })
      }
    }
  }, [props.stateProps?.[props.config.listenNotificationChannel]])

  // ─── Pagination ───────────────────────────────────────────────────────────────

  const handlePagination = (page: number) => {
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    const indexOfLast = page * itemsPerPage
    const indexOfFirst = indexOfLast - itemsPerPage
    setCurrentPage(page)
    setCurrentItems(originalData.slice(indexOfFirst, indexOfLast))
    uncheckAll()
    setSelectedRowKey(null)
  }

  // ─── Search ───────────────────────────────────────────────────────────────────

  const searchItem = () => {
    const columns = getColumns()
    const lower = searchText.toLowerCase()
    const filtered = originalData.filter(item =>
      columns.some(col =>
        getCellValue(item, col.field).toLowerCase().includes(lower)
      )
    )
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    setCurrentItems(filtered.slice(0, itemsPerPage))
    setTotalPage(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1)
    uncheckAll()
    setSelectedRowKey(null)
  }

  const clearSearch = () => {
    setSearchText('')
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    setCurrentItems(originalData.slice(0, itemsPerPage))
    setTotalPage(Math.ceil(originalData.length / itemsPerPage))
    setCurrentPage(1)
    uncheckAll()
    setSelectedRowKey(null)
  }

  // ─── Row click ────────────────────────────────────────────────────────────────

  const handleRowClick = (item: any) => {
    // Highlight the clicked row
    const keyField = props.config.dispatchPayloadField
    const keyVal = keyField ? item[keyField] : null
    setSelectedRowKey(keyVal)

    // Zoom/highlight on map if enabled
    if (props.config.enableRowDispatch && props.config.zoomToFeature && jimuMapView) {
      zoomToFeature(jimuMapView, item)
    }

    // Dispatch notification if enabled
    if (
      props.config.enableRowDispatch &&
      props.config.dispatchNotificationChannel &&
      props.config.dispatchPayloadField &&
      props.config.dispatchPayloadKey
    ) {
      const payload = {
        [props.config.dispatchPayloadKey]: item[props.config.dispatchPayloadField]
      }

      console.log(
        `custom-grid-list - dispatching '${props.config.dispatchNotificationChannel}':`,
        JSON.stringify(payload)
      )

      if (props.config.targetWidgetIds && props.config.targetWidgetIds.length > 0) {
        props.config.targetWidgetIds.forEach((widgetId: string) => {
          props.dispatch(
            appActions.widgetStatePropChange(widgetId, props.config.dispatchNotificationChannel, payload)
          )
        })
      }

      setDispatchBanner(
        `${defaultMessages.dispatchBanner}${props.config.dispatchNotificationChannel} — ${props.config.dispatchPayloadKey}: ${item[props.config.dispatchPayloadField]}`
      )
    }
  }

  // ─── Map helpers ──────────────────────────────────────────────────────────────

  const zoomToFeature = (jmv: JimuMapView, item: any) => {
    if (!props.config.zoomExpression || !props.useDataSources) return

    let whereClause = props.config.zoomExpression
    const regexp = /{(.*?)}/g
    const matches = Array.from(props.config.zoomExpression.matchAll(regexp))

    matches.forEach((match: RegExpMatchArray) => {
      whereClause = whereClause.replace(match[0], item[match[1]] !== undefined ? String(item[match[1]]) : '')
    })

    removeGraphics(jmv)

    for (let i = 0; i < props.useDataSources.length; i++) {
      const dsManager = DataSourceManager.getInstance()
      const ds = dsManager.getDataSource(props.useDataSources[i].dataSourceId) as FeatureLayerDataSource
      if (!ds || !ds.layer) continue

      const query = ds.layer.createQuery()
      query.where = whereClause

      ds.layer.queryExtent(query).then(results => {
        if (results.count > 0) jmv.view.extent = results.extent
      })

      if (props.config.highlightFeature) {
        ds.layer.queryFeatures(query).then(result => {
          result.features.forEach(f => addFeatureGraphic(jmv, f.geometry))
        })
      }
    }
  }

  const removeGraphics = (jmv: JimuMapView) => {
    jmv.view.graphics.forEach(item => jmv.view.graphics.remove(item))
  }

  const addFeatureGraphic = (jmv: JimuMapView, geometry: any) => {
    const graphic = new Graphic({
      geometry,
      symbol: {
        type: 'simple-fill',
        color: 'white',
        style: 'none',
        outline: { color: '#00FFFF', width: 2.0 }
      } as any,
      attributes: { name: 'custom-grid-list-highlight' }
    })
    jmv.view.graphics.add(graphic)
  }

  // ─── Popup helpers ────────────────────────────────────────────────────────────

  const openPopup = (context: PopupContext, title: string, msg: string, row: any = null) => {
    setPopupContext(context)
    setPopupTitle(title)
    setPopupMessage(msg)
    setActiveRow(row)
    setShowPopup(true)
  }

  const onPopupCancel = () => {
    setShowPopup(false)
    if (popupContext === 'global') uncheckAll()
    setPopupContext(null)
    setActiveRow(null)
  }

  const onPopupConfirm = async () => {
    setShowPopup(false)
    if (popupContext === 'row') await handleRowActionConfirmed()
    else if (popupContext === 'global') await handleGlobalActionConfirmed()
    setPopupContext(null)
    setActiveRow(null)
  }

  // ─── Per-row action ───────────────────────────────────────────────────────────

  const onRowActionClick = (row: any) => {
    openPopup(
      'row',
      props.config.buttonConfirmTitle || 'Confirm Action',
      props.config.buttonConfirmMessage || 'Are you sure you want to proceed?',
      row
    )
  }

  const handleRowActionConfirmed = async () => {
    if (!activeRow) return

    const result = await callRowAction(
      props.config.listButton1APIUrl,
      props.config.rowActionHttpMethod,
      props.config.rowActionParamMode,
      props.config.rowActionFields,
      activeRow,
      props.config.use_username_for_button_action
    )

    if (result.ok) {
      setMessage(defaultMessages.successSingle)
      setMessageType('success')
      await loadData(1)
      setRefreshBanner(defaultMessages.refreshBanner)
    } else {
      setMessage(defaultMessages.errorRowAction)
      setMessageType('error')
      console.error('custom-grid-list - row action error:', result.error)
    }
  }

  // ─── Global action ────────────────────────────────────────────────────────────

  const onGlobalActionClick = () => {
    openPopup(
      'global',
      props.config.globalButtonConfirmTitle || 'Confirm Action',
      props.config.globalButtonConfirmMessage || 'Are you sure you want to proceed?'
    )
  }

  const handleGlobalActionConfirmed = async () => {
    const checkedRows = getCheckedRows()
    if (checkedRows.length === 0) return

    const result = await callGlobalAction(
      props.config.globalButtonAPIUrl,
      props.config.globalButtonHttpMethod,
      props.config.globalActionPayloadMode,
      checkedRows,
      props.config.collectionIdField,
      props.config.collectionIdKey,
      props.config.globalActionFields,
      props.config.globalButtonDefaultValues
    )

    if (result.ok) {
      const n = checkedRows.length
      const msg = n === 1
        ? defaultMessages.successSingle
        : defaultMessages.successMultiple.replace('{n}', String(n))
      setMessage(msg)
      setMessageType('success')
      uncheckAll()
      await loadData(1)
      setRefreshBanner(defaultMessages.refreshBanner)
    } else {
      setMessage(defaultMessages.errorGlobalAction)
      setMessageType('error')
      console.error('custom-grid-list - global action error:', result.error)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  const columns          = getColumns()
  const showCheckboxes   = props.config.showCheckboxes || false
  const showRowAction    = props.config.showRowActionButton || false
  const showGlobalBtn    = props.config.showGlobalButton || false
  // Global button only meaningful at runtime when checkboxes are also enabled
  // (rows must be checkable before a global action can be triggered)
  const showGlobal       = showGlobalBtn && showCheckboxes && checkedCount >= 2

  return (
    <div style={containerStyle}>

      {/* Confirmation popup */}
      <ConfirmationPopup
        show={showPopup}
        title={popupTitle}
        message={popupMessage}
        onConfirm={onPopupConfirm}
        onCancel={onPopupCancel}
      />

      {/* Map view — hidden, for zoom/highlight only */}
      {props.config.enableRowDispatch &&
        props.hasOwnProperty('useMapWidgetIds') &&
        props.useMapWidgetIds &&
        props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent
            useMapWidgetId={props.useMapWidgetIds?.[0]}
            onActiveViewChange={(jmv: JimuMapView) => setJimuMapView(jmv)}
          />
        )
      }

      {/* Data source component — ensures layer is ready before dispatch */}
      {props.config.enableRowDispatch &&
        props.useDataSources &&
        props.useDataSources.length > 0 && (
          <DataSourceComponent
            useDataSource={props.useDataSources[0]}
            onDataSourceCreated={(ds: FeatureLayerDataSource) => {
              console.log('custom-grid-list - data source ready')
            }}
          />
        )
      }

      {/* Optional title */}
      {props.config.addTitle && props.config.list_title && (
        <div style={titleStyle}>{props.config.list_title}</div>
      )}

      {/* Message label */}
      {message !== '' && (
        <div style={messageLabelStyle(messageType)}>{message}</div>
      )}

      {/* Notification banners */}
      <NotificationBanner message={refreshBanner} durationMs={3000} />
      <NotificationBanner message={dispatchBanner} durationMs={4000} icon='⚡' />

      {/* Search bar */}
      <div style={searchRowStyle}>
        <input
          style={searchInputStyle}
          type='text'
          placeholder={defaultMessages.searchPlaceholder}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') searchItem() }}
        />
        <button style={searchBtnStyle} onClick={searchItem}>&#9906;</button>
        <button style={clearBtnStyle} onClick={clearSearch}>{defaultMessages.clearButton}</button>
      </div>

      {/* Table — single scrollable container, thead sticky via CSS */}
      <div ref={tbodyRef} style={tbodyWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {showCheckboxes && originalData.length > 1 && (
                <th style={{ ...thStyle, width: '30px', maxWidth: '30px' }}></th>
              )}
              {columns.map((col, i) => (
                <th key={i} style={thStyle}>{col.label}</th>
              ))}
              {showRowAction && (
                <th style={{ ...thStyle, width: '90px', maxWidth: '90px' }}>Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 && !isLoading && (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (showCheckboxes && originalData.length > 1 ? 1 : 0) +
                    (showRowAction ? 1 : 0)
                  }
                  style={noDataStyle}
                >
                  {defaultMessages.noData}
                </td>
              </tr>
            )}
            {currentItems.map((item, rowIndex) => {
              const keyVal = props.config.dispatchPayloadField
                ? item[props.config.dispatchPayloadField]
                : rowIndex
              const isSelected = keyVal !== undefined && keyVal === selectedRowKey
              const isEven = rowIndex % 2 === 1

              return (
                <tr
                  key={rowIndex}
                  onClick={() => handleRowClick(item)}
                >
                  {/* Checkbox — independent toggle, only when more than 1 row total */}
                  {showCheckboxes && originalData.length > 1 && (
                    <td style={cbCellStyle}>
                      <input
                        type='checkbox'
                        data-rowindex={String(rowIndex)}
                        onChange={onCheckboxChange}
                        onClick={e => e.stopPropagation()}
                        style={{ cursor: 'pointer', accentColor: '#076FE5' }}
                      />
                    </td>
                  )}

                  {/* Data cells */}
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} style={tdStyle(isSelected, isEven)}>
                      {getCellValue(item, col.field)}
                    </td>
                  ))}

                  {/* Per-row action button — independent toggle */}
                  {showRowAction && (
                    <td style={{ ...tdStyle(isSelected, isEven), textAlign: 'center', maxWidth: '90px' }}>
                      <button
                        style={rowActionBtnStyle}
                        onClick={e => { e.stopPropagation(); onRowActionClick(item) }}
                      >
                        {props.config.buttonCaption || 'Action'}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination row — pagination left, global button right */}
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
          {showCheckboxes && checkedCount > 0 && (
            <span style={countLabelStyle}>
              {checkedCount} {checkedCount === 1 ? 'row' : 'rows'} selected
            </span>
          )}
          {showGlobal && (
            <button style={globalBtnStyle} onClick={onGlobalActionClick}>
              {props.config.globalButtonCaption || 'Process Selected'}
            </button>
          )}
        </div>
      </div>

    </div>
  )
}

export default Widget
