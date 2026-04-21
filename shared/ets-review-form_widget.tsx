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

// NEW CHANGE: import useRef for message scroll — Request 4
const { useState, useEffect, useRef } = React

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

  const [message, setMessage] = useState<string>('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [hoveredButton, setHoveredButton] = useState<string>(null)
  const [isUpdateHovered, setIsUpdateHovered] = useState<boolean>(false)

  const [etsFeatureSelectedNotification, setEtsFeatureSelectedNotification] = useState<string>('')

  // NEW CHANGE: ref for the message div to enable scroll-to — Request 4
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!etsFeatureSelectedNotification) return
    const timer = setTimeout(() => setEtsFeatureSelectedNotification(''), 4000)
    return () => clearTimeout(timer)
  }, [etsFeatureSelectedNotification])

  // NEW CHANGE: scroll to message div when a message is set — Request 4.
  // Fires whenever message changes to a non-empty string. Uses scrollIntoView
  // with 'nearest' so it only scrolls if the element is not already visible,
  // avoiding jarring jumps when the user is already looking at the top of the form.
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

    // NEW CHANGE: guard on etsReviewStatus rather than stagedStatus — Request 3.
    // etsReviewStatus is set both when a user clicks a status button AND when the
    // form is populated from the feature layer (populateForm). This means the
    // Update button is enabled and submittable when returning to a feature that
    // already has a status, without the user needing to re-select it.
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

    const updatedFeature = {
      attributes: {
        OBJECTID: objectId,
        // NEW CHANGE: use etsReviewStatus directly — Request 3.
        // Previously used STATUS_MAP[stagedStatus], which would be undefined
        // when the user returns to a pre-reviewed feature and hasn't clicked
        // a status button in this session. etsReviewStatus always holds the
        // correct current value whether set by populateForm or onStatusButtonClick.
        ETSReviewStatus: etsReviewStatus,
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
        refreshFeature(dataSource, objectId)

        const payload = {
          objectId: objectId,
          etsReviewStatus: etsReviewStatus, // NEW CHANGE: use etsReviewStatus — Request 3
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

  // NEW CHANGE: Update button enabled when form is active AND a review status
  // exists — Request 3. etsReviewStatus is non-empty either when the form is
  // populated from the layer (returning to an already-reviewed feature) or when
  // the user clicks one of the status buttons for the first time.
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

      {/* NEW CHANGE: message div moved to the top — Request 4.
          Previously these were rendered after the Update button at the very
          bottom of the form. Moved here so they are immediately visible when
          a message is set, and the scroll-to-message useEffect brings them
          into view even if the user has scrolled down. */}
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

      {/* NEW CHANGE: Update button disabled state — Request 3.
          Previously disabled={!isFormActive} which only checked whether a
          feature was selected. Now also requires etsReviewStatus to be non-empty.
          This ensures first-time users must click a status button before
          submitting, while returning users (whose status is pre-populated by
          populateForm) find the button immediately enabled. */}
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
