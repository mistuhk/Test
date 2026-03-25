import { React, AllWidgetProps, DataSourceManager, FeatureLayerDataSource, appActions } from 'jimu-core'
import { JimuMapViewComponent, JimuMapView } from 'jimu-arcgis'
import { Switch } from 'jimu-ui'
import { IMConfig } from '../config'
import {
  containerStyle,
  headerStyle,
  sectionStyle,
  labelStyle,
  readOnlyInputStyle,
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

const { useState, useEffect } = React

// Mapping from button label to the value stored in ETSReviewStatus field
const STATUS_MAP = {
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  'PART ACCEPTED': 'PART_ACCEPTED',
  'REFER TO RIW': 'REFER_TO_RIW'
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

  const [message, setMessage] = useState<string>(defaultMessages.noFeatureMessage)
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [hoveredButton, setHoveredButton] = useState<string>(null)
  const [isUpdateHovered, setIsUpdateHovered] = useState<boolean>(false)

  // Notification banner shown when ETSFeatureSelected is received from review-features-grid-list
  const [etsFeatSelectedNotif, setEtsFeatSelectedNotif] = useState<string>('')

  const messageRef = React.useRef<HTMLDivElement>(null)

  // Scroll message into view whenever it changes
  useEffect(() => {
    if (message && messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [message])

  // Auto-dismiss the ETSFeatureSelected notification banner after 4 seconds
  useEffect(() => {
    if (!etsFeatSelectedNotif) return
    const timer = setTimeout(() => setEtsFeatSelectedNotif(''), 4000)
    return () => clearTimeout(timer)
  }, [etsFeatSelectedNotif])

  // Listen for ETSFeatureSelected notification from review-features-grid-list
  // When received: log payload, resolve data source, call refreshFeature to populate form
  useEffect(() => {
    const payload = props.stateProps?.ETSFeatureSelected
    if (!payload) return

    console.log('ETS Review Form - ETSFeatureSelected received:', JSON.stringify(payload))

    if (!props.useDataSources || props.useDataSources.length === 0) {
      setMessage('No data source configured. Please configure the widget in Settings.')
      setMessageType('error')
      return
    }

    const dsManager = DataSourceManager.getInstance()
    const ds: FeatureLayerDataSource = dsManager.getDataSource(
      props.useDataSources[0].dataSourceId
    ) as FeatureLayerDataSource

    if (!ds || !ds.layer) {
      setMessage('Could not access the feature layer. Please check your Settings.')
      setMessageType('error')
      return
    }

    setDataSource(ds)
    setEtsFeatSelectedNotif(`ETSFeatureSelected received — objectId: ${payload.objectId}`)
    refreshFeature(ds, payload.objectId)
  }, [props.stateProps?.ETSFeatureSelected])

  // ─── Form helpers ────────────────────────────────────────────────────────────

  const clearForm = () => {
    setObjectId(null)
    setEtsAutoStatus('')
    setEtsAutoComment('')
    setEtsReviewComment('')
    setEtsReviewStatus('')
    setEtsSiteVisit(false)
    setStagedStatus(null)
  }

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

  // ─── Map view handler — kept for refreshMap() only, map click removed ────────

  const onActiveViewChangeHandler = (jmv: JimuMapView) => {
    setJimuMapView(jmv)
  }

  // ─── Feature layer helpers ────────────────────────────────────────────────────

  const refreshFeature = (ds: FeatureLayerDataSource, oid: number) => {
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

  // ─── Status button handler ────────────────────────────────────────────────────

  const onStatusButtonClick = (buttonLabel: string) => {
    setStagedStatus(buttonLabel)
    setEtsReviewStatus(STATUS_MAP[buttonLabel])
  }

  // ─── Update handler ───────────────────────────────────────────────────────────

  const onUpdateClick = async () => {
    console.log(`feature layer url: ${dataSource.layer.url}`)

    if (!objectId) {
      setMessage(defaultMessages.noFeatureMessage)
      setMessageType('info')
      return
    }

    if (!stagedStatus) {
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

    const updatedFeature = {
      attributes: {
        OBJECTID: objectId,
        ETSReviewStatus: STATUS_MAP[stagedStatus],
        ETSReviewComment: etsReviewComment,
        // ETSSiteVisit stored as 1/0 in the feature layer
        ETSSiteVisit: etsSiteVisit ? 1 : 0
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

        // Re-query the feature so the form reflects the persisted values
        refreshFeature(dataSource, objectId)

        // Dispatch ETSReviewStatusUpdated to all configured notification target widgets
        const payload = {
          objectId: objectId,
          ETSReviewStatus: STATUS_MAP[stagedStatus],
          timestamp: new Date().toISOString()
        }

        console.log('ETS Review Form - dispatching ETSReviewStatusUpdated:', JSON.stringify(payload))

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
        console.error('ETS Review Form - applyEdits error:', errorMessage)
        setMessage(defaultMessages.errorMessage)
        setMessageType('error')
      }
    }).catch((error) => {
      console.error('ETS Review Form - applyEdits exception:', error)
      setMessage(defaultMessages.errorMessage)
      setMessageType('error')
    })
  }

  // ─── Style helpers ────────────────────────────────────────────────────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────────

  const isFormActive = objectId !== null

  return (
    <div style={containerStyle}>

      {/* Hidden map view component — kept for refreshMap() only */}
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

      {/* Status message — top of form */}
      {message !== '' && (
        <div ref={messageRef} style={getMessageStyle()}>{message}</div>
      )}

      {/* ETSFeatureSelected received notification banner — auto-dismisses after 4s */}
      {etsFeatSelectedNotif !== '' && (
        <div style={infoMessageStyle}>&#9889; {etsFeatSelectedNotif}</div>
      )}

      {/* Hint — shown until a feature is selected */}
      {!isFormActive && (
        <div style={infoMessageStyle}>{defaultMessages.noFeatureMessage}</div>
      )}

      {/* Non-editable fields */}
      <div style={sectionStyle}>
        <div style={fieldRowStyle}>
          <label style={labelStyle}>{defaultMessages.etsAutoStatus}</label>
          <input
            style={readOnlyInputStyle}
            readOnly={true}
            value={etsAutoStatus}
          />
        </div>

        <div style={fieldRowStyle}>
          <label style={labelStyle}>{defaultMessages.etsAutoComment}</label>
          <input
            style={readOnlyInputStyle}
            readOnly={true}
            value={etsAutoComment}
          />
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
      </div>

      {/* Review status buttons */}
      <div style={sectionStyle}>
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

      {/* Update button */}
      <button
        style={isUpdateHovered ? updateButtonHoverStyle : updateButtonStyle}
        disabled={!isFormActive}
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
