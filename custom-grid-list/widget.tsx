/** @jsx jsx */
import {
  React,
  AllWidgetProps,
  appActions,
  DataSourceComponent,
  FeatureLayerDataSource,
  DataSourceManager,
  jsx,
  NavigationManager
} from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import { Pagination } from 'jimu-ui'
import Graphic from 'esri/Graphic'
import { IMConfig, ListenChannelEntry } from '../config' // NEW CHANGE: IMPORTED ListenChannelEntry TYPE FROM CONFIG
import { fetchData, callRowAction, callGlobalAction } from 'widgets/shared-code/gridApiService'
import { getAllUrlParams } from 'widgets/shared-code/urlParamService'
import { ConfirmationPopup } from 'widgets/shared-code/ConfirmationPopup'
import { NotificationBanner } from 'widgets/shared-code/NotificationBanner'
import {
  containerStyle,
  titleStyle,
  messageLabelStyle,
  searchRowStyle,
  searchInputStyle,
  searchBtnStyle,
  clearBtnStyle,
  tbodyWrapStyle,
  tableStyle,
  thStyle,
  tdStyle,
  cbCellStyle,
  rowActionBtnStyle,
  pgRowStyle,
  pgLeftStyle,
  pgRightStyle,
  countLabelStyle,
  globalBtnStyle,
  noDataStyle
} from './style'
import defaultMessages from './translations/default'

const { useState, useEffect, useRef, useCallback } = React

// ─── Types ────────────────────────────────────────────────────────────────────

interface Column {
  field: string
  label: string
}

