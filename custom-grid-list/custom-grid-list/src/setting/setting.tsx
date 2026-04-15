import { React, Immutable, UseDataSource, AllDataSourceTypes } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { Button, Switch, TextInput } from 'jimu-ui'
import { IMConfig, ListenChannelEntry, DispatchEventEntry } from '../config'
import defaultI18nMessages from './translations/default'

// ─────────────────────────────────────────────────────────────────────────────
// Styles  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

const hintStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#888',
    lineHeight: 1.5,
    marginBottom: '4px',
    fontFamily: 'Arial'
}

const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px',
    fontSize: '12px',
    borderRadius: 0,
    border: '1px solid #ccc',
    fontFamily: 'Arial'
}

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
    fontSize: '10px',
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Arial'
}

const removeBtnStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#cc0000',
    background: 'none',
    border: '1px solid #cc0000',
    padding: '1px 4px',
    cursor: 'pointer',
    borderRadius: 0,
    fontFamily: 'Arial'
}

const addBtnStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px',
    backgroundColor: '#076FE5',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '10px',
    fontFamily: 'Arial',
    fontWeight: 'bold',
    borderRadius: 0,
    marginTop: '4px'
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW CHANGE: KeyValueEditor component — improvement #12
//
// This entire block is new. It replaces every comma-separated "fieldName:label"
// textarea in the settings panel with a structured two-column row editor.
// Nothing in widget.tsx needs to change — the component serialises back to the
// same "key:value,key:value" string the runtime already reads, so it is fully
// backward-compatible with all existing saved configurations.
//
// It is used in 7 places in render() below — each is marked with a
// corresponding // NEW CHANGE: replaced textarea with <KeyValueEditor> comment.
// ─────────────────────────────────────────────────────────────────────────────

interface KvRow { key: string; val: string }

interface KeyValueEditorProps {
    value: string
    onChange: (val: string) => void
    keyPlaceholder?: string
    valuePlaceholder?: string
}

// Parses "fieldA:labelA,fieldB:labelB" → [{key:'fieldA', val:'labelA'}, ...]
// Splits only on the FIRST colon per pair so values containing colons are safe.
const parseKvString = (raw: string): KvRow[] => {
    if (!raw || !raw.trim()) return []
    return raw.split(',')
        .map(pair => {
            const colonIdx = pair.indexOf(':')
            if (colonIdx === -1) return { key: pair.trim(), val: '' }
            return { key: pair.slice(0, colonIdx).trim(), val: pair.slice(colonIdx + 1).trim() }
        })
        .filter(r => r.key || r.val)
}

