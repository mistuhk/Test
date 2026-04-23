import { React, AllWidgetProps, FeatureLayerDataSource, appActions, DataSourceComponent } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import { Switch } from 'jimu-ui'
import { IMConfig } from '../config'
import {
  containerStyle,
  headerStyle,
  sectionStyle,
  labelStyle,
  readOnlyInputStyle,
  readOnlyTextAreaStyle,
  textAreaStyle,
  fieldRowStyle,
  toggleRowStyle,
  statusButtonGroupStyle,
  statusButtonAcceptedStyle,
  statusButtonAcceptedHoverStyle,
  statusButtonAcceptedActiveStyle,
  statusButtonRejectedStyle,
  statusButtonRejectedHoverStyle,
  statusButtonRejectedActiveStyle,
  statusButtonPartAcceptedStyle,
  statusButtonPartAcceptedHoverStyle,
  statusButtonPartAcceptedActiveStyle,
  statusButtonReferStyle,
  statusButtonReferHoverStyle,
  statusButtonReferActiveStyle,
  updateButtonStyle,
  updateButtonHoverStyle,
  successMessageStyle,
  errorMessageStyle,
  infoMessageStyle
} from './style'
import defaultMessages from './translations/default'

const { useState, useEffect, useRef } = React

const STATUS_MAP = {
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  'PART ACCEPTED': 'PART_ACCEPTED',
  'REFER TO RIW': 'REFER_TO_RIW'
}

// Reads all query parameters from a URL string and lowercases all keys.
// Consistent with the approach used in custom-grid-list and
// custom-ets-updatestatus-button.
const getAllUrlParams = (url: string): Record<string, string> => {
  const params: Record<string, string> = {}
  const query = (url.split('?')[1] || '').split('#')[0]
  query.split('&').forEach(pair => {
    if (!pair) return
    const [key, val] = pair.split('=')
    if (key) params[key.toLowerCase()] = val || ''
  })
  return params
}

