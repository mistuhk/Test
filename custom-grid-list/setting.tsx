import { React, Immutable, UseDataSource, AllDataSourceTypes } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { Button, Switch, TextInput } from 'jimu-ui'
import { IMConfig, ListenChannelEntry } from '../config' // NEW CHANGE: IMPORTED ListenChannelEntry TYPE

// ─── Styles ───────────────────────────────────────────────────────────────────

const hintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#888',
  lineHeight: 1.5,
  marginBottom: '4px',
  fontFamily: 'Arial'
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '60px',
  padding: '4px 6px',
  fontSize: '12px',
  fontFamily: 'Arial',
  border: '1px solid #ccc',
  borderRadius: 0,
  resize: 'vertical' as 'vertical',
  lineHeight: 1.5
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '4px',
  fontSize: '12px',
  borderRadius: 0,
  border: '1px solid #ccc',
  fontFamily: 'Arial'
}

// NEW CHANGE: LISTENER CARD STYLES — USED TO RENDER EACH CONFIGURED LISTENER
// AS A VISUALLY DISTINCT CARD IN THE SETTINGS PANEL
const listenerCardStyle: React.CSSProperties = {
  border: '1px solid #D3D3D3',
  borderLeft: '3px solid #076FE5',
  padding: '8px 10px',
  marginBottom: '8px',
  backgroundColor: '#f9fbff'
}

const listenerCardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px'
}

const listenerChannelLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#333',
  fontFamily: 'Arial'
}

const removeBtnStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#cc0000',
  background: 'none',
  border: '1px solid #cc0000',
  padding: '1px 6px',
  cursor: 'pointer',
  borderRadius: 0,
  fontFamily: 'Arial'
}

const addBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px',
  backgroundColor: '#076FE5',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  fontSize: '12px',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  borderRadius: 0,
  marginTop: '4px'
}
// END NEW CHANGE: LISTENER CARD STYLES

// ─── State ────────────────────────────────────────────────────────────────────

interface State {
  inputKey: number
  targetWidgetIdValue: string
  postActionTargetWidgetIdValue: string   // NEW CHANGE: STATE FOR POST-ACTION TARGET WIDGET ID INPUT
  // NEW CHANGE: STATE FIELDS FOR BUILDING A NEW LISTENER ENTRY BEFORE ADDING IT
  newListenerChannel: string
  newListenerAction: 'refresh' | 'populate'
  newListenerPopulateChannel: string
  newListenerPopulateTargets: string
  showAddListener: boolean
  // END NEW CHANGE: NEW LISTENER FORM STATE
}