// Serialises [{key:'fieldA', val:'labelA'}, ...] → "fieldA:labelA,fieldB:labelB"
const serialiseKv = (rows: KvRow[]): string =>
    rows.filter(r => r.key || r.val).map(r => `${r.key}:${r.val}`).join(',')

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
    value, onChange, keyPlaceholder = 'field', valuePlaceholder = 'label'
}) => {
    // Initialise from the config value once on mount. Any edit immediately
    // serialises back to config via onChange, keeping prop and state in sync.
    const [rows, setRows] = React.useState<KvRow[]>(() => parseKvString(value))

    const updateRows = (next: KvRow[]) => { setRows(next); onChange(serialiseKv(next)) }

    const onCellChange = (idx: number, part: 'key' | 'val', text: string) =>
        updateRows(rows.map((r, i) => i === idx ? { ...r, [part]: text } : r))

    const onAddRow = () => updateRows([...rows, { key: '', val: '' }])
    const onRemoveRow = (idx: number) => updateRows(rows.filter((_, i) => i !== idx))

    const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', marginBottom: '4px' }
    const cellStyle: React.CSSProperties = { padding: '2px', verticalAlign: 'middle' }
    const colHeaderStyle: React.CSSProperties = { fontSize: '10px', color: '#888', fontFamily: 'Arial', fontWeight: 'normal', textAlign: 'left', padding: '0 2px 3px 2px' }
    const inputStyle: React.CSSProperties = { width: '100%', padding: '3px 5px', fontSize: '11px', fontFamily: 'Arial', border: '1px solid #ccc', borderRadius: 0, boxSizing: 'border-box' }
    const kvRemoveBtnStyle: React.CSSProperties = { fontSize: '11px', color: '#cc0000', background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', fontFamily: 'Arial', lineHeight: 1 }
    const kvAddBtnStyle: React.CSSProperties = { fontSize: '10px', padding: '3px 8px', backgroundColor: '#076FE5', color: 'white', border: 'none', cursor: 'pointer', borderRadius: 0, fontFamily: 'Arial', fontWeight: 'bold' }

    return (
        <div>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={colHeaderStyle}>{keyPlaceholder}</th>
                        <th style={colHeaderStyle}>{valuePlaceholder}</th>
                        <th style={{ width: '24px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            <td style={cellStyle}>
                                <input type='text' style={inputStyle} value={row.key} placeholder={keyPlaceholder}
                                    onChange={e => onCellChange(idx, 'key', e.target.value)} />
                            </td>
                            <td style={cellStyle}>
                                <input type='text' style={inputStyle} value={row.val} placeholder={valuePlaceholder}
                                    onChange={e => onCellChange(idx, 'val', e.target.value)} />
                            </td>
                            <td style={{ ...cellStyle, textAlign: 'center' }}>
                                <button style={kvRemoveBtnStyle} onClick={() => onRemoveRow(idx)}>✕</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button style={kvAddBtnStyle} onClick={onAddRow}>+ Add row</button>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// State interface  (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

interface State {
    inputKey: number
    targetWidgetIdValue: string
    postActionTargetWidgetIdValue: string
    newListenerChannel: string
    newListenerAction: 'refresh' | 'populate'
    newListenerPopulateChannel: string
    newListenerPopulateTargets: string
    showAddListener: boolean
    newDispatchChannel: string
    newDispatchPayloadFields: string
    newDispatchTargetWidgets: string
    showAddDispatchEvent: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Setting class component
// ─────────────────────────────────────────────────────────────────────────────

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, State> {

    supportedDsTypes = Immutable([AllDataSourceTypes.FeatureLayer])

    constructor(props) {
        super(props)
        this.state = {
            inputKey: 0,
            targetWidgetIdValue: '',
            postActionTargetWidgetIdValue: '',
            newListenerChannel: '',
            newListenerAction: 'refresh',
            newListenerPopulateChannel: '',
            newListenerPopulateTargets: '',
            showAddListener: false,
            newDispatchChannel: '',
            newDispatchPayloadFields: '',
            newDispatchTargetWidgets: '',
            showAddDispatchEvent: false
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

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
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set(key, evt.currentTarget.value) })
    }

    onSelectChange = (key: string) => (evt: React.ChangeEvent<HTMLSelectElement>) => {
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set(key, evt.target.value) })
    }

    onBoolChange = (key: string) => (evt: React.FormEvent<HTMLInputElement>) => {
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set(key, evt.currentTarget.checked) })
    }

    // NEW CHANGE: shared onChange handler for all KeyValueEditor instances — improvement #12.
    // Previously each comma-separated textarea used an inline onTextAreaChange(key) call.
    // This replaces that pattern for all key:value pair config fields.
    onKvChange = (key: string) => (val: string) => {
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set(key, val) })
    }

    // ── Target widget ID helpers (unchanged) ──────────────────────────────────

    onAddTargetWidgetId = () => {
        const newId = this.state.targetWidgetIdValue.trim()
        if (!newId) return
        const existing = this.props.config.targetWidgetIds || []
        if (existing.indexOf(newId) === -1) {
            this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('targetWidgetIds', [...Array.from(existing), newId]) })
        }
        this.setState({ targetWidgetIdValue: '', inputKey: Date.now() })
    }

    onClearTargetWidgetIds = () => {
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('targetWidgetIds', []) })
        this.setState({ targetWidgetIdValue: '', inputKey: Date.now() })
    }

    getTargetWidgetIds = () => this.props.config.targetWidgetIds ? this.props.config.targetWidgetIds.join(', ') : ''

    onAddPostActionTargetWidgetId = () => {
        const newId = this.state.postActionTargetWidgetIdValue.trim()
        if (!newId) return
        const existing = Array.from(this.props.config.postActionTargetWidgetIds || [])
        if (!existing.includes(newId)) {
            this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('postActionTargetWidgetIds', [...existing, newId]) })
        }
        this.setState({ postActionTargetWidgetIdValue: '', inputKey: Date.now() })
    }

    onClearPostActionTargetWidgetIds = () => {
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('postActionTargetWidgetIds', []) })
        this.setState({ postActionTargetWidgetIdValue: '', inputKey: Date.now() })
    }

    // ── Listen channel helpers (unchanged) ────────────────────────────────────

    getListenChannels = (): ListenChannelEntry[] => Array.from(this.props.config.listenChannels || [])

    onRemoveListenChannel = (index: number) => {
        const updated = this.getListenChannels().filter((_, i) => i !== index)
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('listenChannels', updated) })
    }

    onAddListenChannel = () => {
        const { newListenerChannel, newListenerAction, newListenerPopulateChannel, newListenerPopulateTargets } = this.state
        if (!newListenerChannel.trim()) return
        const newEntry: ListenChannelEntry = { channel: newListenerChannel.trim(), action: newListenerAction }
        if (newListenerAction === 'populate') {
            newEntry.populateNotificationChannel = newListenerPopulateChannel.trim()
            newEntry.populateTargetWidgetIds = newListenerPopulateTargets.split(',').map(s => s.trim()).filter(Boolean)
        }
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('listenChannels', [...this.getListenChannels(), newEntry]) })
        this.setState({ newListenerChannel: '', newListenerAction: 'refresh', newListenerPopulateChannel: '', newListenerPopulateTargets: '', showAddListener: false })
    }

    // ── Dispatch event helpers (unchanged) ────────────────────────────────────

    getDispatchEvents = (): DispatchEventEntry[] => Array.from(this.props.config.dispatchEvents || [])

    onRemoveDispatchEvent = (index: number) => {
        const updated = this.getDispatchEvents().filter((_, i) => i !== index)
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('dispatchEvents', updated) })
    }

    onAddDispatchEvent = () => {
        const { newDispatchChannel, newDispatchPayloadFields, newDispatchTargetWidgets } = this.state
        if (!newDispatchChannel.trim()) return
        const newEntry: DispatchEventEntry = {
            channel: newDispatchChannel.trim(),
            payloadFields: newDispatchPayloadFields.trim(),
            targetWidgetIds: newDispatchTargetWidgets.split(',').map(s => s.trim()).filter(Boolean)
        }
        this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('dispatchEvents', [...this.getDispatchEvents(), newEntry]) })
        this.setState({ newDispatchChannel: '', newDispatchPayloadFields: '', newDispatchTargetWidgets: '', showAddDispatchEvent: false })
    }

    // ── Renderers ─────────────────────────────────────────────────────────────

    renderWidgetIdInput = (
        label: string, currentIds: string, inputValue: string,
        onInputChange: (val: string) => void, onAdd: () => void, onClear: () => void
    ) => (
        <>
            <SettingRow><label style={{ fontSize: '12px' }}>{this.fmt('currentWidgetId', defaultI18nMessages.currentWidgetId)}{this.props.widgetId}</label></SettingRow>
            <SettingRow><label style={{ fontSize: '12px' }}>{this.fmt('targetWidgetIds', defaultI18nMessages.targetWidgetIds)}{currentIds}</label></SettingRow>
            <SettingRow label={this.fmt('enterWidgetId', defaultI18nMessages.enterWidgetId)} />
            <SettingRow>
                <input key={this.state.inputKey} type='text' value={inputValue}
                    style={{ width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: 0, fontFamily: 'Arial' }}
                    onChange={e => onInputChange(e.target.value)} placeholder='e.g. widget_75' />
            </SettingRow>
            <SettingRow><Button size='default' type='primary' onClick={onAdd}>{defaultI18nMessages.addButton}</Button></SettingRow>
            <SettingRow><Button size='default' type='default' onClick={onClear}>{defaultI18nMessages.clearButton}</Button></SettingRow>
        </>
    )

    renderListenerCard = (entry: ListenChannelEntry, index: number) => (
        <div key={index} style={listenerCardStyle}>
            <div style={listenerCardHeaderStyle}>
                <span style={listenerChannelLabelStyle}>{entry.channel}</span>
                <button style={removeBtnStyle} onClick={() => this.onRemoveListenChannel(index)}>Remove</button>
            </div>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Arial' }}>
                Action: <strong>{entry.action}</strong>
                {entry.action === 'populate' && entry.populateNotificationChannel && (
                    <> → <em>{entry.populateNotificationChannel}</em>
                        {entry.populateTargetWidgetIds?.length > 0 && <> → [{entry.populateTargetWidgetIds.join(', ')}]</>}
                    </>
                )}
            </div>
        </div>
    )

    renderAddListenerForm = () => {
        const { newListenerChannel, newListenerAction, newListenerPopulateChannel, newListenerPopulateTargets } = this.state
        const inlineInput: React.CSSProperties = { width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: 0, fontFamily: 'Arial' }
        return (
            <div style={{ border: '1px dashed #076FE5', padding: '8px 10px', marginBottom: '8px' }}>
                <SettingRow label='Channel name' />
                <SettingRow><input type='text' value={newListenerChannel} placeholder='e.g. ETSReviewStatusUpdated' style={inlineInput} onChange={e => this.setState({ newListenerChannel: e.target.value })} /></SettingRow>
                <SettingRow label='Action on receipt' />
                <SettingRow>
                    <select style={selectStyle} value={newListenerAction} onChange={e => this.setState({ newListenerAction: e.target.value as 'refresh' | 'populate' })}>
                        <option value='refresh'>refresh: reload data from API</option>
                        <option value='populate'>populate: forward payload to other widgets</option>
                    </select>
                </SettingRow>
                {newListenerAction === 'populate' && (
                    <>
                        <SettingRow label='Forward on channel' />
                        <SettingRow><input type='text' value={newListenerPopulateChannel} placeholder='e.g. GridPopulatePayload' style={inlineInput} onChange={e => this.setState({ newListenerPopulateChannel: e.target.value })} /></SettingRow>
                        <SettingRow label='Forward to widget IDs (comma-separated)' />
                        <SettingRow><input type='text' value={newListenerPopulateTargets} placeholder='e.g. widget_10, widget_11' style={inlineInput} onChange={e => this.setState({ newListenerPopulateTargets: e.target.value })} /></SettingRow>
                    </>
                )}
                <SettingRow>
                    <Button size='default' type='primary' onClick={this.onAddListenChannel}>Add listener</Button>
                    &nbsp;
                    <Button size='default' type='default' onClick={() => this.setState({ showAddListener: false })}>Cancel</Button>
                </SettingRow>
            </div>
        )
    }

    renderDispatchEventCard = (entry: DispatchEventEntry, index: number) => (
        <div key={index} style={listenerCardStyle}>
            <div style={listenerCardHeaderStyle}>
                <span style={listenerChannelLabelStyle}>{entry.channel}</span>
                <button style={removeBtnStyle} onClick={() => this.onRemoveDispatchEvent(index)}>Remove</button>
            </div>
            <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Arial' }}>
                {entry.payloadFields ? <span>Payload: <em>{entry.payloadFields}</em></span> : <span style={{ fontStyle: 'italic' }}>Empty payload {'{}'}</span>}
            </div>
            {entry.targetWidgetIds?.length > 0 && (
                <div style={{ fontSize: '11px', color: '#666', fontFamily: 'Arial', marginTop: '3px' }}>Targets: [{entry.targetWidgetIds.join(', ')}]</div>
            )}
        </div>
    )

    renderAddDispatchEventForm = () => {
        const { newDispatchChannel, newDispatchPayloadFields, newDispatchTargetWidgets } = this.state
        const inlineInput: React.CSSProperties = { width: '100%', padding: '4px 6px', fontSize: '12px', border: '1px solid #ccc', borderRadius: 0, fontFamily: 'Arial' }
        return (
            <div style={{ border: '1px dashed #076FE5', padding: '8px 10px', marginBottom: '8px' }}>
                <SettingRow label='Channel name' />
                <SettingRow><input type='text' value={newDispatchChannel} placeholder='e.g. ETSReviewFeatureSelected' style={inlineInput} onChange={e => this.setState({ newDispatchChannel: e.target.value })} /></SettingRow>

                <SettingRow label='Payload fields (optional)' />
                <SettingRow>
                    <div style={hintStyle}>One row per field to include from the clicked row. Leave empty to dispatch an empty payload {'{}'}.</div>
                    {/* NEW CHANGE: replaced free-text <textarea> with <KeyValueEditor> — improvement #12.
                        State field newDispatchPayloadFields still holds the serialised string.
                        The Add event handler (onAddDispatchEvent) is completely untouched. */}
                    <KeyValueEditor
                        value={newDispatchPayloadFields}
                        onChange={val => this.setState({ newDispatchPayloadFields: val })}
                        keyPlaceholder='fieldName'
                        valuePlaceholder='payloadKey'
                    />
                </SettingRow>

                <SettingRow label='Target widget IDs (comma-separated)' />
                <SettingRow><input type='text' value={newDispatchTargetWidgets} placeholder='e.g. widget_75, widget_76' style={inlineInput} onChange={e => this.setState({ newDispatchTargetWidgets: e.target.value })} /></SettingRow>
                <SettingRow>
                    <Button size='default' type='primary' onClick={this.onAddDispatchEvent}>Add event</Button>
                    &nbsp;
                    <Button size='default' type='default' onClick={() => this.setState({ showAddDispatchEvent: false })}>Cancel</Button>
                </SettingRow>
            </div>
        )
    }

    // ── Main render ───────────────────────────────────────────────────────────

    render() {
        const c = this.props.config
        const fmt = this.fmt
        const listenChannels = this.getListenChannels()
        const dispatchEvents = this.getDispatchEvents()
        const payloadMode = c.globalActionPayloadMode || 'collection'
        const zoomEnabled = c.zoomToFeature || false
        const navEnabled = c.useNavigation || false
        const rowActionMode = c.rowActionMode || 'api'
        const isNavigateMode = rowActionMode === 'navigate'
        const isApiMode = rowActionMode === 'api'
        const navigateTargetType = c.navigateTargetType || 'page'
        const postActionEnabled = c.enablePostActionNotification || false

        return (
            <div>

                {/* ── Data Source (unchanged) ───────────────────────────── */}
                <SettingSection title='Data Source'>
                    <SettingRow>
                        <DataSourceSelector types={this.supportedDsTypes} useDataSourcesEnabled
                            useDataSources={this.props.useDataSources} onChange={this.onDataSourceChange}
                            widgetId={this.props.id} hideDataView={true} isMultiple={true} />
                    </SettingRow>
                </SettingSection>

                {/* ── Data ─────────────────────────────────────────────── */}
                <SettingSection title={fmt('sectionData', defaultI18nMessages.sectionData)}>

                    <SettingRow label={fmt('webApiUrl', defaultI18nMessages.webApiUrl)} />
                    <SettingRow>
                        <TextInput size='sm' value={c.webApiUrl || ''} onChange={this.onTextChange('webApiUrl')} onBlur={this.onTextChange('webApiUrl')} onKeyUp={this.onTextChange('webApiUrl')} />
                    </SettingRow>

                    <SettingRow label={fmt('urlParams', defaultI18nMessages.urlParams)} />
                    <SettingRow>
                        <div style={hintStyle}>{defaultI18nMessages.urlParamsHint}</div>
                        <TextInput size='sm' value={c.urlParams || ''} onChange={this.onTextChange('urlParams')} onBlur={this.onTextChange('urlParams')} onKeyUp={this.onTextChange('urlParams')} />
                    </SettingRow>

                    <SettingRow label={fmt('columnHeaders', defaultI18nMessages.columnHeaders)} />
                    <SettingRow>
                        <div style={hintStyle}>{defaultI18nMessages.columnHeadersHint}</div>
                        {/* NEW CHANGE: replaced <textarea> with <KeyValueEditor> — improvement #12.
                            Previously: <textarea value={c.columnHeaders} onChange={onTextAreaChange('columnHeaders')} />
                            The config value written is identical — only the editing UI changed. */}
                        <KeyValueEditor
                            value={c.columnHeaders || ''}
                            onChange={this.onKvChange('columnHeaders')}
                            keyPlaceholder='fieldName'
                            valuePlaceholder='column label'
                        />
                    </SettingRow>

                    <SettingRow label={fmt('itemsPerPage', defaultI18nMessages.itemsPerPage)} />
                    <SettingRow>
                        <TextInput size='sm' value={c.itemsPerPage || '10'} onChange={this.onTextChange('itemsPerPage')} onBlur={this.onTextChange('itemsPerPage')} onKeyUp={this.onTextChange('itemsPerPage')} />
                    </SettingRow>

                    <SettingRow label={fmt('useUsernameDataFilter', defaultI18nMessages.useUsernameDataFilter)}>
                        <Switch checked={c.use_username_for_datafilter || false} onChange={this.onBoolChange('use_username_for_datafilter')} />
                    </SettingRow>

                </SettingSection>

                {/* ── Display ───────────────────────────────────────────── */}
                <SettingSection title={fmt('sectionDisplay', defaultI18nMessages.sectionDisplay)}>

                    <SettingRow label={fmt('addTitle', defaultI18nMessages.addTitle)}>
                        <Switch checked={c.addTitle || false} onChange={this.onBoolChange('addTitle')} />
                    </SettingRow>
                    {c.addTitle && (
                        <>
                            <SettingRow label={fmt('listTitle', defaultI18nMessages.listTitle)} />
                            <SettingRow>
                                <TextInput size='sm' value={c.list_title || ''} onChange={this.onTextChange('list_title')} onBlur={this.onTextChange('list_title')} onKeyUp={this.onTextChange('list_title')} />
                            </SettingRow>
                        </>
                    )}

                    {/* NEW CHANGE: No data message setting — improvement #10.
                        Entirely new block. Did not exist before.
                        In widget.tsx the value is consumed as:
                            {props.config.noDataMessage || defaultMessages.noData}
                        Leaving this blank preserves the original built-in default message. */}
                    <SettingRow label={fmt('noDataMessage', defaultI18nMessages.noDataMessage)} />
                    <SettingRow>
                        <div style={hintStyle}>{defaultI18nMessages.noDataMessageHint}</div>
                        <TextInput size='sm' value={c.noDataMessage || ''}
                            onChange={this.onTextChange('noDataMessage')}
                            onBlur={this.onTextChange('noDataMessage')}
                            onKeyUp={this.onTextChange('noDataMessage')}
                        />
                    </SettingRow>

                </SettingSection>

                {/* ── Row click dispatch events (payload field textarea replaced) ─ */}
                <SettingSection title={fmt('sectionRowDispatch', defaultI18nMessages.sectionRowDispatch)}>
                    <SettingRow>
                        <div style={hintStyle}>
                            Add one or more independent dispatch events. Each event fires on every row click
                            and dispatches its own payload to its own target widgets on its own channel.
                            When no events are configured, row clicks do not dispatch any notifications.
                        </div>
                    </SettingRow>
                    {dispatchEvents.length === 0 && (
                        <SettingRow><div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>No dispatch events configured. Click + Add dispatch event to add one.</div></SettingRow>
                    )}
                    {dispatchEvents.map((entry, i) => this.renderDispatchEventCard(entry, i))}
                    {this.state.showAddDispatchEvent
                        ? this.renderAddDispatchEventForm()
                        : <button style={addBtnStyle} onClick={() => this.setState({ showAddDispatchEvent: true })}>+ Add dispatch event</button>
                    }
                </SettingSection>

                {/* ── Incoming notification listeners (unchanged) ───────── */}
                <SettingSection title={fmt('sectionListen', defaultI18nMessages.sectionListen)}>
                    <SettingRow>
                        <div style={hintStyle}>Add one or more independent listeners. Each listener has its own channel name and action.</div>
                    </SettingRow>
                    {listenChannels.length === 0 && (
                        <SettingRow><div style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>No listeners configured. Click Add listener to add one.</div></SettingRow>
                    )}
                    {listenChannels.map((entry, i) => this.renderListenerCard(entry, i))}
                    {this.state.showAddListener
                        ? this.renderAddListenerForm()
                        : <button style={addBtnStyle} onClick={() => this.setState({ showAddListener: true })}>+ Add listener</button>
                    }
                </SettingSection>

                {/* ── Map interaction (unchanged) ───────────────────────── */}
                <SettingSection title={fmt('sectionMap', defaultI18nMessages.sectionMap)}>
                    <SettingRow><MapWidgetSelector useMapWidgetIds={this.props.useMapWidgetIds} onSelect={this.onMapWidgetSelected} /></SettingRow>
                    <SettingRow label={fmt('zoomToFeature', defaultI18nMessages.zoomToFeature)}>
                        <Switch checked={c.zoomToFeature || false} onChange={this.onBoolChange('zoomToFeature')} />
                    </SettingRow>
                    {zoomEnabled && (
                        <>
                            <SettingRow label={fmt('zoomExpression', defaultI18nMessages.zoomExpression)} />
                            <SettingRow><TextInput size='sm' value={c.zoomExpression || ''} onChange={this.onTextChange('zoomExpression')} onBlur={this.onTextChange('zoomExpression')} onKeyUp={this.onTextChange('zoomExpression')} /></SettingRow>
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
                            <SettingRow><TextInput size='sm' value={c.view_name || ''} onChange={this.onTextChange('view_name')} onBlur={this.onTextChange('view_name')} onKeyUp={this.onTextChange('view_name')} /></SettingRow>
                        </>
                    )}
                </SettingSection>

                {/* ── Checkboxes (unchanged) ────────────────────────────── */}
                <SettingSection title='Checkboxes'>
                    <SettingRow label={fmt('showCheckboxes', defaultI18nMessages.showCheckboxes)}>
                        <Switch checked={c.showCheckboxes || false} onChange={this.onBoolChange('showCheckboxes')} />
                    </SettingRow>
                    {c.showCheckboxes && <SettingRow><div style={hintStyle}>{defaultI18nMessages.showCheckboxesHint}</div></SettingRow>}
                </SettingSection>

                {/* ── Per-row action button toggle (unchanged) ──────────── */}
                <SettingSection title='Per-row action button'>
                    <SettingRow label={fmt('showRowActionButton', defaultI18nMessages.showRowActionButton)}>
                        <Switch checked={c.showRowActionButton || false} onChange={this.onBoolChange('showRowActionButton')} />
                    </SettingRow>
                </SettingSection>

                {/* ── Per-row action button settings ────────────────────── */}
                {c.showRowActionButton && (
                    <SettingSection title={fmt('sectionPerRow', defaultI18nMessages.sectionPerRow)}>

                        <SettingRow label={fmt('buttonCaption', defaultI18nMessages.buttonCaption)} />
                        <SettingRow><TextInput size='sm' value={c.buttonCaption || ''} onChange={this.onTextChange('buttonCaption')} onBlur={this.onTextChange('buttonCaption')} onKeyUp={this.onTextChange('buttonCaption')} /></SettingRow>

                        <SettingRow label='Button action mode' />
                        <SettingRow>
                            <div style={hintStyle}>api: calls an API endpoint when confirmed. navigate: navigates to a page, view or widget.</div>
                            <select style={selectStyle} value={c.rowActionMode || 'api'} onChange={this.onSelectChange('rowActionMode')}>
                                <option value='api'>api: call API endpoint</option>
                                <option value='navigate'>navigate: go to page/view/widget</option>
                            </select>
                        </SettingRow>

                        {/* api mode settings */}
                        {isApiMode && (
                            <>
                                <SettingRow label={fmt('buttonConfirmTitle', defaultI18nMessages.buttonConfirmTitle)} />
                                <SettingRow><TextInput size='sm' value={c.buttonConfirmTitle || ''} onChange={this.onTextChange('buttonConfirmTitle')} onBlur={this.onTextChange('buttonConfirmTitle')} onKeyUp={this.onTextChange('buttonConfirmTitle')} /></SettingRow>

                                <SettingRow label={fmt('buttonConfirmMessage', defaultI18nMessages.buttonConfirmMessage)} />
                                <SettingRow><TextInput size='sm' value={c.buttonConfirmMessage || ''} onChange={this.onTextChange('buttonConfirmMessage')} onBlur={this.onTextChange('buttonConfirmMessage')} onKeyUp={this.onTextChange('buttonConfirmMessage')} /></SettingRow>

                                <SettingRow label={fmt('listButton1APIUrl', defaultI18nMessages.listButton1APIUrl)} />
                                <SettingRow><TextInput size='sm' value={c.listButton1APIUrl || ''} onChange={this.onTextChange('listButton1APIUrl')} onBlur={this.onTextChange('listButton1APIUrl')} onKeyUp={this.onTextChange('listButton1APIUrl')} /></SettingRow>

                                <SettingRow label={fmt('rowActionHttpMethod', defaultI18nMessages.rowActionHttpMethod)} />
                                <SettingRow>
                                    <select style={selectStyle} value={c.rowActionHttpMethod || 'PUT'} onChange={this.onSelectChange('rowActionHttpMethod')}>
                                        <option value='GET'>GET</option>
                                        <option value='POST'>POST</option>
                                        <option value='PUT'>PUT</option>
                                    </select>
                                </SettingRow>

                                <SettingRow label={fmt('rowActionParamMode', defaultI18nMessages.rowActionParamMode)} />
                                <SettingRow>
                                    <div style={hintStyle}>{defaultI18nMessages.rowActionParamModeHint}</div>
                                    <select style={selectStyle} value={c.rowActionParamMode || 'query'} onChange={this.onSelectChange('rowActionParamMode')}>
                                        <option value='query'>query: URL query string</option>
                                        <option value='body'>body: JSON request body</option>
                                    </select>
                                </SettingRow>

                                <SettingRow label={fmt('rowActionFields', defaultI18nMessages.rowActionFields)} />
                                <SettingRow>
                                    <div style={hintStyle}>{defaultI18nMessages.rowActionFieldsHint}</div>
                                    {/* NEW CHANGE: replaced <textarea> with <KeyValueEditor> — improvement #12.
                                        Previously: <textarea value={c.rowActionFields} onChange={onTextAreaChange('rowActionFields')} /> */}
                                    <KeyValueEditor
                                        value={c.rowActionFields || ''}
                                        onChange={this.onKvChange('rowActionFields')}
                                        keyPlaceholder='fieldName'
                                        valuePlaceholder='payloadKey'
                                    />
                                </SettingRow>

                                <SettingRow label={fmt('useUsernameRowAction', defaultI18nMessages.useUsernameRowAction)}>
                                    <Switch checked={c.use_username_for_button_action || false} onChange={this.onBoolChange('use_username_for_button_action')} />
                                </SettingRow>

                                {/* Post-action notification (unchanged except payload field editor) */}
                                <SettingSection title='Post-action notification (optional)'>
                                    <SettingRow><div style={hintStyle}>When enabled, dispatches a notification after a successful API call.</div></SettingRow>
                                    <SettingRow label='Enable post-action notification'>
                                        <Switch checked={postActionEnabled} onChange={this.onBoolChange('enablePostActionNotification')} />
                                    </SettingRow>
                                    {postActionEnabled && (
                                        <>
                                            <SettingRow label='Notification channel name' />
                                            <SettingRow><TextInput size='sm' value={c.postActionNotificationChannel || ''} onChange={this.onTextChange('postActionNotificationChannel')} onBlur={this.onTextChange('postActionNotificationChannel')} onKeyUp={this.onTextChange('postActionNotificationChannel')} /></SettingRow>

                                            <SettingRow label='Payload fields (optional)' />
                                            <SettingRow>
                                                <div style={hintStyle}>One row per field from the clicked row. Leave empty to dispatch an empty payload as a pure success signal.</div>
                                                {/* NEW CHANGE: replaced <textarea> with <KeyValueEditor> — improvement #12.
                                                    Previously: <textarea value={c.postActionPayloadFields} onChange={onTextAreaChange('postActionPayloadFields')} /> */}
                                                <KeyValueEditor
                                                    value={c.postActionPayloadFields || ''}
                                                    onChange={this.onKvChange('postActionPayloadFields')}
                                                    keyPlaceholder='fieldName'
                                                    valuePlaceholder='payloadKey'
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

                                <SettingRow label={fmt('iconFile', defaultI18nMessages.iconFile)} />
                                <SettingRow><TextInput size='sm' value={c.icon_file || ''} onChange={this.onTextChange('icon_file')} onBlur={this.onTextChange('icon_file')} onKeyUp={this.onTextChange('icon_file')} /></SettingRow>
                            </>
                        )}

                        {/* navigate mode settings */}
                        {isNavigateMode && (
                            <>
                                <SettingRow label='Navigation target type' />
                                <SettingRow>
                                    <div style={hintStyle}>page: different page. view: different view within a section. widget: scroll to a widget on this page.</div>
                                    <select style={selectStyle} value={c.navigateTargetType || 'page'} onChange={this.onSelectChange('navigateTargetType')}>
                                        <option value='page'>page: go to a different page</option>
                                        <option value='view'>view: go to a different view</option>
                                        <option value='widget'>widget: scroll to a widget</option>
                                    </select>
                                </SettingRow>

                                <SettingRow label={navigateTargetType === 'page' ? 'Target page name' : navigateTargetType === 'view' ? 'Target view name' : 'Target widget ID'} />
                                <SettingRow>
                                    <div style={hintStyle}>
                                        {navigateTargetType === 'page' && 'The exact page name as it appears in the ExB URL e.g. Review-Map'}
                                        {navigateTargetType === 'view' && 'The exact view name configured in the Section widget'}
                                        {navigateTargetType === 'widget' && 'The widget ID to scroll to e.g. widget_75'}
                                    </div>
                                    <TextInput size='sm' value={c.navigateTarget || ''} onChange={this.onTextChange('navigateTarget')} onBlur={this.onTextChange('navigateTarget')} onKeyUp={this.onTextChange('navigateTarget')} />
                                </SettingRow>

                                <SettingRow label='Show confirmation before navigating'>
                                    <Switch checked={c.showConfirmBeforeNavigate || false} onChange={this.onBoolChange('showConfirmBeforeNavigate')} />
                                </SettingRow>
                                {c.showConfirmBeforeNavigate && (
                                    <>
                                        <SettingRow label='Confirmation popup title' />
                                        <SettingRow><TextInput size='sm' value={c.navigateConfirmTitle || ''} onChange={this.onTextChange('navigateConfirmTitle')} onBlur={this.onTextChange('navigateConfirmTitle')} onKeyUp={this.onTextChange('navigateConfirmTitle')} /></SettingRow>
                                        <SettingRow label='Confirmation popup message' />
                                        <SettingRow><TextInput size='sm' value={c.navigateConfirmMessage || ''} onChange={this.onTextChange('navigateConfirmMessage')} onBlur={this.onTextChange('navigateConfirmMessage')} onKeyUp={this.onTextChange('navigateConfirmMessage')} /></SettingRow>
                                    </>
                                )}

                                <SettingRow label='URL parameters to pass on navigation' />
                                <SettingRow>
                                    <div style={hintStyle}>One row per parameter. Maps row data fields to URL parameters appended to the destination URL.</div>
                                    {/* NEW CHANGE: replaced <textarea> with <KeyValueEditor> — improvement #12.
                                        Previously: <textarea value={c.navigateUrlParams} onChange={onTextAreaChange('navigateUrlParams')} /> */}
                                    <KeyValueEditor
                                        value={c.navigateUrlParams || ''}
                                        onChange={this.onKvChange('navigateUrlParams')}
                                        keyPlaceholder='fieldName'
                                        valuePlaceholder='paramKey'
                                    />
                                </SettingRow>

                                <SettingRow label='Carry token and username to destination'>
                                    <Switch checked={c.navigateCarryUrlParams !== false} onChange={this.onBoolChange('navigateCarryUrlParams')} />
                                </SettingRow>
                                <SettingRow><div style={hintStyle}>When ON, the token and username URL parameters are automatically appended to the destination URL.</div></SettingRow>
                            </>
                        )}
                    </SettingSection>
                )}

                {/* ── Global action button toggle (unchanged) ───────────── */}
                <SettingSection title='Global action button'>
                    <SettingRow label={fmt('showGlobalButton', defaultI18nMessages.showGlobalButton)}>
                        <Switch checked={c.showGlobalButton || false} onChange={this.onBoolChange('showGlobalButton')} />
                    </SettingRow>
                    {c.showGlobalButton && <SettingRow><div style={hintStyle}>{defaultI18nMessages.showGlobalButtonHint}</div></SettingRow>}
                </SettingSection>

                {/* ── Global action button settings ─────────────────────── */}
                {c.showGlobalButton && (
                    <SettingSection title={fmt('sectionGlobal', defaultI18nMessages.sectionGlobal)}>

                        <SettingRow label={fmt('globalButtonCaption', defaultI18nMessages.globalButtonCaption)} />
                        <SettingRow><TextInput size='sm' value={c.globalButtonCaption || ''} onChange={this.onTextChange('globalButtonCaption')} onBlur={this.onTextChange('globalButtonCaption')} onKeyUp={this.onTextChange('globalButtonCaption')} /></SettingRow>

                        <SettingRow label={fmt('globalButtonConfirmTitle', defaultI18nMessages.globalButtonConfirmTitle)} />
                        <SettingRow><TextInput size='sm' value={c.globalButtonConfirmTitle || ''} onChange={this.onTextChange('globalButtonConfirmTitle')} onBlur={this.onTextChange('globalButtonConfirmTitle')} onKeyUp={this.onTextChange('globalButtonConfirmTitle')} /></SettingRow>

                        <SettingRow label={fmt('globalButtonConfirmMessage', defaultI18nMessages.globalButtonConfirmMessage)} />
                        <SettingRow><TextInput size='sm' value={c.globalButtonConfirmMessage || ''} onChange={this.onTextChange('globalButtonConfirmMessage')} onBlur={this.onTextChange('globalButtonConfirmMessage')} onKeyUp={this.onTextChange('globalButtonConfirmMessage')} /></SettingRow>

                        <SettingRow label={fmt('globalButtonAPIUrl', defaultI18nMessages.globalButtonAPIUrl)} />
                        <SettingRow><TextInput size='sm' value={c.globalButtonAPIUrl || ''} onChange={this.onTextChange('globalButtonAPIUrl')} onBlur={this.onTextChange('globalButtonAPIUrl')} onKeyUp={this.onTextChange('globalButtonAPIUrl')} /></SettingRow>

                        <SettingRow label={fmt('globalButtonHttpMethod', defaultI18nMessages.globalButtonHttpMethod)} />
                        <SettingRow>
                            <select style={selectStyle} value={c.globalButtonHttpMethod || 'POST'}
                                onChange={e => this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('globalButtonHttpMethod', e.target.value) })}>
                                <option value='POST'>POST</option>
                                <option value='PUT'>PUT</option>
                            </select>
                        </SettingRow>

                        <SettingRow label='Append username to global action URL'>
                            <Switch checked={c.use_username_for_global_action || false} onChange={this.onBoolChange('use_username_for_global_action')} />
                        </SettingRow>

                        <SettingRow label='Include username in global action payload'>
                            <Switch checked={c.use_username_in_global_payload || false} onChange={this.onBoolChange('use_username_in_global_payload')} />
                        </SettingRow>

                        {/* NEW CHANGE: Minimum rows to activate — improvement #9.
                            Entirely new block. Did not exist before.
                            In widget.tsx this is consumed as:
                                const minRows = props.config.globalButtonMinRows ?? 2
                                const showGlobal = showGlobalBtn && showCheckboxes && checkedCount >= minRows
                            Math.max(1, ...) prevents the value from being set below 1. */}
                        <SettingRow label={fmt('globalButtonMinRows', defaultI18nMessages.globalButtonMinRows)} />
                        <SettingRow>
                            <div style={hintStyle}>{defaultI18nMessages.globalButtonMinRowsHint}</div>
                            <TextInput
                                size='sm'
                                value={String(c.globalButtonMinRows ?? 2)}
                                onChange={evt => this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('globalButtonMinRows', Math.max(1, parseInt(evt.currentTarget.value) || 2))
                                })}
                                onBlur={evt => this.props.onSettingChange({
                                    id: this.props.id,
                                    config: this.props.config.set('globalButtonMinRows', Math.max(1, parseInt(evt.currentTarget.value) || 2))
                                })}
                            />
                        </SettingRow>

                        {/* Payload section */}
                        <SettingSection title={fmt('sectionGlobalPayload', defaultI18nMessages.sectionGlobalPayload)}>

                            <SettingRow label={fmt('globalActionPayloadMode', defaultI18nMessages.globalActionPayloadMode)} />
                            <SettingRow>
                                <div style={hintStyle}>{defaultI18nMessages.globalActionPayloadModeHint}</div>
                                <select style={selectStyle} value={c.globalActionPayloadMode || 'collection'}
                                    onChange={e => this.props.onSettingChange({ id: this.props.id, config: this.props.config.set('globalActionPayloadMode', e.target.value) })}>
                                    <option value='collection'>collection — single object with ID array</option>
                                    <option value='array'>array — one object per checked row</option>
                                </select>
                            </SettingRow>

                            {/* Collection mode (unchanged) */}
                            {payloadMode === 'collection' && (
                                <>
                                    <SettingRow label={fmt('collectionIdField', defaultI18nMessages.collectionIdField)} />
                                    <SettingRow><TextInput size='sm' value={c.collectionIdField || ''} onChange={this.onTextChange('collectionIdField')} onBlur={this.onTextChange('collectionIdField')} onKeyUp={this.onTextChange('collectionIdField')} /></SettingRow>
                                    <SettingRow label={fmt('collectionIdKey', defaultI18nMessages.collectionIdKey)} />
                                    <SettingRow><TextInput size='sm' value={c.collectionIdKey || ''} onChange={this.onTextChange('collectionIdKey')} onBlur={this.onTextChange('collectionIdKey')} onKeyUp={this.onTextChange('collectionIdKey')} /></SettingRow>
                                </>
                            )}

                            {/* Array mode fields */}
                            {payloadMode === 'array' && (
                                <>
                                    <SettingRow label={fmt('globalActionFields', defaultI18nMessages.globalActionFields)} />
                                    <SettingRow>
                                        <div style={hintStyle}>{defaultI18nMessages.globalActionFieldsHint}</div>
                                        {/* NEW CHANGE: replaced <textarea> with <KeyValueEditor> — improvement #12.
                                            Previously: <textarea value={c.globalActionFields} onChange={...} /> */}
                                        <KeyValueEditor
                                            value={c.globalActionFields || ''}
                                            onChange={this.onKvChange('globalActionFields')}
                                            keyPlaceholder='fieldName'
                                            valuePlaceholder='payloadKey'
                                        />
                                    </SettingRow>
                                </>
                            )}

                            {/* Fixed default values — shown for both modes */}
                            <SettingRow label={fmt('globalButtonDefaultValues', defaultI18nMessages.globalButtonDefaultValues)} />
                            <SettingRow>
                                <div style={hintStyle}>{defaultI18nMessages.globalButtonDefaultValuesHint}</div>
                                {/* NEW CHANGE: replaced <textarea> with <KeyValueEditor> — improvement #12.
                                    Previously: <textarea value={c.globalButtonDefaultValues} onChange={...} /> */}
                                <KeyValueEditor
                                    value={c.globalButtonDefaultValues || ''}
                                    onChange={this.onKvChange('globalButtonDefaultValues')}
                                    keyPlaceholder='key'
                                    valuePlaceholder='value'
                                />
                            </SettingRow>

                        </SettingSection>

                    </SettingSection>
                )}

                {/* ── Token validation (unchanged) ──────────────────────── */}
                <SettingSection title={fmt('sectionToken', defaultI18nMessages.sectionToken)}>
                    <SettingRow label={fmt('tokenValidateUrl', defaultI18nMessages.tokenValidateUrl)} />
                    <SettingRow><TextInput size='sm' value={c.tokenValidate_webapiURL || ''} onChange={this.onTextChange('tokenValidate_webapiURL')} onBlur={this.onTextChange('tokenValidate_webapiURL')} onKeyUp={this.onTextChange('tokenValidate_webapiURL')} /></SettingRow>
                    <SettingRow label={fmt('tokenExpiredUrl', defaultI18nMessages.tokenExpiredUrl)} />
                    <SettingRow><TextInput size='sm' value={c.tokenExpired_appUrl || ''} onChange={this.onTextChange('tokenExpired_appUrl')} onBlur={this.onTextChange('tokenExpired_appUrl')} onKeyUp={this.onTextChange('tokenExpired_appUrl')} /></SettingRow>
                </SettingSection>

            </div>
        )
    }
}