const Widget = (props: AllWidgetProps<IMConfig>) => {

  const [jimuMapView, setJimuMapView] = useState<JimuMapView>(null)
  const [dataSource, setDataSource] = useState<FeatureLayerDataSource>(null)
  const [objectId, setObjectId] = useState<number>(null)

  const [etsAutoStatus, setEtsAutoStatus] = useState<string>('')
  const [etsAutoComment, setEtsAutoComment] = useState<string>('')
  const [etsReviewComment, setEtsReviewComment] = useState<string>('')
  const [etsReviewStatus, setEtsReviewStatus] = useState<string>('')
  const [etsSiteVisit, setEtsSiteVisit] = useState<boolean>(false)
  const [stagedStatus, setStagedStatus] = useState<string>(null)

  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [hoveredButton, setHoveredButton] = useState<string>(null)
  const [isUpdateHovered, setIsUpdateHovered] = useState<boolean>(false)

  const [etsFeatureSelectedNotification, setEtsFeatureSelectedNotification] = useState<string>('')

  // Ref for scroll-to-message behaviour (Request 4 from previous session)
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!etsFeatureSelectedNotification) return
    const timer = setTimeout(() => setEtsFeatureSelectedNotification(''), 4000)
    return () => clearTimeout(timer)
  }, [etsFeatureSelectedNotification])

  // Scroll to the message div whenever a new message is set
  useEffect(() => {
    if (message && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [message])

  useEffect(() => {
    const payload = props.stateProps?.ETSReviewFeatureSelected
    if (!payload) return

    console.log('ETS Review Form - ETSReviewFeatureSelected received:', JSON.stringify(payload))

    if (!dataSource || !dataSource.layer) {
      setMessage('Feature layer is not available. Please check your settings.')
      setMessageType('error')
      return
    }

    setEtsFeatureSelectedNotification(`Selected Review feature (objectId): ${payload.objectId}`)
    refreshFeature(dataSource, payload.objectId)
  }, [props.stateProps?.ETSReviewFeatureSelected])

  const populateForm = (feature: __esri.Graphic) => {
    const attrs = feature.attributes
    setObjectId(attrs['OBJECTID'])
    setEtsAutoStatus(attrs['ETSAutoStatus'] || '')
    setEtsAutoComment(attrs['ETSAutoComment'] || '')
    setEtsReviewComment(attrs['ETSReviewComment'] || '')
    setEtsReviewStatus(attrs['ETSReviewStatus'] || '')
    // ETSSiteVisit is stored as 1/0 in the feature layer
    setEtsSiteVisit(attrs['ETSSiteVisit'] === 1 || attrs['ETSSiteVisit'] === true)
    setStagedStatus(null)
    setMessage('')
  }

  const onActiveViewChangeHandler = (jmv: JimuMapView) => {
    setJimuMapView(jmv)
  }

  const refreshFeature = (ds: FeatureLayerDataSource, oid: number) => {
    if (!ds || !ds.layer) {
      console.error('ETS Review Form: refreshFeature called, but layer not ready.')
      return
    }

    const query = ds.layer.createQuery()
    query.where = `OBJECTID = ${oid}`
    query.outFields = ['*']
    query.returnGeometry = false

    ds.layer.queryFeatures(query).then((result) => {
      if (result.features && result.features.length > 0) {
        populateForm(result.features[0])
      }
    }).catch((error) => {
      console.error('ETS Review Form - refresh error:', error)
    })
  }

  const refreshMap = () => {
    if (jimuMapView) {
      const extent = jimuMapView.view.extent
      extent.xmin = Math.ceil(extent.xmin)
      extent.xmax = Math.ceil(extent.xmax)
      extent.ymin = Math.ceil(extent.ymin)
      extent.ymax = Math.ceil(extent.ymax)
      jimuMapView.view.extent = extent
    }
  }

  const onStatusButtonClick = (buttonLabel: string) => {
    setStagedStatus(buttonLabel)
    setEtsReviewStatus(STATUS_MAP[buttonLabel])
  }

  const onUpdateClick = async () => {

    if (!objectId) {
      setMessage(defaultMessages.noFeatureMessage)
      setMessageType('info')
      return
    }

    // etsReviewStatus is the only mandatory field (Request 3 from previous session).
    // It is non-empty when set by onStatusButtonClick OR pre-populated by populateForm
    // for features that were already reviewed, so returning users find the button enabled.
    if (!etsReviewStatus) {
      setMessage(defaultMessages.noStatusMessage)
      setMessageType('error')
      return
    }

    if (!dataSource || !dataSource.layer) {
      setMessage('Feature layer is not available. Please select a feature first.')
      setMessageType('error')
      return
    }

    setMessage(defaultMessages.updatingMessage)
    setMessageType('info')

    // NEW CHANGE: read username from page URL — same pattern as custom-grid-list
    // and custom-ets-updatestatus-button. Lowercased key matches how the URL
    // parameter is stored internally (?username=X → key 'username').
    const urlParams = getAllUrlParams(window.location.href)
    const reviewer = urlParams['username'] || ''

    // NEW CHANGE: build the ETSReviewTime value based on the reviewTimeAsEpoch
    // setting configured in the widget settings panel.
    // ON  (true)  → Date.now() milliseconds, for an ArcGIS Date field
    // OFF (false) → UTC ISO 8601 string, for a String field
    const useEpoch = props.config.reviewTimeAsEpoch !== false  // defaults to true
    const reviewTime: number | string = useEpoch
      ? Date.now()
      : new Date().toISOString()

    console.log(
      `ETS Review Form: updating OBJECTID=${objectId}`,
      `ETSReviewer='${reviewer}'`,
      `ETSReviewTime=${reviewTime} (${useEpoch ? 'epoch ms' : 'ISO string'})`
    )

    const updatedFeature = {
      attributes: {
        OBJECTID: objectId,
        ETSReviewStatus: etsReviewStatus,
        ETSReviewComment: etsReviewComment,
        // ETSSiteVisit stored as 1/0 in the feature layer
        ETSSiteVisit: etsSiteVisit ? 1 : 0,
        // NEW CHANGE: reviewer username and timestamp — this request
        ETSReviewer: reviewer,
        ETSReviewTime: reviewTime
      }
    }

    dataSource.layer.applyEdits({
      updateFeatures: [updatedFeature]
    }).then((result) => {
      const updateResult = result.updateFeatureResults[0]

      if (updateResult && !updateResult.error) {
        setMessage(defaultMessages.successMessage)
        setMessageType('success')

        refreshMap()
        refreshFeature(dataSource, objectId)

        const payload = {
          objectId: objectId,
          etsReviewStatus: etsReviewStatus,
          timestamp: new Date().toISOString()
        }

        console.log('ETS Review Form: dispatching ETSReviewStatusUpdated:', JSON.stringify(payload))

        if (props.config.notificationTargetWidgetIds &&
          props.config.notificationTargetWidgetIds.length > 0) {
          props.config.notificationTargetWidgetIds.forEach((targetWidgetId: string) => {
            props.dispatch(
              appActions.widgetStatePropChange(targetWidgetId, 'ETSReviewStatusUpdated', payload)
            )
          })
        }

      } else {
        const errorMessage = updateResult?.error?.message || 'Unknown error.'
        console.error('ETS Review Form: applyEdits error:', errorMessage)
        setMessage(defaultMessages.errorMessage)
        setMessageType('error')
      }
    }).catch((error) => {
      console.error('ETS Review Form: applyEdits exception:', error)
      setMessage(defaultMessages.errorMessage)
      setMessageType('error')
    })
  }

  const getMessageStyle = () => {
    if (messageType === 'success') return successMessageStyle
    if (messageType === 'error') return errorMessageStyle
    return infoMessageStyle
  }

  const getStatusButtonStyle = (buttonLabel: string) => {
    const isActive = stagedStatus === buttonLabel
    const isHovered = hoveredButton === buttonLabel

    switch (buttonLabel) {
      case 'ACCEPTED':
        if (isHovered) return statusButtonAcceptedHoverStyle
        return isActive ? statusButtonAcceptedActiveStyle : statusButtonAcceptedStyle

      case 'REJECTED':
        if (isHovered) return statusButtonRejectedHoverStyle
        return isActive ? statusButtonRejectedActiveStyle : statusButtonRejectedStyle

      case 'PART ACCEPTED':
        if (isHovered) return statusButtonPartAcceptedHoverStyle
        return isActive ? statusButtonPartAcceptedActiveStyle : statusButtonPartAcceptedStyle

      case 'REFER TO RIW':
        if (isHovered) return statusButtonReferHoverStyle
        return isActive ? statusButtonReferActiveStyle : statusButtonReferStyle

      default:
        return statusButtonAcceptedStyle
    }
  }

  const isFormActive = objectId !== null
  // Update button enabled when a feature is selected AND a review status exists
  const isUpdateEnabled = isFormActive && !!etsReviewStatus

  return (
    <div style={containerStyle}>

      {props.useDataSources && props.useDataSources.length > 0 && (
        <DataSourceComponent
          useDataSource={props.useDataSources[0]}
          onDataSourceCreated={(ds: FeatureLayerDataSource) => {
            if (ds) setDataSource(ds)
          }}
          onCreateDataSourceFailed={() => {
            console.error('ETS Review Form: failed to create data source')
          }}
        />
      )}

      {/* Hidden map view component, kept for refreshMap() only */}
      {props.hasOwnProperty('useMapWidgetIds') &&
        props.useMapWidgetIds &&
        props.useMapWidgetIds.length === 1 && (
          <JimuMapViewComponent
            useMapWidgetId={props.useMapWidgetIds?.[0]}
            onActiveViewChange={onActiveViewChangeHandler}
          />
        )
      }

      <h6 style={headerStyle}>{defaultMessages.formTitle}</h6>

      {/* Message div at the top — scrolled into view on update */}
      {message !== '' && (
        <div ref={messageRef} style={getMessageStyle()}>{message}</div>
      )}

      {etsFeatureSelectedNotification !== '' && (
        <div style={infoMessageStyle}>&#9889; {etsFeatureSelectedNotification}</div>
      )}

      {/* Non-editable fields */}
      <div style={sectionStyle}>
        <div style={fieldRowStyle}>
          <label style={labelStyle}>{defaultMessages.etsAutoComment}</label>
          <textarea
            style={readOnlyTextAreaStyle}
            value={etsAutoComment}
            readOnly={true} />
        </div>

        <div style={fieldRowStyle}>
          <label style={labelStyle}>{defaultMessages.etsReviewStatus}</label>
          <input
            style={readOnlyInputStyle}
            readOnly={true}
            value={etsReviewStatus}
          />
        </div>
      </div>

      {/* Editable fields */}
      <div style={sectionStyle}>
        <div style={fieldRowStyle}>
          <label style={labelStyle}>{defaultMessages.etsReviewComment}</label>
          <textarea
            style={textAreaStyle}
            value={etsReviewComment}
            disabled={!isFormActive}
            onChange={(e) => setEtsReviewComment(e.target.value)}
          />
        </div>

        <div style={toggleRowStyle}>
          <label style={labelStyle}>{defaultMessages.etsSiteVisit}</label>
          <Switch
            checked={etsSiteVisit}
            disabled={!isFormActive}
            onChange={(evt) => setEtsSiteVisit(evt.target.checked)}
          />
        </div>

        <div style={fieldRowStyle}>
          <label style={labelStyle}>{defaultMessages.reviewStatus}</label>
          <div style={statusButtonGroupStyle}>
            {Object.keys(STATUS_MAP).map((buttonLabel) => (
              <button
                key={buttonLabel}
                style={getStatusButtonStyle(buttonLabel)}
                disabled={!isFormActive}
                onClick={() => onStatusButtonClick(buttonLabel)}
                onMouseEnter={() => setHoveredButton(buttonLabel)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {buttonLabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        style={isUpdateHovered ? updateButtonHoverStyle : updateButtonStyle}
        disabled={!isUpdateEnabled}
        onClick={onUpdateClick}
        onMouseEnter={() => setIsUpdateHovered(true)}
        onMouseLeave={() => setIsUpdateHovered(false)}
      >
        {defaultMessages.updateButton}
      </button>

    </div>
  )
}

export default Widget