type PopupContext = 'row' | 'global' | 'navigate' | null

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

  const tbodyRef     = useRef<HTMLDivElement>(null)
  const urlParamsObj = useRef<any>(getAllUrlParams(window.location.href))

  // NEW CHANGE: REF TO TRACK THE LAST-SEEN NOTIFICATION VALUE PER CHANNEL.
  // USED BY THE MULTI-LISTENER useEffect TO AVOID RE-TRIGGERING ON EVERY
  // RENDER — ONLY ACTS WHEN A CHANNEL'S VALUE ACTUALLY CHANGES.
  const lastSeenNotifications = useRef<Record<string, any>>({})

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

    const data         = result.data
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    const indexOfLast  = page * itemsPerPage
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

  useEffect(() => { loadData(1) }, [])

  // ─── TextContent listener (connected search widget) ───────────────────────────

  useEffect(() => {
    const incoming = props.stateProps?.TextContent
    if (!incoming || incoming === recvText) return
    setRecvText(incoming)
    setCurrentPage(1)
    loadData(1)
  }, [props.stateProps?.TextContent])

  // NEW CHANGE: REPLACES THE PREVIOUS SINGLE useEffect LISTENER THAT WATCHED ONE
  // CHANNEL. THIS useEffect LOOPS OVER ALL ENTRIES IN listenChannels AND HANDLES
  // EACH INDEPENDENTLY. IT RUNS ON EVERY RENDER (NO DEPENDENCY ARRAY) AND USES
  // THE lastSeenNotifications REF TO DETECT ACTUAL CHANGES PER CHANNEL, AVOIDING
  // SPURIOUS RE-TRIGGERS. EACH LISTENER CAN INDEPENDENTLY PERFORM 'refresh' OR
  // 'populate' AS ITS CONFIGURED ACTION.
  useEffect(() => {
    const channels: ListenChannelEntry[] = Array.from(props.config.listenChannels || [])
    if (channels.length === 0) return

    channels.forEach((entry: ListenChannelEntry) => {
      if (!entry.channel) return

      const currentValue = props.stateProps?.[entry.channel]
      const lastValue    = lastSeenNotifications.current[entry.channel]

      // NEW CHANGE: ONLY ACT WHEN THE VALUE HAS ACTUALLY CHANGED SINCE LAST SEEN
      if (currentValue === undefined || currentValue === lastValue) return

      // NEW CHANGE: RECORD NEW VALUE SO WE DO NOT RE-TRIGGER ON NEXT RENDER
      lastSeenNotifications.current[entry.channel] = currentValue

      console.log(
        `custom-grid-list - received on '${entry.channel}' (action: ${entry.action}):`,
        JSON.stringify(currentValue)
      )

      // NEW CHANGE: EACH LISTENER INDEPENDENTLY ROUTES TO ITS OWN ACTION
      if (entry.action === 'refresh') {
        loadData(1)
        setRefreshBanner(defaultMessages.refreshBanner)

      } else if (entry.action === 'populate') {
        // NEW CHANGE: POPULATE ACTION — FORWARD RECEIVED PAYLOAD TO CONFIGURED TARGETS
        const populateChannel = entry.populateNotificationChannel
        const populateTargets = entry.populateTargetWidgetIds || []

        if (populateChannel && populateTargets.length > 0) {
          console.log(
            `custom-grid-list - forwarding payload on '${populateChannel}':`,
            JSON.stringify(currentValue)
          )
          populateTargets.forEach((widgetId: string) => {
            props.dispatch(
              appActions.widgetStatePropChange(widgetId, populateChannel, currentValue)
            )
          })
        }
      }
    })
  })
  // END NEW CHANGE: MULTI-LISTENER useEffect

  // ─── Pagination ───────────────────────────────────────────────────────────────

  const handlePagination = (page: number) => {
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    const indexOfLast  = page * itemsPerPage
    const indexOfFirst = indexOfLast - itemsPerPage
    setCurrentPage(page)
    setCurrentItems(originalData.slice(indexOfFirst, indexOfLast))
    uncheckAll()
    setSelectedRowKey(null)
  }

  // ─── Search ───────────────────────────────────────────────────────────────────

  const searchItem = () => {
    const columns  = getColumns()
    const lower    = searchText.toLowerCase()
    const filtered = originalData.filter(item =>
      columns.some(col => getCellValue(item, col.field).toLowerCase().includes(lower))
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
    const keyVal = props.config.dispatchPayloadField
      ? item[props.config.dispatchPayloadField]
      : null
    setSelectedRowKey(keyVal)

    if (props.config.enableRowDispatch && props.config.zoomToFeature && jimuMapView) {
      zoomToFeature(jimuMapView, item)
    }

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
            appActions.widgetStatePropChange(
              widgetId,
              props.config.dispatchNotificationChannel,
              payload
            )
          )
        })
      }

      setDispatchBanner(
        `${defaultMessages.dispatchBanner}${props.config.dispatchNotificationChannel}`
      )
    }
  }

  // ─── Map helpers ──────────────────────────────────────────────────────────────

  const zoomToFeature = (jmv: JimuMapView, item: any) => {
    if (!props.config.zoomExpression || !props.useDataSources) return

    let whereClause = props.config.zoomExpression
    const regexp    = /{(.*?)}/g
    const matches   = Array.from(props.config.zoomExpression.matchAll(regexp))

    matches.forEach((match: RegExpMatchArray) => {
      whereClause = whereClause.replace(
        match[0],
        item[match[1]] !== undefined ? String(item[match[1]]) : ''
      )
    })

    removeGraphics(jmv)

    for (let i = 0; i < props.useDataSources.length; i++) {
      const dsManager = DataSourceManager.getInstance()
      const ds        = dsManager.getDataSource(
        props.useDataSources[i].dataSourceId
      ) as FeatureLayerDataSource
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

  const openPopup = (
    context: PopupContext,
    title: string,
    msg: string,
    row: any = null
  ) => {
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
    if (popupContext === 'row')          await handleRowActionConfirmed()
    else if (popupContext === 'global')   await handleGlobalActionConfirmed()
    else if (popupContext === 'navigate') handleNavigateConfirmed()
    setPopupContext(null)
    setActiveRow(null)
  }

  // ─── Per-row button — routes to api or navigate mode ─────────────────────────

  const onRowActionClick = (row: any) => {
    const mode = props.config.rowActionMode || 'api'

    if (mode === 'api') {
      openPopup(
        'row',
        props.config.buttonConfirmTitle || 'Confirm Action',
        props.config.buttonConfirmMessage || 'Are you sure you want to proceed?',
        row
      )
    } else if (mode === 'navigate') {
      if (props.config.showConfirmBeforeNavigate) {
        openPopup(
          'navigate',
          props.config.navigateConfirmTitle || 'Confirm Navigation',
          props.config.navigateConfirmMessage || 'Are you sure you want to proceed?',
          row
        )
      } else {
        executeNavigation(row)
      }
    }
  }

  // ─── API action ───────────────────────────────────────────────────────────────

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

      // NEW CHANGE: POST-ACTION NOTIFICATION BLOCK — DISPATCHED AFTER A SUCCESSFUL
      // PER-ROW API CALL WHEN enablePostActionNotification IS TRUE.
      // PAYLOAD IS BUILT FROM postActionPayloadFields FIELD MAPPINGS.
      // IF postActionPayloadFields IS EMPTY, AN EMPTY OBJECT {} IS DISPATCHED
      // ACTING AS A PURE SUCCESS SIGNAL. USES A SEPARATE TARGET WIDGET ID LIST
      // (postActionTargetWidgetIds) INDEPENDENT OF THE ROW CLICK DISPATCH TARGETS.
      if (
        props.config.enablePostActionNotification &&           // NEW CHANGE
        props.config.postActionNotificationChannel &&          // NEW CHANGE
        props.config.postActionTargetWidgetIds &&              // NEW CHANGE
        props.config.postActionTargetWidgetIds.length > 0      // NEW CHANGE
      ) {
        const payload: Record<string, any> = {}               // NEW CHANGE: BUILD PAYLOAD FROM ROW DATA

        if (props.config.postActionPayloadFields) {           // NEW CHANGE
          props.config.postActionPayloadFields.split(',').forEach(pair => {  // NEW CHANGE
            const parts = pair.trim().split(':')              // NEW CHANGE
            if (parts.length >= 2) {                          // NEW CHANGE
              const fieldName  = parts[0].trim()              // NEW CHANGE
              const payloadKey = parts[1].trim()              // NEW CHANGE
              if (activeRow[fieldName] !== undefined) {        // NEW CHANGE
                payload[payloadKey] = activeRow[fieldName]    // NEW CHANGE
              }                                               // NEW CHANGE
            }                                                 // NEW CHANGE
          })                                                  // NEW CHANGE
        }                                                     // NEW CHANGE

        console.log(                                          // NEW CHANGE
          `custom-grid-list - dispatching post-action notification on ` +
          `'${props.config.postActionNotificationChannel}':`,
          JSON.stringify(payload)
        )

        props.config.postActionTargetWidgetIds.forEach((widgetId: string) => {  // NEW CHANGE
          props.dispatch(                                     // NEW CHANGE
            appActions.widgetStatePropChange(                 // NEW CHANGE
              widgetId,                                       // NEW CHANGE
              props.config.postActionNotificationChannel,     // NEW CHANGE
              payload                                         // NEW CHANGE
            )                                                 // NEW CHANGE
          )                                                   // NEW CHANGE
        })                                                    // NEW CHANGE
      }
      // END NEW CHANGE: POST-ACTION NOTIFICATION BLOCK

    } else {
      setMessage(defaultMessages.errorRowAction)
      setMessageType('error')
      console.error('custom-grid-list - row action error:', result.error)
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  const executeNavigation = (row: any) => {
    const targetType   = props.config.navigateTargetType || 'page'
    const target       = props.config.navigateTarget || ''
    const urlParamsStr = props.config.navigateUrlParams || ''
    const carryParams  = props.config.navigateCarryUrlParams

    if (!target) {
      console.warn('custom-grid-list - navigate: no target configured')
      return
    }

    const params: string[] = []

    if (urlParamsStr) {
      urlParamsStr.split(',').forEach(pair => {
        const parts = pair.trim().split(':')
        if (parts.length >= 2) {
          const fieldName  = parts[0].trim()
          const paramKey   = parts[1].trim()
          const fieldValue = row[fieldName]
          if (fieldValue !== undefined && fieldValue !== null) {
            params.push(`${paramKey}=${encodeURIComponent(String(fieldValue))}`)
          }
        }
      })
    }

    if (carryParams) {
      const currentParams = getAllUrlParams(window.location.href)
      if (currentParams['token'])    params.push(`token=${currentParams['token']}`)
      if (currentParams['username']) params.push(`username=${currentParams['username']}`)
    }

    const queryString = params.length > 0 ? `?${params.join('&')}` : ''

    console.log(
      `custom-grid-list - navigating to ${targetType}: '${target}'`,
      queryString ? `with params: ${queryString}` : '(no params)'
    )

    if (targetType === 'page') {
      const baseUrl     = window.location.href.split('?')[0]
      const pagePattern = /(\/page\/)([^/?#]+)/
      if (pagePattern.test(baseUrl)) {
        window.open(baseUrl.replace(pagePattern, `$1${target}`) + queryString, '_self')
      } else {
        const sep = queryString ? '&' : '?'
        window.open(`${baseUrl}${queryString}${sep}views=${target}`, '_self')
      }
    } else if (targetType === 'view') {
      try {
        NavigationManager.navigateTo({ value: { view: target }, widgetId: props.id })
      } catch (e) {
        const baseUrl = window.location.href.split('?')[0]
        const sep     = queryString ? '&' : '?'
        window.open(`${baseUrl}${queryString}${sep}views=${target}`, '_self')
        console.warn('custom-grid-list - NavigationManager fallback used:', e)
      }
    } else if (targetType === 'widget') {
      try {
        const el = document.querySelector(`[data-widgetid="${target}"]`) as HTMLElement
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else console.warn(`custom-grid-list - widget element not found: ${target}`)
      } catch (e) {
        console.error('custom-grid-list - widget scroll error:', e)
      }
    }
  }

  const handleNavigateConfirmed = () => {
    if (!activeRow) return
    executeNavigation(activeRow)
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
      const n   = checkedRows.length
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

  const columns        = getColumns()
  const showCheckboxes = props.config.showCheckboxes || false
  const showRowAction  = props.config.showRowActionButton || false
  const showGlobalBtn  = props.config.showGlobalButton || false
  const showGlobal     = showGlobalBtn && showCheckboxes && checkedCount >= 2

  return (
    <div style={containerStyle}>

      <ConfirmationPopup
        show={showPopup}
        title={popupTitle}
        message={popupMessage}
        onConfirm={onPopupConfirm}
        onCancel={onPopupCancel}
      />

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

      {props.config.enableRowDispatch &&
        props.useDataSources &&
        props.useDataSources.length > 0 && (
          <DataSourceComponent
            useDataSource={props.useDataSources[0]}
            onDataSourceCreated={() => {
              console.log('custom-grid-list - data source ready')
            }}
          />
        )
      }

      {props.config.addTitle && props.config.list_title && (
        <div style={titleStyle}>{props.config.list_title}</div>
      )}

      {message !== '' && (
        <div style={messageLabelStyle(messageType)}>{message}</div>
      )}

      <NotificationBanner message={refreshBanner} durationMs={3000} />
      <NotificationBanner message={dispatchBanner} durationMs={4000} icon='⚡' />

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
              const keyVal     = props.config.dispatchPayloadField
                ? item[props.config.dispatchPayloadField]
                : rowIndex
              const isSelected = keyVal !== undefined && keyVal === selectedRowKey
              const isEven     = rowIndex % 2 === 1

              return (
                <tr key={rowIndex} onClick={() => handleRowClick(item)}>
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
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} style={tdStyle(isSelected, isEven)}>
                      {getCellValue(item, col.field)}
                    </td>
                  ))}
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
