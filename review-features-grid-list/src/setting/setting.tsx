import { React, Immutable, UseDataSource, AllDataSourceTypes } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { MapWidgetSelector, SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { Button, Switch, TextInput } from 'jimu-ui'
import { IMConfig } from '../config'
import defaultI18nMessages from './translations/default'

interface State {
  inputKey: number
}

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, State> {

  // Class property — avoids setState timing issues with the widget ID input
  private targetWidgetIdValue: string = ''

  supportedDsTypes = Immutable([AllDataSourceTypes.FeatureLayer])

  constructor(props) {
    super(props)
    this.state = {
      inputKey: 0
    }
  }

  // ─── Map / Data source ──────────────────────────────────────────────────────

  onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    this.props.onSettingChange({ id: this.props.id, useMapWidgetIds })
  }

  onDataSourceChange = (useDataSources: UseDataSource[]) => {
    if (!useDataSources) return
    this.props.onSettingChange({ id: this.props.id, useDataSources })
  }

  // ─── Generic text / bool change helpers ────────────────────────────────────

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

  // ─── Target widget IDs ──────────────────────────────────────────────────────

  onTargetWidgetIdInput = (evt) => {
    this.targetWidgetIdValue = evt.target.value
  }

  onAddTargetWidgetId = () => {
    const newId = this.targetWidgetIdValue.trim()
    if (!newId) return

    const existing = this.props.config.targetWidgetIds || []
    if (existing.indexOf(newId) === -1) {
      this.props.onSettingChange({
        id: this.props.id,
        config: this.props.config.set('targetWidgetIds', [...Array.from(existing), newId])
      })
    }

    this.targetWidgetIdValue = ''
    this.setState({ inputKey: Date.now() })
  }

  onClearTargetWidgetIds = () => {
    this.targetWidgetIdValue = ''
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('targetWidgetIds', [])
    })
    this.setState({ inputKey: Date.now() })
  }

  getTargetWidgetIds = () => {
    return this.props.config.targetWidgetIds
      ? this.props.config.targetWidgetIds.join(', ')
      : ''
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  render() {
    const c = this.props.config
    const fmt = (id: string, def: string) =>
      this.props.intl.formatMessage({ id, defaultMessage: def })

    return (
      <div>

        {/* Map widget */}
        <SettingSection title={fmt('mapSelector', defaultI18nMessages.mapSelector)}>
          <SettingRow>
            <MapWidgetSelector
              useMapWidgetIds={this.props.useMapWidgetIds}
              onSelect={this.onMapWidgetSelected}
            />
          </SettingRow>
        </SettingSection>

        {/* Data source */}
        <SettingSection title={fmt('selectDataSource', defaultI18nMessages.selectDataSource)}>
          <SettingRow>
            <DataSourceSelector
              types={this.supportedDsTypes}
              useDataSourcesEnabled
              mustUseDataSource
              useDataSources={this.props.useDataSources}
              onChange={this.onDataSourceChange}
              widgetId={this.props.id}
              hideDataView={true}
              isMultiple={true}
            />
          </SettingRow>
        </SettingSection>

        {/* Data settings */}
        <SettingSection title='Data'>
          <SettingRow label={fmt('webApiUrl', defaultI18nMessages.webApiUrl)} />
          <SettingRow>
            <TextInput size='sm' value={c.webApiUrl || ''}
              onChange={this.onTextChange('webApiUrl')}
              onBlur={this.onTextChange('webApiUrl')}
              onKeyUp={this.onTextChange('webApiUrl')}
            />
          </SettingRow>
          <SettingRow label={fmt('urlParameterExpression', defaultI18nMessages.urlParameterExpression)} />
          <SettingRow>
            <TextInput size='sm' value={c.urlParams || ''}
              onChange={this.onTextChange('urlParams')}
              onBlur={this.onTextChange('urlParams')}
              onKeyUp={this.onTextChange('urlParams')}
            />
          </SettingRow>
          <SettingRow label={fmt('useUsernameDataFilter', defaultI18nMessages.useUsernameDataFilter)}>
            <Switch
              checked={c.use_username_for_datafilter || false}
              onChange={this.onBoolChange('use_username_for_datafilter')}
            />
          </SettingRow>
          <SettingRow label='Items per page:' />
          <SettingRow>
            <TextInput size='sm' value={c.itemsPerPage || '10'}
              onChange={this.onTextChange('itemsPerPage')}
              onBlur={this.onTextChange('itemsPerPage')}
              onKeyUp={this.onTextChange('itemsPerPage')}
            />
          </SettingRow>
        </SettingSection>

        {/* Column configuration */}
        <SettingSection title='Columns'>
          <SettingRow label={fmt('columnHeaders', defaultI18nMessages.columnHeaders)} />
          <SettingRow>
            <TextInput size='sm' value={c.columnHeaders || ''}
              onChange={this.onTextChange('columnHeaders')}
              onBlur={this.onTextChange('columnHeaders')}
              onKeyUp={this.onTextChange('columnHeaders')}
            />
          </SettingRow>
          <SettingRow label={fmt('objectIdField', defaultI18nMessages.objectIdField)} />
          <SettingRow>
            <TextInput size='sm' value={c.objectIdField || 'objectId'}
              onChange={this.onTextChange('objectIdField')}
              onBlur={this.onTextChange('objectIdField')}
              onKeyUp={this.onTextChange('objectIdField')}
            />
          </SettingRow>
        </SettingSection>

        {/* Title */}
        <SettingSection title='Title'>
          <SettingRow label={fmt('addTitle', defaultI18nMessages.addTitle)}>
            <Switch
              checked={c.addTitle || false}
              onChange={this.onBoolChange('addTitle')}
            />
          </SettingRow>
          <SettingRow label={fmt('list_title', defaultI18nMessages.list_title)} />
          <SettingRow>
            <TextInput size='sm' value={c.list_title || ''}
              onChange={this.onTextChange('list_title')}
              onBlur={this.onTextChange('list_title')}
              onKeyUp={this.onTextChange('list_title')}
            />
          </SettingRow>
        </SettingSection>

        {/* Map interaction */}
        <SettingSection title='Map interaction'>
          <SettingRow label={fmt('zoomToFeature', defaultI18nMessages.zoomToFeature)}>
            <Switch
              checked={c.zoomToFeature || false}
              onChange={this.onBoolChange('zoomToFeature')}
            />
          </SettingRow>
          <SettingRow label={fmt('zoomExpression', defaultI18nMessages.zoomExpression)} />
          <SettingRow>
            <TextInput size='sm' value={c.zoomExpression || ''}
              onChange={this.onTextChange('zoomExpression')}
              onBlur={this.onTextChange('zoomExpression')}
              onKeyUp={this.onTextChange('zoomExpression')}
            />
          </SettingRow>
          <SettingRow label={fmt('highlightFeature', defaultI18nMessages.highlightFeature)}>
            <Switch
              checked={c.highlightFeature || false}
              onChange={this.onBoolChange('highlightFeature')}
            />
          </SettingRow>
          <SettingRow label={fmt('flashFeature', defaultI18nMessages.flashFeature)}>
            <Switch
              checked={c.flashFeature || false}
              onChange={this.onBoolChange('flashFeature')}
            />
          </SettingRow>
          <SettingRow label={fmt('filterLayer', defaultI18nMessages.filterLayer)}>
            <Switch
              checked={c.filterLayer || false}
              onChange={this.onBoolChange('filterLayer')}
            />
          </SettingRow>
        </SettingSection>

        {/* Navigation */}
        <SettingSection title='Navigation'>
          <SettingRow label={fmt('useNavigation', defaultI18nMessages.useNavigation)}>
            <Switch
              checked={c.useNavigation || false}
              onChange={this.onBoolChange('useNavigation')}
            />
          </SettingRow>
          <SettingRow label={fmt('viewName', defaultI18nMessages.viewName)} />
          <SettingRow>
            <TextInput size='sm' value={c.view_name || ''}
              onChange={this.onTextChange('view_name')}
              onBlur={this.onTextChange('view_name')}
              onKeyUp={this.onTextChange('view_name')}
            />
          </SettingRow>
        </SettingSection>

        {/* Notification target widget IDs */}
        <SettingSection title={fmt('targetWidgetIds', defaultI18nMessages.targetWidgetIds)}>
          <SettingRow>
            <label style={{ fontSize: '12px' }}>
              Current Widget ID: {this.props.widgetId}
            </label>
          </SettingRow>
          <SettingRow>
            <label style={{ fontSize: '12px' }}>
              Target Widget IDs: {this.getTargetWidgetIds()}
            </label>
          </SettingRow>
          <SettingRow label={fmt('enterWidgetId', defaultI18nMessages.enterWidgetId)} />
          <SettingRow>
            <input
              key={this.state.inputKey}
              type='text'
              style={{
                width: '100%',
                padding: '4px 6px',
                fontSize: '13px',
                color: '#333',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '0'
              }}
              onChange={this.onTargetWidgetIdInput}
              onInput={this.onTargetWidgetIdInput}
              placeholder='Enter widget ID...'
            />
          </SettingRow>
          <SettingRow>
            <Button size='default' type='primary' onClick={this.onAddTargetWidgetId}>Add</Button>
          </SettingRow>
          <SettingRow>
            <Button size='default' type='primary' onClick={this.onClearTargetWidgetIds}>Clear</Button>
          </SettingRow>
        </SettingSection>

      </div>
    )
  }
}
