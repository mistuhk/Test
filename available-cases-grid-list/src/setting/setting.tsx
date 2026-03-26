import { React, Immutable, UseDataSource, AllDataSourceTypes } from 'jimu-core'
import { AllWidgetSettingProps } from 'jimu-for-builder'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import { SettingSection, SettingRow } from 'jimu-ui/advanced/setting-components'
import { Switch, TextInput } from 'jimu-ui'
import { IMConfig } from '../config'
import defaultI18nMessages from './translations/default'

const hintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#888',
  lineHeight: '1.4',
  marginBottom: '4px'
}

interface State {
  inputKey: number
}

export default class Setting extends React.PureComponent<AllWidgetSettingProps<IMConfig>, State> {

  supportedDsTypes = Immutable([AllDataSourceTypes.FeatureLayer])

  constructor(props) {
    super(props)
    this.state = { inputKey: 0 }
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

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

  fmt = (id: string, def: string) =>
    this.props.intl.formatMessage({ id, defaultMessage: def })

  // ─── Render ───────────────────────────────────────────────────────────────────

  render() {
    const c = this.props.config

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
              isMultiple={false}
            />
          </SettingRow>
        </SettingSection>

        {/* Data */}
        <SettingSection title={this.fmt('sectionData', defaultI18nMessages.sectionData)}>

          <SettingRow label={this.fmt('webApiUrl', defaultI18nMessages.webApiUrl)} />
          <SettingRow>
            <TextInput size='sm' value={c.webApiUrl || ''}
              onChange={this.onTextChange('webApiUrl')}
              onBlur={this.onTextChange('webApiUrl')}
              onKeyUp={this.onTextChange('webApiUrl')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('urlParams', defaultI18nMessages.urlParams)} />
          <SettingRow>
            <TextInput size='sm' value={c.urlParams || ''}
              onChange={this.onTextChange('urlParams')}
              onBlur={this.onTextChange('urlParams')}
              onKeyUp={this.onTextChange('urlParams')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('columnHeaders', defaultI18nMessages.columnHeaders)} />
          <SettingRow>
            <div style={hintStyle}>{defaultI18nMessages.columnHeadersHint}</div>
            <TextInput size='sm' value={c.columnHeaders || ''}
              onChange={this.onTextChange('columnHeaders')}
              onBlur={this.onTextChange('columnHeaders')}
              onKeyUp={this.onTextChange('columnHeaders')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('itemsPerPage', defaultI18nMessages.itemsPerPage)} />
          <SettingRow>
            <TextInput size='sm' value={c.itemsPerPage || '10'}
              onChange={this.onTextChange('itemsPerPage')}
              onBlur={this.onTextChange('itemsPerPage')}
              onKeyUp={this.onTextChange('itemsPerPage')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('useUsernameDataFilter', defaultI18nMessages.useUsernameDataFilter)}>
            <Switch
              checked={c.use_username_for_datafilter || false}
              onChange={this.onBoolChange('use_username_for_datafilter')}
            />
          </SettingRow>

        </SettingSection>

        {/* Display */}
        <SettingSection title={this.fmt('sectionDisplay', defaultI18nMessages.sectionDisplay)}>

          <SettingRow label={this.fmt('showButtons', defaultI18nMessages.showButtons)}>
            <Switch
              checked={c.showButtons || false}
              onChange={this.onBoolChange('showButtons')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('addTitle', defaultI18nMessages.addTitle)}>
            <Switch
              checked={c.addTitle || false}
              onChange={this.onBoolChange('addTitle')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('listTitle', defaultI18nMessages.listTitle)} />
          <SettingRow>
            <TextInput size='sm' value={c.list_title || ''}
              onChange={this.onTextChange('list_title')}
              onBlur={this.onTextChange('list_title')}
              onKeyUp={this.onTextChange('list_title')}
            />
          </SettingRow>

        </SettingSection>

        {/* Per-row action button */}
        <SettingSection title={this.fmt('sectionPerRowButton', defaultI18nMessages.sectionPerRowButton)}>

          <SettingRow label={this.fmt('buttonCaption', defaultI18nMessages.buttonCaption)} />
          <SettingRow>
            <TextInput size='sm' value={c.buttonCaption || ''}
              onChange={this.onTextChange('buttonCaption')}
              onBlur={this.onTextChange('buttonCaption')}
              onKeyUp={this.onTextChange('buttonCaption')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('buttonConfirmTitle', defaultI18nMessages.buttonConfirmTitle)} />
          <SettingRow>
            <TextInput size='sm' value={c.buttonConfirmTitle || ''}
              onChange={this.onTextChange('buttonConfirmTitle')}
              onBlur={this.onTextChange('buttonConfirmTitle')}
              onKeyUp={this.onTextChange('buttonConfirmTitle')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('buttonConfirmMessage', defaultI18nMessages.buttonConfirmMessage)} />
          <SettingRow>
            <TextInput size='sm' value={c.buttonConfirmMessage || ''}
              onChange={this.onTextChange('buttonConfirmMessage')}
              onBlur={this.onTextChange('buttonConfirmMessage')}
              onKeyUp={this.onTextChange('buttonConfirmMessage')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('listButton1APIUrl', defaultI18nMessages.listButton1APIUrl)} />
          <SettingRow>
            <TextInput size='sm' value={c.listButton1APIUrl || ''}
              onChange={this.onTextChange('listButton1APIUrl')}
              onBlur={this.onTextChange('listButton1APIUrl')}
              onKeyUp={this.onTextChange('listButton1APIUrl')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('button1ParamExpression', defaultI18nMessages.button1ParamExpression)} />
          <SettingRow>
            <TextInput size='sm' value={c.button1ParamExpression || ''}
              onChange={this.onTextChange('button1ParamExpression')}
              onBlur={this.onTextChange('button1ParamExpression')}
              onKeyUp={this.onTextChange('button1ParamExpression')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('iconFile', defaultI18nMessages.iconFile)} />
          <SettingRow>
            <TextInput size='sm' value={c.icon_file || ''}
              onChange={this.onTextChange('icon_file')}
              onBlur={this.onTextChange('icon_file')}
              onKeyUp={this.onTextChange('icon_file')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('useUsernameRowAction', defaultI18nMessages.useUsernameRowAction)}>
            <Switch
              checked={c.use_username_for_button_action || false}
              onChange={this.onBoolChange('use_username_for_button_action')}
            />
          </SettingRow>

        </SettingSection>

        {/* Global action button */}
        <SettingSection title={this.fmt('sectionGlobalButton', defaultI18nMessages.sectionGlobalButton)}>

          <SettingRow label={this.fmt('globalButtonCaption', defaultI18nMessages.globalButtonCaption)} />
          <SettingRow>
            <TextInput size='sm' value={c.globalButtonCaption || ''}
              onChange={this.onTextChange('globalButtonCaption')}
              onBlur={this.onTextChange('globalButtonCaption')}
              onKeyUp={this.onTextChange('globalButtonCaption')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('globalButtonConfirmTitle', defaultI18nMessages.globalButtonConfirmTitle)} />
          <SettingRow>
            <TextInput size='sm' value={c.globalButtonConfirmTitle || ''}
              onChange={this.onTextChange('globalButtonConfirmTitle')}
              onBlur={this.onTextChange('globalButtonConfirmTitle')}
              onKeyUp={this.onTextChange('globalButtonConfirmTitle')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('globalButtonConfirmMessage', defaultI18nMessages.globalButtonConfirmMessage)} />
          <SettingRow>
            <TextInput size='sm' value={c.globalButtonConfirmMessage || ''}
              onChange={this.onTextChange('globalButtonConfirmMessage')}
              onBlur={this.onTextChange('globalButtonConfirmMessage')}
              onKeyUp={this.onTextChange('globalButtonConfirmMessage')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('globalButtonAPIUrl', defaultI18nMessages.globalButtonAPIUrl)} />
          <SettingRow>
            <TextInput size='sm' value={c.globalButtonAPIUrl || ''}
              onChange={this.onTextChange('globalButtonAPIUrl')}
              onBlur={this.onTextChange('globalButtonAPIUrl')}
              onKeyUp={this.onTextChange('globalButtonAPIUrl')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('globalButtonPayloadFields', defaultI18nMessages.globalButtonPayloadFields)} />
          <SettingRow>
            <div style={hintStyle}>{defaultI18nMessages.globalButtonPayloadFieldsHint}</div>
            <TextInput size='sm' value={c.globalButtonPayloadFields || ''}
              onChange={this.onTextChange('globalButtonPayloadFields')}
              onBlur={this.onTextChange('globalButtonPayloadFields')}
              onKeyUp={this.onTextChange('globalButtonPayloadFields')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('globalButtonDefaultValues', defaultI18nMessages.globalButtonDefaultValues)} />
          <SettingRow>
            <div style={hintStyle}>{defaultI18nMessages.globalButtonDefaultValuesHint}</div>
            <TextInput size='sm' value={c.globalButtonDefaultValues || ''}
              onChange={this.onTextChange('globalButtonDefaultValues')}
              onBlur={this.onTextChange('globalButtonDefaultValues')}
              onKeyUp={this.onTextChange('globalButtonDefaultValues')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('globalButtonHttpMethod', defaultI18nMessages.globalButtonHttpMethod)} />
          <SettingRow>
            <TextInput size='sm' value={c.globalButtonHttpMethod || 'POST'}
              onChange={this.onTextChange('globalButtonHttpMethod')}
              onBlur={this.onTextChange('globalButtonHttpMethod')}
              onKeyUp={this.onTextChange('globalButtonHttpMethod')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('useUsernameGlobalAction', defaultI18nMessages.useUsernameGlobalAction)}>
            <Switch
              checked={c.use_username_for_global_action || false}
              onChange={this.onBoolChange('use_username_for_global_action')}
            />
          </SettingRow>

        </SettingSection>

        {/* Token validation */}
        <SettingSection title={this.fmt('sectionToken', defaultI18nMessages.sectionToken)}>

          <SettingRow label={this.fmt('tokenValidateUrl', defaultI18nMessages.tokenValidateUrl)} />
          <SettingRow>
            <TextInput size='sm' value={c.tokenValidate_webapiURL || ''}
              onChange={this.onTextChange('tokenValidate_webapiURL')}
              onBlur={this.onTextChange('tokenValidate_webapiURL')}
              onKeyUp={this.onTextChange('tokenValidate_webapiURL')}
            />
          </SettingRow>

          <SettingRow label={this.fmt('tokenExpiredUrl', defaultI18nMessages.tokenExpiredUrl)} />
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