// ─── Setting component ────────────────────────────────────────────────────────

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, State> {

  supportedDsTypes = Immutable([AllDataSourceTypes.FeatureLayer])

  constructor (props) {
    super(props)
    this.state = {
      inputKey: 0,
      targetWidgetIdValue: '',
      postActionTargetWidgetIdValue: '',   // NEW CHANGE
      newListenerChannel: '',              // NEW CHANGE
      newListenerAction: 'refresh',        // NEW CHANGE
      newListenerPopulateChannel: '',      // NEW CHANGE
      newListenerPopulateTargets: '',      // NEW CHANGE
      showAddListener: false               // NEW CHANGE
    }
  }

  // ─── Generic helpers ──────────────────────────────────────────────────────────

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

  onSelectChange = (key: string) => (evt: React.ChangeEvent<HTMLSelectElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set(key, evt.target.value)
    })
  }

  onTextareaChange = (key: string) => (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set(key, evt.target.value)
    })
  }

  onBoolChange = (key: string) => (evt: React.FormEvent<HTMLInputElement>) => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set(key, (evt.target as HTMLInputElement).checked)
    })
  }

  // ─── Target widget ID helpers — row dispatch ──────────────────────────────────

  onAddTargetWidgetId = () => {
    const newId    = this.state.targetWidgetIdValue.trim()
    if (!newId) return
    const existing = Array.from(this.props.config.targetWidgetIds || [])
    if (!existing.includes(newId)) {
      this.props.onSettingChange({
        id: this.props.id,
        config: this.props.config.set('targetWidgetIds', [...existing, newId])
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

  // NEW CHANGE: TARGET WIDGET ID HELPERS FOR POST-ACTION NOTIFICATION —
  // SEPARATE FROM ROW CLICK DISPATCH TARGETS. MANAGES postActionTargetWidgetIds.
  onAddPostActionTargetWidgetId = () => {
    const newId    = this.state.postActionTargetWidgetIdValue.trim()
    if (!newId) return
    const existing = Array.from(this.props.config.postActionTargetWidgetIds || [])
    if (!existing.includes(newId)) {
      this.props.onSettingChange({
        id: this.props.id,
        config: this.props.config.set('postActionTargetWidgetIds', [...existing, newId])
      })
    }
    this.setState({ postActionTargetWidgetIdValue: '', inputKey: Date.now() })
  }

  onClearPostActionTargetWidgetIds = () => {
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('postActionTargetWidgetIds', [])
    })
    this.setState({ postActionTargetWidgetIdValue: '', inputKey: Date.now() })
  }
  // END NEW CHANGE: POST-ACTION TARGET WIDGET ID HELPERS

  // NEW CHANGE: LISTEN CHANNEL HELPERS — ADD, REMOVE AND GET OPERATIONS
  // FOR THE listenChannels ARRAY IN CONFIG
  getListenChannels = (): ListenChannelEntry[] =>
    Array.from(this.props.config.listenChannels || [])

  onRemoveListenChannel = (index: number) => {
    const updated = this.getListenChannels().filter((_, i) => i !== index)
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('listenChannels', updated)
    })
  }

  onAddListenChannel = () => {
    const {
      newListenerChannel, newListenerAction,
      newListenerPopulateChannel, newListenerPopulateTargets
    } = this.state

    if (!newListenerChannel.trim()) return

    const newEntry: ListenChannelEntry = {
      channel: newListenerChannel.trim(),
      action: newListenerAction
    }

    if (newListenerAction === 'populate') {
      newEntry.populateNotificationChannel = newListenerPopulateChannel.trim()
      newEntry.populateTargetWidgetIds = newListenerPopulateTargets
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    }

    const updated = [...this.getListenChannels(), newEntry]
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('listenChannels', updated)
    })

    // Reset add form state after saving
    this.setState({
      newListenerChannel: '',
      newListenerAction: 'refresh',
      newListenerPopulateChannel: '',
      newListenerPopulateTargets: '',
      showAddListener: false
    })
  }
  // END NEW CHANGE: LISTEN CHANNEL HELPERS

  // ─── Widget ID input renderer ─────────────────────────────────────────────────

  renderWidgetIdInput = (
    label: string,
    currentIds: string,
    inputValue: string,
    onInputChange: (val: string) => void,
    onAdd: () => void,
    onClear: () => void
  ) => (
    <>
      <SettingRow>
        <label style={{ fontSize: '12px' }}>
          {label}: {currentIds || '(none)'}
        </label>
      </SettingRow>
      <SettingRow label='Enter widget ID' />
      <SettingRow>
        <input
          key={this.state.inputKey}
          type='text'
          value={inputValue}
          style={{
            width: '100%', padding: '4px 6px', fontSize: '12px',
            border: '1px solid #ccc', borderRadius: 0, fontFamily: 'Arial'
          }}
          onChange={e => onInputChange(e.target.value)}
          placeholder='e.g. widget_75'
        />
      </SettingRow>
      <SettingRow>
        <Button size='default' type='primary' onClick={onAdd}>Add</Button>
        &nbsp;
        <Button size='default' type='default' onClick={onClear}>Clear all</Button>
      </SettingRow>
    </>
  )

  // NEW CHANGE: RENDERS A SINGLE LISTENER CARD IN THE SETTINGS PANEL.
  // SHOWS CHANNEL NAME, ACTION SUMMARY AND A REMOVE BUTTON.
  renderListenerCard = (entry: ListenChannelEntry, index: number) => (
    <div key={index} style={listenerCardStyle}>
      <div style={listenerCardHeaderStyle}>
        <span style={listenerChannelLabelStyle}>{entry.channel}</span>
        <button
          style={removeBtnStyle}
          onClick={() => this.onRemoveListenChannel(index)}
        >
          Remove
        </button>
      </div>
      <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Arial' }}>
        Action: <strong>{entry.action}</strong>
        {entry.action === 'populate' && entry.populateNotificationChannel && (
          <> → <em>{entry.populateNotificationChannel}</em>
          {entry.populateTargetWidgetIds && entry.populateTargetWidgetIds.length > 0 && (
            <> → [{entry.populateTargetWidgetIds.join(', ')}]</>
          )}
          </>
        )}
      </div>
    </div>
  )
  // END NEW CHANGE: LISTENER CARD RENDERER

  // NEW CHANGE: RENDERS THE INLINE FORM FOR ADDING A NEW LISTENER ENTRY.
  // SHOWN WHEN THE USER CLICKS '+ Add listener'. SUPPORTS BOTH 'refresh'
  // AND 'populate' ACTIONS WITH APPROPRIATE CONDITIONAL SUB-FIELDS.
  renderAddListenerForm = () => {
    const {
      newListenerChannel, newListenerAction,
      newListenerPopulateChannel, newListenerPopulateTargets
    } = this.state

    return (
      <div style={{ border: '1px dashed #076FE5', padding: '8px 10px', marginBottom: '8px' }}>
        <SettingRow label='Channel name' />
        <SettingRow>
          <input
            type='text'
            value={newListenerChannel}
            placeholder='e.g. ETSReviewStatusUpdated'
            style={{
              width: '100%', padding: '4px 6px', fontSize: '12px',
              border: '1px solid #ccc', borderRadius: 0, fontFamily: 'Arial'
            }}
            onChange={e => this.setState({ newListenerChannel: e.target.value })}
          />
        </SettingRow>

        <SettingRow label='Action on receipt' />
        <SettingRow>
          <select
            style={selectStyle}
            value={newListenerAction}
            onChange={e => this.setState({
              newListenerAction: e.target.value as 'refresh' | 'populate'
            })}
          >
            <option value='refresh'>refresh — reload data from API</option>
            <option value='populate'>populate — forward payload to other widgets</option>
          </select>
        </SettingRow>

        {newListenerAction === 'populate' && (
          <>
            <SettingRow label='Forward on channel' />
            <SettingRow>
              <input
                type='text'
                value={newListenerPopulateChannel}
                placeholder='e.g. GridPopulatePayload'
                style={{
                  width: '100%', padding: '4px 6px', fontSize: '12px',
                  border: '1px solid #ccc', borderRadius: 0, fontFamily: 'Arial'
                }}
                onChange={e => this.setState({ newListenerPopulateChannel: e.target.value })}
              />
            </SettingRow>

            <SettingRow label='Forward to widget IDs (comma-separated)' />
            <SettingRow>
              <input
                type='text'
                value={newListenerPopulateTargets}
                placeholder='e.g. widget_10, widget_11'
                style={{
                  width: '100%', padding: '4px 6px', fontSize: '12px',
                  border: '1px solid #ccc', borderRadius: 0, fontFamily: 'Arial'
                }}
                onChange={e => this.setState({ newListenerPopulateTargets: e.target.value })}
              />
            </SettingRow>
          </>
        )}

        <SettingRow>
          <Button size='default' type='primary' onClick={this.onAddListenChannel}>
            Add listener
          </Button>
          &nbsp;
          <Button
            size='default'
            type='default'
            onClick={() => this.setState({ showAddListener: false })}
          >
            Cancel
          </Button>
        </SettingRow>
      </div>
    )
  }
  // END NEW CHANGE: ADD LISTENER FORM RENDERER

  // ─── Render ───────────────────────────────────────────────────────────────────

  render () {
    const c = this.props.config

    const enableRowDispatch  = c.enableRowDispatch || false
    const payloadMode        = c.globalActionPayloadMode || 'collection'
    const zoomEnabled        = c.zoomToFeature || false
    const navEnabled         = c.useNavigation || false
    const rowActionMode      = c.rowActionMode || 'api'
    const isNavigateMode     = rowActionMode === 'navigate'
    const isApiMode          = rowActionMode === 'api'
    const navigateTargetType = c.navigateTargetType || 'page'
    const listenChannels     = this.getListenChannels()          // NEW CHANGE: READ listenChannels ARRAY
    const postActionEnabled  = c.enablePostActionNotification || false  // NEW CHANGE

    return (
      <div>

        {/* ── Data source ──────────────────────────────────────────────── */}
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

        {/* ── Data ─────────────────────────────────────────────────────── */}
        <SettingSection title='Data'>

          <SettingRow label='Web API URL' />
          <SettingRow>
            <TextInput size='sm' value={c.webApiUrl || ''}
              onChange={this.onTextChange('webApiUrl')}
              onBlur={this.onTextChange('webApiUrl')}
              onKeyUp={this.onTextChange('webApiUrl')}
            />
          </SettingRow>

          <SettingRow label='URL parameter expression' />
          <SettingRow>
            <div style={hintStyle}>
              Supports {'{placeholder}'} tokens from the page URL.
              All placeholder names must be lowercase e.g. caseId={'{caseid}'}
            </div>
            <TextInput size='sm' value={c.urlParams || ''}
              onChange={this.onTextChange('urlParams')}
              onBlur={this.onTextChange('urlParams')}
              onKeyUp={this.onTextChange('urlParams')}
            />
          </SettingRow>

          <SettingRow label='Column headers' />
          <SettingRow>
            <div style={hintStyle}>
              Comma-separated fieldName:Label pairs e.g. caseId:Case ID,crn:CRN
            </div>
            <textarea style={textareaStyle} value={c.columnHeaders || ''}
              onChange={this.onTextareaChange('columnHeaders')}
            />
          </SettingRow>

          <SettingRow label='Items per page' />
          <SettingRow>
            <TextInput size='sm' value={c.itemsPerPage || '10'}
              onChange={this.onTextChange('itemsPerPage')}
              onBlur={this.onTextChange('itemsPerPage')}
              onKeyUp={this.onTextChange('itemsPerPage')}
            />
          </SettingRow>

          <SettingRow label='Append username to data request'>
            <Switch checked={c.use_username_for_datafilter || false}
              onChange={this.onBoolChange('use_username_for_datafilter')} />
          </SettingRow>

        </SettingSection>

        {/* ── Display ──────────────────────────────────────────────────── */}
        <SettingSection title='Display'>
          <SettingRow label='Show widget title bar'>
            <Switch checked={c.addTitle || false}
              onChange={this.onBoolChange('addTitle')} />
          </SettingRow>
          {c.addTitle && (
            <>
              <SettingRow label='Title text' />
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

        {/* ── Row click dispatch ────────────────────────────────────────── */}
        <SettingSection title='Row click — dispatch notification'>

          <SettingRow label='Enable row click dispatch'>
            <Switch checked={enableRowDispatch}
              onChange={this.onBoolChange('enableRowDispatch')} />
          </SettingRow>

          {enableRowDispatch && (
            <>
              <SettingRow label='Dispatch channel name e.g. ETSFeatureSelected' />
              <SettingRow>
                <TextInput size='sm' value={c.dispatchNotificationChannel || ''}
                  onChange={this.onTextChange('dispatchNotificationChannel')}
                  onBlur={this.onTextChange('dispatchNotificationChannel')}
                  onKeyUp={this.onTextChange('dispatchNotificationChannel')}
                />
              </SettingRow>

              <SettingRow label='Row field for payload value e.g. objectId' />
              <SettingRow>
                <TextInput size='sm' value={c.dispatchPayloadField || ''}
                  onChange={this.onTextChange('dispatchPayloadField')}
                  onBlur={this.onTextChange('dispatchPayloadField')}
                  onKeyUp={this.onTextChange('dispatchPayloadField')}
                />
              </SettingRow>

              <SettingRow label='Payload key name e.g. objectId' />
              <SettingRow>
                <TextInput size='sm' value={c.dispatchPayloadKey || ''}
                  onChange={this.onTextChange('dispatchPayloadKey')}
                  onBlur={this.onTextChange('dispatchPayloadKey')}
                  onKeyUp={this.onTextChange('dispatchPayloadKey')}
                />
              </SettingRow>

              <SettingSection title='Notification target widgets'>
                {this.renderWidgetIdInput(
                  'Target widget IDs',
                  Array.from(c.targetWidgetIds || []).join(', '),
                  this.state.targetWidgetIdValue,
                  val => this.setState({ targetWidgetIdValue: val }),
                  this.onAddTargetWidgetId,
                  this.onClearTargetWidgetIds
                )}
              </SettingSection>
            </>
          )}

        </SettingSection>

        {/* NEW CHANGE: INCOMING NOTIFICATION LISTENERS SECTION — REPLACES THE PREVIOUS
            SINGLE-LISTENER SECTION. SUPPORTS MULTIPLE INDEPENDENT LISTENERS EACH WITH
            ITS OWN CHANNEL AND ACTION. RENDERED AS CARDS WITH ADD/REMOVE CONTROLS. */}
        <SettingSection title='Incoming notification listeners'>

          <SettingRow>
            <div style={hintStyle}>
              Add one or more independent listeners. Each listener has its own
              channel name and action. When a notification arrives on a configured
              channel the widget performs the specified action independently of
              any other configured listeners.
            </div>
          </SettingRow>

          {listenChannels.length === 0 && (
            <SettingRow>
              <div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                No listeners configured. Click Add listener to add one.
              </div>
            </SettingRow>
          )}

          {/* NEW CHANGE: RENDER EACH CONFIGURED LISTENER AS A CARD */}
          {listenChannels.map((entry, i) => this.renderListenerCard(entry, i))}

          {/* NEW CHANGE: SHOW ADD FORM OR ADD BUTTON */}
          {this.state.showAddListener
            ? this.renderAddListenerForm()
            : (
              <button
                style={addBtnStyle}
                onClick={() => this.setState({ showAddListener: true })}
              >
                + Add listener
              </button>
            )
          }

        </SettingSection>
        {/* END NEW CHANGE: INCOMING NOTIFICATION LISTENERS SECTION */}

        {/* ── Map interaction ───────────────────────────────────────────── */}
        {enableRowDispatch && (
          <SettingSection title='Map interaction'>

            <SettingRow>
              <MapWidgetSelector
                useMapWidgetIds={this.props.useMapWidgetIds}
                onSelect={this.onMapWidgetSelected}
              />
            </SettingRow>

            <SettingRow label='Zoom to feature on row click'>
              <Switch checked={c.zoomToFeature || false}
                onChange={this.onBoolChange('zoomToFeature')} />
            </SettingRow>

            {zoomEnabled && (
              <>
                <SettingRow label='Zoom SQL expression e.g. OBJECTID = {objectId}' />
                <SettingRow>
                  <TextInput size='sm' value={c.zoomExpression || ''}
                    onChange={this.onTextChange('zoomExpression')}
                    onBlur={this.onTextChange('zoomExpression')}
                    onKeyUp={this.onTextChange('zoomExpression')}
                  />
                </SettingRow>
              </>
            )}

            <SettingRow label='Highlight feature on map'>
              <Switch checked={c.highlightFeature || false}
                onChange={this.onBoolChange('highlightFeature')} />
            </SettingRow>

            <SettingRow label='Flash feature on map'>
              <Switch checked={c.flashFeature || false}
                onChange={this.onBoolChange('flashFeature')} />
            </SettingRow>

            <SettingRow label='Filter connected layer'>
              <Switch checked={c.filterLayer || false}
                onChange={this.onBoolChange('filterLayer')} />
            </SettingRow>

            <SettingRow label='Navigate to a different view'>
              <Switch checked={c.useNavigation || false}
                onChange={this.onBoolChange('useNavigation')} />
            </SettingRow>

            {navEnabled && (
              <>
                <SettingRow label='Target view name' />
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

        {/* ── Checkboxes ────────────────────────────────────────────────── */}
        <SettingSection title='Checkboxes'>
          <SettingRow label='Show checkboxes'>
            <Switch checked={c.showCheckboxes || false}
              onChange={this.onBoolChange('showCheckboxes')} />
          </SettingRow>
          {c.showCheckboxes && (
            <SettingRow>
              <div style={hintStyle}>
                Required for the global action button. Only appear when more
                than 1 row is returned from the API.
              </div>
            </SettingRow>
          )}
        </SettingSection>

        {/* ── Per-row action button ─────────────────────────────────────── */}
        <SettingSection title='Per-row action button'>

          <SettingRow label='Show per-row action button'>
            <Switch checked={c.showRowActionButton || false}
              onChange={this.onBoolChange('showRowActionButton')} />
          </SettingRow>

          {c.showRowActionButton && (
            <>
              <SettingRow label='Button label' />
              <SettingRow>
                <TextInput size='sm' value={c.buttonCaption || ''}
                  onChange={this.onTextChange('buttonCaption')}
                  onBlur={this.onTextChange('buttonCaption')}
                  onKeyUp={this.onTextChange('buttonCaption')}
                />
              </SettingRow>

              <SettingRow label='Button action mode' />
              <SettingRow>
                <div style={hintStyle}>
                  api — calls an API endpoint.
                  navigate — navigates to a page, view or widget.
                </div>
                <select style={selectStyle}
                  value={c.rowActionMode || 'api'}
                  onChange={this.onSelectChange('rowActionMode')}>
                  <option value='api'>api — call API endpoint</option>
                  <option value='navigate'>navigate — go to page / view / widget</option>
                </select>
              </SettingRow>

              {/* ── api mode ──────────────────────────────────────────── */}
              {isApiMode && (
                <>
                  <SettingRow label='Confirmation popup title' />
                  <SettingRow>
                    <TextInput size='sm' value={c.buttonConfirmTitle || ''}
                      onChange={this.onTextChange('buttonConfirmTitle')}
                      onBlur={this.onTextChange('buttonConfirmTitle')}
                      onKeyUp={this.onTextChange('buttonConfirmTitle')}
                    />
                  </SettingRow>

                  <SettingRow label='Confirmation popup message' />
                  <SettingRow>
                    <TextInput size='sm' value={c.buttonConfirmMessage || ''}
                      onChange={this.onTextChange('buttonConfirmMessage')}
                      onBlur={this.onTextChange('buttonConfirmMessage')}
                      onKeyUp={this.onTextChange('buttonConfirmMessage')}
                    />
                  </SettingRow>

                  <SettingRow label='API endpoint URL' />
                  <SettingRow>
                    <TextInput size='sm' value={c.listButton1APIUrl || ''}
                      onChange={this.onTextChange('listButton1APIUrl')}
                      onBlur={this.onTextChange('listButton1APIUrl')}
                      onKeyUp={this.onTextChange('listButton1APIUrl')}
                    />
                  </SettingRow>

                  <SettingRow label='HTTP method' />
                  <SettingRow>
                    <select style={selectStyle}
                      value={c.rowActionHttpMethod || 'PUT'}
                      onChange={this.onSelectChange('rowActionHttpMethod')}>
                      <option value='GET'>GET</option>
                      <option value='POST'>POST</option>
                      <option value='PUT'>PUT</option>
                    </select>
                  </SettingRow>

                  <SettingRow label='Parameter mode' />
                  <SettingRow>
                    <div style={hintStyle}>
                      query — URL query string (for [FromQuery] APIs).
                      body — JSON request body.
                    </div>
                    <select style={selectStyle}
                      value={c.rowActionParamMode || 'query'}
                      onChange={this.onSelectChange('rowActionParamMode')}>
                      <option value='query'>query — URL query string</option>
                      <option value='body'>body — JSON request body</option>
                    </select>
                  </SettingRow>

                  <SettingRow label='Fields to send' />
                  <SettingRow>
                    <div style={hintStyle}>
                      Comma-separated fieldName:payloadKey pairs e.g. caseId:caseId,crn:crn
                    </div>
                    <textarea style={textareaStyle} value={c.rowActionFields || ''}
                      onChange={this.onTextareaChange('rowActionFields')}
                    />
                  </SettingRow>

                  <SettingRow label='Append username to row action'>
                    <Switch checked={c.use_username_for_button_action || false}
                      onChange={this.onBoolChange('use_username_for_button_action')} />
                  </SettingRow>

                  {/* NEW CHANGE: POST-ACTION NOTIFICATION SUB-SECTION — ENTIRELY NEW.
                      SHOWN ONLY WITHIN api MODE. ALLOWS THE WIDGET TO OPTIONALLY DISPATCH
                      A NOTIFICATION AFTER A SUCCESSFUL API CALL WITH A CONFIGURABLE PAYLOAD
                      AND INDEPENDENT TARGET WIDGET ID LIST. */}
                  <SettingSection title='Post-action notification (optional)'>

                    <SettingRow>
                      <div style={hintStyle}>
                        When enabled, dispatches a notification after a successful
                        API call. The payload can include row data fields or be left
                        empty to act as a pure success signal.
                      </div>
                    </SettingRow>

                    <SettingRow label='Enable post-action notification'>
                      <Switch checked={postActionEnabled}
                        onChange={this.onBoolChange('enablePostActionNotification')} />
                    </SettingRow>

                    {postActionEnabled && (
                      <>
                        <SettingRow label='Notification channel name' />
                        <SettingRow>
                          <TextInput size='sm' value={c.postActionNotificationChannel || ''}
                            onChange={this.onTextChange('postActionNotificationChannel')}
                            onBlur={this.onTextChange('postActionNotificationChannel')}
                            onKeyUp={this.onTextChange('postActionNotificationChannel')}
                          />
                        </SettingRow>

                        <SettingRow label='Payload fields (optional)' />
                        <SettingRow>
                          <div style={hintStyle}>
                            Comma-separated fieldName:payloadKey pairs from the clicked row.
                            Leave empty to dispatch an empty payload as a pure success signal.
                            e.g. caseId:caseId,crn:crn sends {'{ caseId: 1001, crn: "A0045523" }'}
                          </div>
                          <textarea style={textareaStyle}
                            value={c.postActionPayloadFields || ''}
                            onChange={this.onTextareaChange('postActionPayloadFields')}
                          />
                        </SettingRow>

                        {this.renderWidgetIdInput(
                          'Post-action target widget IDs',
                          Array.from(c.postActionTargetWidgetIds || []).join(', '),
                          this.state.postActionTargetWidgetIdValue,
                          val => this.setState({ postActionTargetWidgetIdValue: val }),
                          this.onAddPostActionTargetWidgetId,
                          this.onClearPostActionTargetWidgetIds
                        )}
                      </>
                    )}

                  </SettingSection>
                  {/* END NEW CHANGE: POST-ACTION NOTIFICATION SUB-SECTION */}

                  <SettingRow label='Icon file' />
                  <SettingRow>
                    <TextInput size='sm' value={c.icon_file || ''}
                      onChange={this.onTextChange('icon_file')}
                      onBlur={this.onTextChange('icon_file')}
                      onKeyUp={this.onTextChange('icon_file')}
                    />
                  </SettingRow>
                </>
              )}

              {/* ── navigate mode ─────────────────────────────────────── */}
              {isNavigateMode && (
                <>
                  <SettingRow label='Navigation target type' />
                  <SettingRow>
                    <div style={hintStyle}>
                      page — different page. view — different view within a section.
                      widget — scroll to a widget on the current page.
                    </div>
                    <select style={selectStyle}
                      value={c.navigateTargetType || 'page'}
                      onChange={this.onSelectChange('navigateTargetType')}>
                      <option value='page'>page — go to a different page</option>
                      <option value='view'>view — go to a different view</option>
                      <option value='widget'>widget — scroll to a widget</option>
                    </select>
                  </SettingRow>

                  <SettingRow
                    label={
                      navigateTargetType === 'page'   ? 'Target page name' :
                      navigateTargetType === 'view'   ? 'Target view name' :
                                                        'Target widget ID'
                    }
                  />
                  <SettingRow>
                    <div style={hintStyle}>
                      {navigateTargetType === 'page'   && 'Exact page name in the ExB URL e.g. Review-Map'}
                      {navigateTargetType === 'view'   && 'Exact view name configured in the Section widget'}
                      {navigateTargetType === 'widget' && 'Widget ID of the target widget e.g. widget_75'}
                    </div>
                    <TextInput size='sm' value={c.navigateTarget || ''}
                      onChange={this.onTextChange('navigateTarget')}
                      onBlur={this.onTextChange('navigateTarget')}
                      onKeyUp={this.onTextChange('navigateTarget')}
                    />
                  </SettingRow>

                  <SettingRow label='Show confirmation before navigating'>
                    <Switch checked={c.showConfirmBeforeNavigate || false}
                      onChange={this.onBoolChange('showConfirmBeforeNavigate')} />
                  </SettingRow>

                  {c.showConfirmBeforeNavigate && (
                    <>
                      <SettingRow label='Confirmation popup title' />
                      <SettingRow>
                        <TextInput size='sm' value={c.navigateConfirmTitle || ''}
                          onChange={this.onTextChange('navigateConfirmTitle')}
                          onBlur={this.onTextChange('navigateConfirmTitle')}
                          onKeyUp={this.onTextChange('navigateConfirmTitle')}
                        />
                      </SettingRow>
                      <SettingRow label='Confirmation popup message' />
                      <SettingRow>
                        <TextInput size='sm' value={c.navigateConfirmMessage || ''}
                          onChange={this.onTextChange('navigateConfirmMessage')}
                          onBlur={this.onTextChange('navigateConfirmMessage')}
                          onKeyUp={this.onTextChange('navigateConfirmMessage')}
                        />
                      </SettingRow>
                    </>
                  )}

                  <SettingRow label='URL parameters to pass on navigation' />
                  <SettingRow>
                    <div style={hintStyle}>
                      Comma-separated fieldName:paramKey pairs e.g. caseId:caseId,crn:crn
                      appends ?caseId=1571197&crn=A0069409 to the destination URL.
                    </div>
                    <textarea style={textareaStyle} value={c.navigateUrlParams || ''}
                      onChange={this.onTextareaChange('navigateUrlParams')}
                    />
                  </SettingRow>

                  <SettingRow label='Carry token and username to destination'>
                    <Switch checked={c.navigateCarryUrlParams !== false}
                      onChange={this.onBoolChange('navigateCarryUrlParams')} />
                  </SettingRow>
                  <SettingRow>
                    <div style={hintStyle}>
                      When ON, the token and username URL parameters from the current
                      page are automatically appended to the destination URL.
                    </div>
                  </SettingRow>
                </>
              )}

            </>
          )}

        </SettingSection>

        {/* ── Global action button ──────────────────────────────────────── */}
        <SettingSection title='Global action button'>

          <SettingRow label='Show global action button'>
            <Switch checked={c.showGlobalButton || false}
              onChange={this.onBoolChange('showGlobalButton')} />
          </SettingRow>

          {c.showGlobalButton && (
            <>
              <SettingRow>
                <div style={hintStyle}>
                  Appears only when checkboxes are enabled and 2+ rows are checked.
                </div>
              </SettingRow>

              <SettingRow label='Button label' />
              <SettingRow>
                <TextInput size='sm' value={c.globalButtonCaption || ''}
                  onChange={this.onTextChange('globalButtonCaption')}
                  onBlur={this.onTextChange('globalButtonCaption')}
                  onKeyUp={this.onTextChange('globalButtonCaption')}
                />
              </SettingRow>

              <SettingRow label='Confirmation popup title' />
              <SettingRow>
                <TextInput size='sm' value={c.globalButtonConfirmTitle || ''}
                  onChange={this.onTextChange('globalButtonConfirmTitle')}
                  onBlur={this.onTextChange('globalButtonConfirmTitle')}
                  onKeyUp={this.onTextChange('globalButtonConfirmTitle')}
                />
              </SettingRow>

              <SettingRow label='Confirmation popup message' />
              <SettingRow>
                <TextInput size='sm' value={c.globalButtonConfirmMessage || ''}
                  onChange={this.onTextChange('globalButtonConfirmMessage')}
                  onBlur={this.onTextChange('globalButtonConfirmMessage')}
                  onKeyUp={this.onTextChange('globalButtonConfirmMessage')}
                />
              </SettingRow>

              <SettingRow label='API endpoint URL' />
              <SettingRow>
                <TextInput size='sm' value={c.globalButtonAPIUrl || ''}
                  onChange={this.onTextChange('globalButtonAPIUrl')}
                  onBlur={this.onTextChange('globalButtonAPIUrl')}
                  onKeyUp={this.onTextChange('globalButtonAPIUrl')}
                />
              </SettingRow>

              <SettingRow label='HTTP method (POST or PUT)' />
              <SettingRow>
                <select style={selectStyle}
                  value={c.globalButtonHttpMethod || 'POST'}
                  onChange={this.onSelectChange('globalButtonHttpMethod')}>
                  <option value='POST'>POST</option>
                  <option value='PUT'>PUT</option>
                </select>
              </SettingRow>

              <SettingSection title='Global action payload'>

                <SettingRow label='Payload mode' />
                <SettingRow>
                  <div style={hintStyle}>
                    collection — single object with ID array.
                    array — one object per checked row.
                  </div>
                  <select style={selectStyle}
                    value={c.globalActionPayloadMode || 'collection'}
                    onChange={this.onSelectChange('globalActionPayloadMode')}>
                    <option value='collection'>collection — single object with ID array</option>
                    <option value='array'>array — one object per checked row</option>
                  </select>
                </SettingRow>

                {payloadMode === 'collection' && (
                  <>
                    <SettingRow label='Row field to collect IDs from e.g. caseId' />
                    <SettingRow>
                      <TextInput size='sm' value={c.collectionIdField || ''}
                        onChange={this.onTextChange('collectionIdField')}
                        onBlur={this.onTextChange('collectionIdField')}
                        onKeyUp={this.onTextChange('collectionIdField')}
                      />
                    </SettingRow>
                    <SettingRow label='Key name for ID array in payload e.g. caseIds' />
                    <SettingRow>
                      <TextInput size='sm' value={c.collectionIdKey || ''}
                        onChange={this.onTextChange('collectionIdKey')}
                        onBlur={this.onTextChange('collectionIdKey')}
                        onKeyUp={this.onTextChange('collectionIdKey')}
                      />
                    </SettingRow>
                  </>
                )}

                {payloadMode === 'array' && (
                  <>
                    <SettingRow label='Fields per row' />
                    <SettingRow>
                      <div style={hintStyle}>
                        Comma-separated fieldName:payloadKey pairs e.g. caseId:caseId,crn:crn
                      </div>
                      <textarea style={textareaStyle} value={c.globalActionFields || ''}
                        onChange={this.onTextareaChange('globalActionFields')}
                      />
                    </SettingRow>
                  </>
                )}

                <SettingRow label='Fixed default values' />
                <SettingRow>
                  <div style={hintStyle}>
                    Comma-separated key:value pairs e.g. caseStatus:AVAILABLE,casePool:DCR_AUTO
                  </div>
                  <textarea style={textareaStyle} value={c.globalButtonDefaultValues || ''}
                    onChange={this.onTextareaChange('globalButtonDefaultValues')}
                  />
                </SettingRow>

              </SettingSection>
            </>
          )}

        </SettingSection>

        {/* ── Token validation ──────────────────────────────────────────── */}
        <SettingSection title='Token validation'>

          <SettingRow label='Token validation API URL' />
          <SettingRow>
            <TextInput size='sm' value={c.tokenValidate_webapiURL || ''}
              onChange={this.onTextChange('tokenValidate_webapiURL')}
              onBlur={this.onTextChange('tokenValidate_webapiURL')}
              onKeyUp={this.onTextChange('tokenValidate_webapiURL')}
            />
          </SettingRow>

          <SettingRow label='Token expired redirect URL' />
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
