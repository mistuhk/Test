import { FeatureLayerDataSource, JimuMapView, JimuMapViewComponent } from 'jimu-arcgis'
import { React, AllWidgetProps, appActions, DataSourceManager } from 'jimu-core'
import { Pagination } from 'jimu-ui'
import Graphic from 'esri/Graphic'
import { IMConfig } from '../config'
import {
  containerStyle,
  titleStyle,
  searchRowStyle,
  searchInputStyle,
  searchButtonStyle,
  clearButtonStyle,
  notificationBannerStyle,
  tableContainerStyle,
  tableStyle,
  tableHeaderCellStyle,
  tableCellStyle,
  tableCellAltStyle,
  paginationContainerStyle,
  noDataStyle
} from './style'
import defaultMessages from './translations/default'

const { useState, useEffect, useRef } = React

// ─── Types ────────────────────────────────────────────────────────────────────

interface Column {
  field: string
  label: string
}

// ─── Widget ───────────────────────────────────────────────────────────────────

const Widget = (props: AllWidgetProps<IMConfig>) => {

  const [originalListData, setOriginalListData] = useState<any[]>([])
  const [currentItems, setCurrentItems] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPage, setTotalPage] = useState<number>(0)
  const [searchText, setSearchText] = useState<string>('')
  const [recvText, setRecvText] = useState<string>('Empty')
  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [selectedRowOid, setSelectedRowOid] = useState<any>(null)

  // Yellow notification banners
  const [refreshNotif, setRefreshNotif] = useState<string>('')
  const [dispatchNotif, setDispatchNotif] = useState<string>('')

  // Timers for auto-dismissing banners
  const refreshTimerRef = useRef<any>(null)
  const dispatchTimerRef = useRef<any>(null)

  const urlParamsObj = useRef<any>(getAllUrlParams(window.location.href))

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  // On mount — validate token and load initial data
  useEffect(() => {
    validateToken()
    getListItems(1, recvText)
  }, [])

  // Listen for TextContent from search widget — reload list with new filter
  useEffect(() => {
    const incoming = props.stateProps?.TextContent
    if (!incoming || incoming === recvText) return
    setRecvText(incoming)
    setCurrentPage(1)
    getListItems(1, incoming)
  }, [props.stateProps?.TextContent])

  // Listen for ETSReviewStatusUpdated from ETS Review Form — refresh list
  useEffect(() => {
    const payload = props.stateProps?.ETSReviewStatusUpdated
    if (!payload) return

    console.log('Review Features Grid List - ETSReviewStatusUpdated received:', JSON.stringify(payload))

    getListItems(1, recvText)
    showBanner('refresh', defaultMessages.refreshNotif)
  }, [props.stateProps?.ETSReviewStatusUpdated])

  // Auto-dismiss refresh banner
  useEffect(() => {
    if (!refreshNotif) return
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => setRefreshNotif(''), 3000)
    return () => clearTimeout(refreshTimerRef.current)
  }, [refreshNotif])

  // Auto-dismiss dispatch banner
  useEffect(() => {
    if (!dispatchNotif) return
    if (dispatchTimerRef.current) clearTimeout(dispatchTimerRef.current)
    dispatchTimerRef.current = setTimeout(() => setDispatchNotif(''), 4000)
    return () => clearTimeout(dispatchTimerRef.current)
  }, [dispatchNotif])

  // ─── Banner helper ──────────────────────────────────────────────────────────

  const showBanner = (type: 'refresh' | 'dispatch', text: string) => {
    if (type === 'refresh') setRefreshNotif(text)
    else setDispatchNotif(text)
  }

  // ─── URL / Token helpers ────────────────────────────────────────────────────

  function getAllUrlParams(url: string): any {
    const queryString = url ? url.split('?')[1] : window.location.search.slice(1)
    const obj: any = {}
    if (queryString) {
      queryString.split('#')[0].split('&').forEach(part => {
        const a = part.split('=')
        const paramName = a[0].toLowerCase()
        const paramValue = typeof a[1] === 'undefined' ? true : a[1]
        if (!obj[paramName]) {
          obj[paramName] = paramValue
        } else if (typeof obj[paramName] === 'string') {
          obj[paramName] = [obj[paramName], paramValue]
        } else {
          obj[paramName].push(paramValue)
        }
      })
    }
    return obj
  }

  const validateToken = () => {
    if (urlParamsObj.current.hasOwnProperty('draft')) return
    const token = urlParamsObj.current['token']
    if (!token || !props.config.tokenValidate_webapiURL) return
    const tokenUrl = props.config.tokenValidate_webapiURL + token
    const tokenExpiredUrl = props.config.tokenExpired_appUrl
    fetch(tokenUrl)
      .then(r => { if (r.ok) return r.json(); else window.open(tokenExpiredUrl, '_self') })
      .then(data => { if (data === false) window.open(tokenExpiredUrl, '_self') })
      .catch(() => window.open(tokenExpiredUrl, '_self'))
  }

  // ─── Column helpers ─────────────────────────────────────────────────────────

  const getColumns = (): Column[] => {
    if (!props.config.columnHeaders) return []
    return props.config.columnHeaders.split(',').map(pair => {
      const parts = pair.trim().split(':')
      return {
        field: parts[0].trim(),
        label: parts[1] ? parts[1].trim() : parts[0].trim()
      }
    })
  }

  const getCellValue = (item: any, field: string): string => {
    return item[field] !== undefined ? String(item[field]) : ''
  }

  // ─── Mock data ──────────────────────────────────────────────────────────────
  // SET TO false WHEN THE REAL API ENDPOINT IS READY
  const USE_MOCK_DATA = true

  const MOCK_DATA = [
    { objectId: 1001, FeatureCode: 'BH01', ETSAutoStatus: 'ETS_Review_Required', ETSReviewStatus: 'ACCEPTED',      ETSSiteVisit: 'Yes', ETSAutoComment: 'Boundary overlap detected',   ETSReviewComment: 'Reviewed and accepted' },
    { objectId: 1002, FeatureCode: 'BH02', ETSAutoStatus: 'ETS_Review_Required', ETSReviewStatus: '',              ETSSiteVisit: 'No',  ETSAutoComment: '',                            ETSReviewComment: '' },
    { objectId: 1003, FeatureCode: 'MG01', ETSAutoStatus: 'ETS_No_Review',       ETSReviewStatus: 'REJECTED',      ETSSiteVisit: 'Yes', ETSAutoComment: 'No issues found',             ETSReviewComment: 'Rejected — out of scope' },
    { objectId: 1004, FeatureCode: 'BH01', ETSAutoStatus: 'ETS_Review_Required', ETSReviewStatus: 'PART_ACCEPTED', ETSSiteVisit: 'Yes', ETSAutoComment: 'Classification discrepancy',  ETSReviewComment: 'Partially accepted' },
    { objectId: 1005, FeatureCode: 'MG02', ETSAutoStatus: 'ETS_Review_Required', ETSReviewStatus: '',              ETSSiteVisit: 'No',  ETSAutoComment: '',                            ETSReviewComment: '' },
    { objectId: 1006, FeatureCode: 'HC01', ETSAutoStatus: 'ETS_No_Review',       ETSReviewStatus: 'REFER_TO_RIW',  ETSSiteVisit: 'No',  ETSAutoComment: '',                            ETSReviewComment: 'Refer to RIW team' },
    { objectId: 1007, FeatureCode: 'BH03', ETSAutoStatus: 'ETS_Review_Required', ETSReviewStatus: '',              ETSSiteVisit: 'No',  ETSAutoComment: 'Size threshold exceeded',     ETSReviewComment: '' },
    { objectId: 1008, FeatureCode: 'MG01', ETSAutoStatus: 'ETS_Review_Required', ETSReviewStatus: 'ACCEPTED',      ETSSiteVisit: 'Yes', ETSAutoComment: 'Boundary overlap detected',   ETSReviewComment: 'Accepted after review' },
    { objectId: 1009, FeatureCode: 'HC02', ETSAutoStatus: 'ETS_No_Review',       ETSReviewStatus: '',              ETSSiteVisit: 'No',  ETSAutoComment: '',                            ETSReviewComment: '' },
    { objectId: 1010, FeatureCode: 'BH04', ETSAutoStatus: 'ETS_Review_Required', ETSReviewStatus: 'REJECTED',      ETSSiteVisit: 'Yes', ETSAutoComment: 'Overlap with existing feature', ETSReviewComment: 'Rejected' },
    { objectId: 1011, FeatureCode: 'MG03', ETSAutoStatus: 'ETS_Review_Required', ETSReviewStatus: '',              ETSSiteVisit: 'No',  ETSAutoComment: 'Classification error',        ETSReviewComment: '' },
    { objectId: 1012, FeatureCode: 'BH02', ETSAutoStatus: 'ETS_No_Review',       ETSReviewStatus: 'PART_ACCEPTED', ETSSiteVisit: 'Yes', ETSAutoComment: '',                            ETSReviewComment: 'Partial acceptance' }
  ]

  // ─── Data loading ───────────────────────────────────────────────────────────

  const getListItems = (page: number = currentPage, filterText: string = recvText) => {
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    const indexOfLastItem = page * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const urlParams = getAllUrlParams(window.location.href)

    // ── Mock data intercept ──────────────────────────────────────────────────
    if (USE_MOCK_DATA) {
      console.log('Review Features Grid List - using MOCK DATA (USE_MOCK_DATA = true)')
      const data = MOCK_DATA
      setOriginalListData(data)
      setCurrentItems(data.slice(indexOfFirstItem, indexOfLastItem))
      setTotalPage(Math.ceil(data.length / itemsPerPage))
      setSelectedRowOid(null)
      return
    }
    // ── End mock data intercept ──────────────────────────────────────────────

    let finalUrl = ''
    if (props.config.webApiUrl) {
      if (props.config.urlParams) {
        finalUrl = props.config.webApiUrl + '?' + getFilterExpression(filterText)
        if (props.config.use_username_for_datafilter) {
          finalUrl += '&username=' + urlParams['username']
        }
      } else {
        finalUrl = props.config.webApiUrl
        if (props.config.use_username_for_datafilter) {
          finalUrl += '?username=' + urlParams['username']
        }
      }
    }

    if (!finalUrl) return

    fetch(finalUrl)
      .then(response => { if (response.ok) return response.json() })
      .then(data => {
        if (!data) return
        setOriginalListData(data)
        setCurrentItems(data.slice(indexOfFirstItem, indexOfLastItem))
        setTotalPage(Math.ceil(data.length / itemsPerPage))
        setSelectedRowOid(null)
      })
      .catch(() => {
        setOriginalListData([])
        setCurrentItems([])
      })
  }

  const getFilterExpression = (filterText: string): string => {
    let filterExpression = props.config.urlParams
    const regexp = /{(.*?)}/g
    const matches = Array.from(filterExpression.matchAll(regexp))
    matches.forEach((match: any) => {
      if (match[1] === 'crn') {
        filterExpression = filterExpression.replace(match[0], filterText)
      }
    })
    return filterExpression
  }

  // ─── Pagination ─────────────────────────────────────────────────────────────

  const handlePagination = (page: number) => {
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    const indexOfLastItem = page * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    setCurrentPage(page)
    setCurrentItems(originalListData.slice(indexOfFirstItem, indexOfLastItem))
    setSelectedRowOid(null)
  }

  // ─── Search ─────────────────────────────────────────────────────────────────

  // Searches across ALL column values in each row simultaneously
  const searchItem = () => {
    const columns = getColumns()
    const searchLower = searchText.toLowerCase()
    const filtered = originalListData.filter(item =>
      columns.some(col =>
        String(getCellValue(item, col.field)).toLowerCase().includes(searchLower)
      )
    )
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    setCurrentItems(filtered.slice(0, itemsPerPage))
    setTotalPage(Math.ceil(filtered.length / itemsPerPage))
    setCurrentPage(1)
    setSelectedRowOid(null)
  }

  const clearSearchClick = () => {
    setSearchText('')
    const itemsPerPage = parseInt(props.config.itemsPerPage) || 10
    setCurrentItems(originalListData.slice(0, itemsPerPage))
    setTotalPage(Math.ceil(originalListData.length / itemsPerPage))
    setCurrentPage(1)
    setSelectedRowOid(null)
  }

  // ─── Row click ──────────────────────────────────────────────────────────────

  const handleRowClick = (item: any) => {
    const oidField = props.config.objectIdField || 'objectId'
    const oid = item[oidField]

    // 1. Highlight selected row
    setSelectedRowOid(oid)

    // 2. Zoom and highlight on map
    if (props.config.zoomToFeature && jimuMapView) {
      zoomToFeature(jimuMapView, item)
    }

    // 3. Build and log the payload
    const payload = { objectId: oid }
    console.log('Review Features Grid List - dispatching ETSFeatureSelected:', JSON.stringify(payload))

    // 4. Dispatch ETSFeatureSelected to all configured target widgets
    if (props.config.targetWidgetIds && props.config.targetWidgetIds.length > 0) {
      props.config.targetWidgetIds.forEach((widgetId: string) => {
        props.dispatch(
          appActions.widgetStatePropChange(widgetId, 'ETSFeatureSelected', payload)
        )
      })
    }

    // 5. Show dispatch notification banner
    showBanner('dispatch', `${defaultMessages.dispatchNotif}${oid}`)
  }

  // ─── Map helpers ────────────────────────────────────────────────────────────

  const zoomToFeature = (jmv: JimuMapView, item: any) => {
    if (!props.config.zoomExpression || !props.useDataSources) return

    let whereClause = props.config.zoomExpression
    const regexp = /{(.*?)}/g
    const matches = Array.from(props.config.zoomExpression.matchAll(regexp))
    matches.forEach((match: any) => {
      whereClause = whereClause.replace(match[0], item[match[1]] || '')
    })

    removeGraphics(jmv)

    for (let i = 0; i < props.useDataSources.length; i++) {
      const dsManager = DataSourceManager.getInstance()
      const ds: FeatureLayerDataSource = dsManager.getDataSource(
        props.useDataSources[i].dataSourceId
      ) as FeatureLayerDataSource
      if (!ds || !ds.layer) continue

      const query = ds.layer.createQuery()
      query.where = whereClause

      ds.layer.queryExtent(query).then(results => {
        if (results.count > 0) {
          jmv.view.extent = results.extent
        }
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
      attributes: { name: 'review-features-highlight' }
    })
    jmv.view.graphics.add(graphic)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const columns = getColumns()
  const oidField = props.config.objectIdField || 'objectId'

  return (
    <div style={containerStyle}>

      {/* Hidden map view component — for zoom/highlight only */}
      {props.hasOwnProperty('useMapWidgetIds') &&
        props.useMapWidgetIds &&
        props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent
            useMapWidgetId={props.useMapWidgetIds?.[0]}
            onActiveViewChange={(jmv: JimuMapView) => setJimuMapView(jmv)}
          />
        )
      }

      {/* Optional title */}
      {props.config.addTitle && props.config.list_title && (
        <div style={titleStyle}>{props.config.list_title}</div>
      )}

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
        <button style={searchButtonStyle} onClick={searchItem}>&#9906;</button>
        <button style={clearButtonStyle} onClick={clearSearchClick}>
          {defaultMessages.clearButton}
        </button>
      </div>

      {/* ETSReviewStatusUpdated received banner */}
      {refreshNotif !== '' && (
        <div style={notificationBannerStyle}>&#9889; {refreshNotif}</div>
      )}

      {/* ETSFeatureSelected dispatched banner */}
      {dispatchNotif !== '' && (
        <div style={notificationBannerStyle}>&#9889; {dispatchNotif}</div>
      )}

      {/* Data table */}
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={tableHeaderCellStyle}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={noDataStyle}
                >
                  {defaultMessages.noData}
                </td>
              </tr>
            )}
            {currentItems.map((item, rowIndex) => {
              const oid = item[oidField]
              const isSelected = oid !== undefined && oid === selectedRowOid
              const isEven = rowIndex % 2 === 1

              // Selected row overrides alternating colour
              const rowStyle = isSelected
                ? { backgroundColor: '#9ecef5' }
                : {}

              return (
                <tr
                  key={rowIndex}
                  style={rowStyle}
                  onClick={() => handleRowClick(item)}
                >
                  {columns.map((col, colIndex) => {
                    const cellStyle = isSelected
                      ? { ...tableCellStyle, backgroundColor: '#9ecef5', fontWeight: 'bold' }
                      : isEven
                        ? tableCellAltStyle
                        : tableCellStyle
                    return (
                      <td key={colIndex} style={cellStyle}>
                        {getCellValue(item, col.field)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={paginationContainerStyle}>
        <Pagination
          current={currentPage}
          onChangePage={handlePagination}
          size='default'
          totalPage={totalPage}
        />
      </div>

    </div>
  )
}

export default Widget
