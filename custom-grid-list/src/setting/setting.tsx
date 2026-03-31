import { React, Immutable, UseDataSource, AllDataSourceTypes } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { Button, Switch, TextInput } from 'jimu-ui'
import { IMConfig } from '../config'
import defaultI18nMessages from './translations/default'

const hintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#888',
  lineHeight: 1.5,
  marginBottom: '4px',
  fontFamily: 'Arial'
}

interface State {
  inputKey: number
  targetWidgetIdValue: string
  populateTargetWidgetIdValue: string
}

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, State> {

  supportedDsTypes = Immutable([AllDataSourceTypes.FeatureLayer])

  constructor(props) {
    super(props)
    this.state = {
      inputKey: 0,
      targetWidgetIdValue: '',
      populateTargetWidgetIdValue: ''
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  fmt = (id: string, def: string) =>
    this.props.intl.formatMessage({ id, defaultMessage: def })

  onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    this.props.onSettingChange({ id: this.props.id, useMapWidgetIds })
  }

  onDataSourceChange = (useDataSources: UseDataSource[]) => {
    if (!useDataSources) return
    this.props.onSettingChange({ id: this.props.id, useDataSources })
  }

  onTextChange = (key: string) => (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set(key, evt.currentTarget.value)
    })
  }

  onBoolChange = (key: string) => (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set(key, evt.currentTarget.checked)
    })
  }

  // ─── Target widget IDs ───────────────────────────────────────────────────────

  onAddTargetWidgetId = () => {
    const newId = this.state.targetWidgetIdValue.trim()
    if (!newId) return
    const existing = this.props.config.targetWidgetIds || []
    if (existing.indexOf(newId) === -1) {
      this.props.onSettingChange({
        id: this.props.id,
        config: this.props.config.set('targetWidgetIds', [...Array.from(existing), newId])
      })
    }
    this.setState({ targetWidgetIdValue: '', inputKey: Date.now() })
  }

  onClearTargetWidgetIds = () => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('targetWidgetIds', [])
    })
    this.setState({ targetWidgetIdValue: '', inputKey: Date.now() })
  }

  getTargetWidgetIds = () =>
    this.props.config.targetWidgetIds
      ? this.props.config.targetWidgetIds.join(', ')
      : ''

  // ─── Populate target widget IDs ──────────────────────────────────────────────

  onAddPopulateTargetWidgetId = () => {
    const newId = this.state.populateTargetWidgetIdValue.trim()
    if (!newId) return
    const existing = this.props.config.populateTargetWidgetIds || []
    if (existing.indexOf(newId) === -1) {
      this.props.onSettingChange({
        id: this.props.id,
        config: this.props.config.set('populateTargetWidgetIds', [...Array.from(existing), newId])
      })
    }
    this.setState({ populateTargetWidgetIdValue: '', inputKey: Date.now() })
  }

  onClearPopulateTargetWidgetIds = () => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('populateTargetWidgetIds', [])
    })
    this.setState({ populateTargetWidgetIdValue: '', inputKey: Date.now() })
  }

  getPopulateTargetWidgetIds = () =>
    this.props.config.populateTargetWidgetIds
      ? this.props.config.populateTargetWidgetIds.join(', ')
      : ''

  // ─── Widget ID input renderer ────────────────────────────────────────────────

  renderWidgetIdInput = (
    currentIds: string,
    inputValue: string,
    onInputChange: (val: string) => void,
    onAdd: () => void,
    onClear: () => void
  ) => (
    <>
      <SettingRow>
        <label style={{ fontSize: '12px' }}>
          {this.fmt('currentWidgetId', defaultI18nMessages.currentWidgetId)}{this.props.widgetId}
        </label>
      </SettingRow>
      <SettingRow>
        <label style={{ fontSize: '12px' }}>
          {this.fmt('targetWidgetIds', defaultI18nMessages.targetWidgetIds)}{currentIds}
        </label>
      </SettingRow>
      <SettingRow label={this.fmt('enterWidgetId', defaultI18nMessages.enterWidgetId)} />
      <SettingRow>
        <input
          key={this.state.inputKey}
          type='text'
          value={inputValue}
          style={{
            width: '100%',
            padding: '4px 6px',
            fontSize: '13px',
            color: '#333',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: 0
          }}
          onChange={e => onInputChange(e.target.value)}
          placeholder='Enter widget ID...'
        />
      </SettingRow>
      <SettingRow>
        <Button size='default' type='primary' onClick={onAdd}>
          {defaultI18nMessages.addButton}
        </Button>
      </SettingRow>
      <SettingRow>
        <Button size='default' type='primary' onClick={onClear}>
          {defaultI18nMessages.clearButton}
        </Button>
      </SettingRow>
    </>
  )

  // ─── Render ───────────────────────────────────────────────────────────────────

  render() {
    const c = this.props.config
    const fmt = this.fmt

    const enableRowDispatch = c.enableRowDispatch || false
    const showButtons = c.showButtons || false
    const listenEnabled = !!(c.listenNotificationChannel)
    const listenAction = c.listenAction || 'refresh'
    const payloadMode = c.globalActionPayloadMode || 'collection'
    const zoomEnabled = c.zoomToFeature || false
    const navEnabled = c.useNavigation || false

    return (
      <div>

        {/* Data source */}
        <SettingSection title='Data Source'>
          <SettingRow>
            <DataSourceSelector
              types={this.supportedDsTypes}
              useDataSourcesEnabled
              useDataSources={this.props.useDataSources}
              onChange={this.onDataSourceChange}
              widgetId={this.props.id}
              hideDataView={true}
              isMultiple={true}
            />
          </SettingRow>
        </SettingSection>

        {/* Data */}
        <SettingSection title={fmt('sectionData', defaultI18nMessages.sectionData)}>

          <SettingRow label={fmt('webApiUrl', defaultI18nMessages.webApiUrl)} />
          <SettingRow>
            <TextInput size='sm' value={c.webApiUrl || ''}
              onChange={this.onTextChange('webApiUrl')}
              onBlur={this.onTextChange('webApiUrl')}
              onKeyUp={this.onTextChange('webApiUrl')}
            />
          </SettingRow>

          <SettingRow label={fmt('urlParams', defaultI18nMessages.urlParams)} />
          <SettingRow>
            <div style={hintStyle}>{defaultI18nMessages.urlParamsHint}</div>
            <TextInput size='sm' value={c.urlParams || ''}
              onChange={this.onTextChange('urlParams')}
              onBlur={this.onTextChange('urlParams')}
              onKeyUp={this.onTextChange('urlParams')}
            />
          </SettingRow>

          <SettingRow label={fmt('columnHeaders', defaultI18nMessages.columnHeaders)} />
          <SettingRow>
            <div style={hintStyle}>{defaultI18nMessages.columnHeadersHint}</div>
            <TextInput size='sm' value={c.columnHeaders || ''}
              onChange={this.onTextChange('columnHeaders')}
              onBlur={this.onTextChange('columnHeaders')}
              onKeyUp={this.onTextChange('columnHeaders')}
            />
          </SettingRow>

          <SettingRow label={fmt('itemsPerPage', defaultI18nMessages.itemsPerPage)} />
          <SettingRow>
            <TextInput size='sm' value={c.itemsPerPage || '10'}
              onChange={this.onTextChange('itemsPerPage')}
              onBlur={this.onTextChange('itemsPerPage')}
              onKeyUp={this.onTextChange('itemsPerPage')}
            />
          </SettingRow>

          <SettingRow label={fmt('useUsernameDataFilter', defaultI18nMessages.useUsernameDataFilter)}>
            <Switch checked={c.use_username_for_datafilter || false}
              onChange={this.onBoolChange('use_username_for_datafilter')} />
          </SettingRow>

        </SettingSection>

        {/* Display */}
        <SettingSection title={fmt('sectionDisplay', defaultI18nMessages.sectionDisplay)}>
          <SettingRow label={fmt('addTitle', defaultI18nMessages.addTitle)}>
            <Switch checked={c.addTitle || false} onChange={this.onBoolChange('addTitle')} />
          </SettingRow>
          {c.addTitle && (
            <>
              <SettingRow label={fmt('listTitle', defaultI18nMessages.listTitle)} />
              <SettingRow>
                <TextInput size='sm' value={c.list_title || ''}
                  onChange={this.onTextChange('list_title')}
                  onBlur={this.onTextChange('list_title')}
                  onKeyUp={this.onTextChange('list_title')}
                />
              </SettingRow>
            </>
          )}
        </SettingSection>

        {/* Row click — dispatch */}
        <SettingSection title={fmt('sectionRowDispatch', defaultI18nMessages.sectionRowDispatch)}>

          <SettingRow label={fmt('enableRowDispatch', defaultI18nMessages.enableRowDispatch)}>
            <Switch checked={enableRowDispatch} onChange={this.onBoolChange('enableRowDispatch')} />
          </SettingRow>

          {enableRowDispatch && (
            <>
              <SettingRow label={fmt('dispatchNotificationChannel', defaultI18nMessages.dispatchNotificationChannel)} />
              <SettingRow>
                <TextInput size='sm' value={c.dispatchNotificationChannel || ''}
                  onChange={this.onTextChange('dispatchNotificationChannel')}
                  onBlur={this.onTextChange('dispatchNotificationChannel')}
                  onKeyUp={this.onTextChange('dispatchNotificationChannel')}
                />
              </SettingRow>

              <SettingRow label={fmt('dispatchPayloadField', defaultI18nMessages.dispatchPayloadField)} />
              <SettingRow>
                <TextInput size='sm' value={c.dispatchPayloadField || ''}
                  onChange={this.onTextChange('dispatchPayloadField')}
                  onBlur={this.onTextChange('dispatchPayloadField')}
                  onKeyUp={this.onTextChange('dispatchPayloadField')}
                />
              </SettingRow>

              <SettingRow label={fmt('dispatchPayloadKey', defaultI18nMessages.dispatchPayloadKey)} />
              <SettingRow>
                <TextInput size='sm' value={c.dispatchPayloadKey || ''}
                  onChange={this.onTextChange('dispatchPayloadKey')}
                  onBlur={this.onTextChange('dispatchPayloadKey')}
                  onKeyUp={this.onTextChange('dispatchPayloadKey')}
                />
              </SettingRow>

              {/* Target widget IDs */}
              <SettingSection title={fmt('sectionTargetWidgets', defaultI18nMessages.sectionTargetWidgets)}>
                {this.renderWidgetIdInput(
                  this.getTargetWidgetIds(),
                  this.state.targetWidgetIdValue,
                  val => this.setState({ targetWidgetIdValue: val }),
                  this.onAddTargetWidgetId,
                  this.onClearTargetWidgetIds
                )}
              </SettingSection>
            </>
          )}

        </SettingSection>

        {/* Incoming notification */}
        <SettingSection title={fmt('sectionListen', defaultI18nMessages.sectionListen)}>

          <SettingRow label={fmt('listenNotificationChannel', defaultI18nMessages.listenNotificationChannel)} />
          <SettingRow>
            <div style={hintStyle}>{defaultI18nMessages.listenChannelHint}</div>
            <TextInput size='sm' value={c.listenNotificationChannel || ''}
              onChange={this.onTextChange('listenNotificationChannel')}
              onBlur={this.onTextChange('listenNotificationChannel')}
              onKeyUp={this.onTextChange('listenNotificationChannel')}
            />
          </SettingRow>

          {listenEnabled && (
            <>
              <SettingRow label={fmt('listenAction', defaultI18nMessages.listenAction)} />
              <SettingRow>
                <select
                  value={c.listenAction || 'refresh'}
                  onChange={e => this.props.onSettingChange({
                    id: this.props.id,
                    config: this.props.config.set('listenAction', e.target.value)
                  })}
                  style={{ width: '100%', padding: '4px', fontSize: '12px', borderRadius: 0 }}
                >
                  <option value='refresh'>refresh — reload data from API</option>
                  <option value='populate'>populate — forward payload to other widgets</option>
                </select>
              </SettingRow>

              {/* Populate section — only shown when listenAction = populate */}
              {listenAction === 'populate' && (
                <SettingSection title={fmt('sectionPopulate', defaultI18nMessages.sectionPopulate)}>
                  <SettingRow label={fmt('populateNotificationChannel', defaultI18nMessages.populateNotificationChannel)} />
                  <SettingRow>
                    <TextInput size='sm' value={c.populateNotificationChannel || ''}
                      onChange={this.onTextChange('populateNotificationChannel')}
                      onBlur={this.onTextChange('populateNotificationChannel')}
                      onKeyUp={this.onTextChange('populateNotificationChannel')}
                    />
                  </SettingRow>
                  <SettingSection title={fmt('sectionPopulateTargets', defaultI18nMessages.sectionPopulateTargets)}>
                    {this.renderWidgetIdInput(
                      this.getPopulateTargetWidgetIds(),
                      this.state.populateTargetWidgetIdValue,
                      val => this.setState({ populateTargetWidgetIdValue: val }),
                      this.onAddPopulateTargetWidgetId,
                      this.onClearPopulateTargetWidgetIds
                    )}
                  </SettingSection>
                </SettingSection>
              )}
            </>
          )}

        </SettingSection>

        {/* Map interaction — only shown when enableRowDispatch */}
        {enableRowDispatch && (
          <SettingSection title={fmt('sectionMap', defaultI18nMessages.sectionMap)}>

            <SettingRow>
              <MapWidgetSelector
                useMapWidgetIds={this.props.useMapWidgetIds}
                onSelect={this.onMapWidgetSelected}
              />
            </SettingRow>

            <SettingRow label={fmt('zoomToFeature', defaultI18nMessages.zoomToFeature)}>
              <Switch checked={c.zoomToFeature || false} onChange={this.onBoolChange('zoomToFeature')} />
            </SettingRow>

            {zoomEnabled && (
              <>
                <SettingRow label={fmt('zoomExpression', defaultI18nMessages.zoomExpression)} />
                <SettingRow>
                  <TextInput size='sm' value={c.zoomExpression || ''}
                    onChange={this.onTextChange('zoomExpression')}
                    onBlur={this.onTextChange('zoomExpression')}
                    onKeyUp={this.onTextChange('zoomExpression')}
                  />
                </SettingRow>
              </>
            )}

            <SettingRow label={fmt('highlightFeature', defaultI18nMessages.highlightFeature)}>
              <Switch checked={c.highlightFeature || false} onChange={this.onBoolChange('highlightFeature')} />
            </SettingRow>

            <SettingRow label={fmt('flashFeature', defaultI18nMessages.flashFeature)}>
              <Switch checked={c.flashFeature || false} onChange={this.onBoolChange('flashFeature')} />
            </SettingRow>

            <SettingRow label={fmt('filterLayer', defaultI18nMessages.filterLayer)}>
              <Switch checked={c.filterLayer || false} onChange={this.onBoolChange('filterLayer')} />
            </SettingRow>

            <SettingRow label={fmt('useNavigation', defaultI18nMessages.useNavigation)}>
              <Switch checked={c.useNavigation || false} onChange={this.onBoolChange('useNavigation')} />
            </SettingRow>

            {navEnabled && (
              <>
                <SettingRow label={fmt('viewName', defaultI18nMessages.viewName)} />
                <SettingRow>
                  <TextInput size='sm' value={c.view_name || ''}
                    onChange={this.onTextChange('view_name')}
                    onBlur={this.onTextChange('view_name')}
                    onKeyUp={this.onTextChange('view_name')}
                  />
                </SettingRow>
              </>
            )}

          </SettingSection>
        )}

        {/* Action buttons master toggle */}
        <SettingSection title={fmt('sectionButtons', defaultI18nMessages.sectionButtons)}>
          <SettingRow label={fmt('showButtons', defaultI18nMessages.showButtons)}>
            <Switch checked={showButtons} onChange={this.onBoolChange('showButtons')} />
          </SettingRow>
          {showButtons && (
            <SettingRow>
              <div style={hintStyle}>{defaultI18nMessages.showButtonsHint}</div>
            </SettingRow>
          )}
        </SettingSection>

        {/* Per-row action button — only when showButtons */}
        {showButtons && (
          <SettingSection title={fmt('sectionPerRow', defaultI18nMessages.sectionPerRow)}>

            <SettingRow label={fmt('buttonCaption', defaultI18nMessages.buttonCaption)} />
            <SettingRow>
              <TextInput size='sm' value={c.buttonCaption || ''}
                onChange={this.onTextChange('buttonCaption')}
                onBlur={this.onTextChange('buttonCaption')}
                onKeyUp={this.onTextChange('buttonCaption')}
              />
            </SettingRow>

            <SettingRow label={fmt('buttonConfirmTitle', defaultI18nMessages.buttonConfirmTitle)} />
            <SettingRow>
              <TextInput size='sm' value={c.buttonConfirmTitle || ''}
                onChange={this.onTextChange('buttonConfirmTitle')}
                onBlur={this.onTextChange('buttonConfirmTitle')}
                onKeyUp={this.onTextChange('buttonConfirmTitle')}
              />
            </SettingRow>

            <SettingRow label={fmt('buttonConfirmMessage', defaultI18nMessages.buttonConfirmMessage)} />
            <SettingRow>
              <TextInput size='sm' value={c.buttonConfirmMessage || ''}
                onChange={this.onTextChange('buttonConfirmMessage')}
                onBlur={this.onTextChange('buttonConfirmMessage')}
                onKeyUp={this.onTextChange('buttonConfirmMessage')}
              />
            </SettingRow>

            <SettingRow label={fmt('listButton1APIUrl', defaultI18nMessages.listButton1APIUrl)} />
            <SettingRow>
              <TextInput size='sm' value={c.listButton1APIUrl || ''}
                onChange={this.onTextChange('listButton1APIUrl')}
                onBlur={this.onTextChange('listButton1APIUrl')}
                onKeyUp={this.onTextChange('listButton1APIUrl')}
              />
            </SettingRow>

            <SettingRow label={fmt('rowActionHttpMethod', defaultI18nMessages.rowActionHttpMethod)} />
            <SettingRow>
              <select
                value={c.rowActionHttpMethod || 'PUT'}
                onChange={e => this.props.onSettingChange({
                  id: this.props.id,
                  config: this.props.config.set('rowActionHttpMethod', e.target.value)
                })}
                style={{ width: '100%', padding: '4px', fontSize: '12px', borderRadius: 0 }}
              >
                <option value='GET'>GET</option>
                <option value='POST'>POST</option>
                <option value='PUT'>PUT</option>
              </select>
            </SettingRow>

            <SettingRow label={fmt('rowActionParamMode', defaultI18nMessages.rowActionParamMode)} />
            <SettingRow>
              <div style={hintStyle}>{defaultI18nMessages.rowActionParamModeHint}</div>
              <select
                value={c.rowActionParamMode || 'query'}
                onChange={e => this.props.onSettingChange({
                  id: this.props.id,
                  config: this.props.config.set('rowActionParamMode', e.target.value)
                })}
                style={{ width: '100%', padding: '4px', fontSize: '12px', borderRadius: 0 }}
              >
                <option value='query'>query — URL query string</option>
                <option value='body'>body — JSON request body</option>
              </select>
            </SettingRow>

            <SettingRow label={fmt('rowActionFields', defaultI18nMessages.rowActionFields)} />
            <SettingRow>
              <div style={hintStyle}>{defaultI18nMessages.rowActionFieldsHint}</div>
              <TextInput size='sm' value={c.rowActionFields || ''}
                onChange={this.onTextChange('rowActionFields')}
                onBlur={this.onTextChange('rowActionFields')}
                onKeyUp={this.onTextChange('rowActionFields')}
              />
            </SettingRow>

            <SettingRow label={fmt('useUsernameRowAction', defaultI18nMessages.useUsernameRowAction)}>
              <Switch checked={c.use_username_for_button_action || false}
                onChange={this.onBoolChange('use_username_for_button_action')} />
            </SettingRow>

            <SettingRow label={fmt('iconFile', defaultI18nMessages.iconFile)} />
            <SettingRow>
              <TextInput size='sm' value={c.icon_file || ''}
                onChange={this.onTextChange('icon_file')}
                onBlur={this.onTextChange('icon_file')}
                onKeyUp={this.onTextChange('icon_file')}
              />
            </SettingRow>

          </SettingSection>
        )}

        {/* Global action button — only when showButtons */}
        {showButtons && (
          <SettingSection title={fmt('sectionGlobal', defaultI18nMessages.sectionGlobal)}>

            <SettingRow label={fmt('globalButtonCaption', defaultI18nMessages.globalButtonCaption)} />
            <SettingRow>
              <TextInput size='sm' value={c.globalButtonCaption || ''}
                onChange={this.onTextChange('globalButtonCaption')}
                onBlur={this.onTextChange('globalButtonCaption')}
                onKeyUp={this.onTextChange('globalButtonCaption')}
              />
            </SettingRow>

            <SettingRow label={fmt('globalButtonConfirmTitle', defaultI18nMessages.globalButtonConfirmTitle)} />
            <SettingRow>
              <TextInput size='sm' value={c.globalButtonConfirmTitle || ''}
                onChange={this.onTextChange('globalButtonConfirmTitle')}
                onBlur={this.onTextChange('globalButtonConfirmTitle')}
                onKeyUp={this.onTextChange('globalButtonConfirmTitle')}
              />
            </SettingRow>

            <SettingRow label={fmt('globalButtonConfirmMessage', defaultI18nMessages.globalButtonConfirmMessage)} />
            <SettingRow>
              <TextInput size='sm' value={c.globalButtonConfirmMessage || ''}
                onChange={this.onTextChange('globalButtonConfirmMessage')}
                onBlur={this.onTextChange('globalButtonConfirmMessage')}
                onKeyUp={this.onTextChange('globalButtonConfirmMessage')}
              />
            </SettingRow>

            <SettingRow label={fmt('globalButtonAPIUrl', defaultI18nMessages.globalButtonAPIUrl)} />
            <SettingRow>
              <TextInput size='sm' value={c.globalButtonAPIUrl || ''}
                onChange={this.onTextChange('globalButtonAPIUrl')}
                onBlur={this.onTextChange('globalButtonAPIUrl')}
                onKeyUp={this.onTextChange('globalButtonAPIUrl')}
              />
            </SettingRow>

            <SettingRow label={fmt('globalButtonHttpMethod', defaultI18nMessages.globalButtonHttpMethod)} />
            <SettingRow>
              <select
                value={c.globalButtonHttpMethod || 'POST'}
                onChange={e => this.props.onSettingChange({
                  id: this.props.id,
                  config: this.props.config.set('globalButtonHttpMethod', e.target.value)
                })}
                style={{ width: '100%', padding: '4px', fontSize: '12px', borderRadius: 0 }}
              >
                <option value='POST'>POST</option>
                <option value='PUT'>PUT</option>
              </select>
            </SettingRow>

            {/* Payload section */}
            <SettingSection title={fmt('sectionGlobalPayload', defaultI18nMessages.sectionGlobalPayload)}>

              <SettingRow label={fmt('globalActionPayloadMode', defaultI18nMessages.globalActionPayloadMode)} />
              <SettingRow>
                <div style={hintStyle}>{defaultI18nMessages.globalActionPayloadModeHint}</div>
                <select
                  value={c.globalActionPayloadMode || 'collection'}
                  onChange={e => this.props.onSettingChange({
                    id: this.props.id,
                    config: this.props.config.set('globalActionPayloadMode', e.target.value)
                  })}
                  style={{ width: '100%', padding: '4px', fontSize: '12px', borderRadius: 0 }}
                >
                  <option value='collection'>collection — single object with ID array</option>
                  <option value='array'>array — one object per checked row</option>
                </select>
              </SettingRow>

              {/* Collection mode fields */}
              {payloadMode === 'collection' && (
                <>
                  <SettingRow label={fmt('collectionIdField', defaultI18nMessages.collectionIdField)} />
                  <SettingRow>
                    <TextInput size='sm' value={c.collectionIdField || ''}
                      onChange={this.onTextChange('collectionIdField')}
                      onBlur={this.onTextChange('collectionIdField')}
                      onKeyUp={this.onTextChange('collectionIdField')}
                    />
                  </SettingRow>

                  <SettingRow label={fmt('collectionIdKey', defaultI18nMessages.collectionIdKey)} />
                  <SettingRow>
                    <TextInput size='sm' value={c.collectionIdKey || ''}
                      onChange={this.onTextChange('collectionIdKey')}
                      onBlur={this.onTextChange('collectionIdKey')}
                      onKeyUp={this.onTextChange('collectionIdKey')}
                    />
                  </SettingRow>
                </>
              )}

              {/* Array mode fields */}
              {payloadMode === 'array' && (
                <>
                  <SettingRow label={fmt('globalActionFields', defaultI18nMessages.globalActionFields)} />
                  <SettingRow>
                    <div style={hintStyle}>{defaultI18nMessages.globalActionFieldsHint}</div>
                    <TextInput size='sm' value={c.globalActionFields || ''}
                      onChange={this.onTextChange('globalActionFields')}
                      onBlur={this.onTextChange('globalActionFields')}
                      onKeyUp={this.onTextChange('globalActionFields')}
                    />
                  </SettingRow>
                </>
              )}

              {/* Default values — shown for both modes */}
              <SettingRow label={fmt('globalButtonDefaultValues', defaultI18nMessages.globalButtonDefaultValues)} />
              <SettingRow>
                <div style={hintStyle}>{defaultI18nMessages.globalButtonDefaultValuesHint}</div>
                <TextInput size='sm' value={c.globalButtonDefaultValues || ''}
                  onChange={this.onTextChange('globalButtonDefaultValues')}
                  onBlur={this.onTextChange('globalButtonDefaultValues')}
                  onKeyUp={this.onTextChange('globalButtonDefaultValues')}
                />
              </SettingRow>

            </SettingSection>

          </SettingSection>
        )}

        {/* Token validation */}
        <SettingSection title={fmt('sectionToken', defaultI18nMessages.sectionToken)}>

          <SettingRow label={fmt('tokenValidateUrl', defaultI18nMessages.tokenValidateUrl)} />
          <SettingRow>
            <TextInput size='sm' value={c.tokenValidate_webapiURL || ''}
              onChange={this.onTextChange('tokenValidate_webapiURL')}
              onBlur={this.onTextChange('tokenValidate_webapiURL')}
              onKeyUp={this.onTextChange('tokenValidate_webapiURL')}
            />
          </SettingRow>

          <SettingRow label={fmt('tokenExpiredUrl', defaultI18nMessages.tokenExpiredUrl)} />
          <SettingRow>
            <TextInput size='sm' value={c.tokenExpired_appUrl || ''}
              onChange={this.onTextChange('tokenExpired_appUrl')}
              onBlur={this.onTextChange('tokenExpired_appUrl')}
              onKeyUp={this.onTextChange('tokenExpired_appUrl')}
            />
          </SettingRow>

        </SettingSection>

      </div>
    )
  }
}
