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

  private targetWidgetIdValue: string = ''

  supportedDsTypes = Immutable([AllDataSourceTypes.FeatureLayer])

  constructor(props) {
    super(props)
    this.state = {
      inputKey: 0
    }
  }

  onMapWidgetSelected = (useMapWidgetIds: string[]) => {
    this.props.onSettingChange({
      id: this.props.id,
      useMapWidgetIds: useMapWidgetIds
    })
  }

  onDataSourceChange = (useDataSources: UseDataSource[]) => {
    if (!useDataSources) return
    this.props.onSettingChange({
      id: this.props.id,
      useDataSources: useDataSources
    })
  }

  onTargetWidgetIdChange = (evt) => {
    this.targetWidgetIdValue = evt.target.value
  }

  onAddTargetWidgetId = () => {
    const newId = this.targetWidgetIdValue.trim()
    if (!newId) return

    const existing = this.props.config.notificationTargetWidgetIds || []
    if (existing.indexOf(newId) === -1) {
      const updated = [...Array.from(existing), newId]
      this.props.onSettingChange({
        id: this.props.id,
        config: this.props.config.set('notificationTargetWidgetIds', updated)
      })
    }

    this.targetWidgetIdValue = ''
    this.setState({ inputKey: Date.now() })
  }

  onClearTargetWidgetIds = () => {
    this.targetWidgetIdValue = ''
    this.props.onSettingChange({
      id: this.props.id,
      config: this.props.config.set('notificationTargetWidgetIds', [])
    })
    this.setState({ inputKey: Date.now() })
  }

  getTargetWidgetIds = () => {
    return this.props.config.notificationTargetWidgetIds
      ? this.props.config.notificationTargetWidgetIds.join(', ')
      : ''
  }

  render() {
    const c = this.props.config

    // reviewTimeAsEpoch defaults to true (Date field) when not yet saved in config
    const reviewTimeAsEpoch = c.reviewTimeAsEpoch !== false

    return (
      <div>
        <SettingSection
          className="map-selector-section"
          title={this.props.intl.formatMessage({
            id: 'selectMapWidget',
            defaultMessage: defaultI18nMessages.selectMapWidget
          })}
        >
          <SettingRow>
            <MapWidgetSelector
              useMapWidgetIds={this.props.useMapWidgetIds}
              onSelect={this.onMapWidgetSelected}
            />
          </SettingRow>
        </SettingSection>

        <SettingSection
          className="data-source-selector-section"
          title={this.props.intl.formatMessage({
            id: 'selectDataSource',
            defaultMessage: defaultI18nMessages.selectDataSource
          })}
        >
          <SettingRow>
            <DataSourceSelector
              types={this.supportedDsTypes}
              useDataSourcesEnabled
              mustUseDataSource
              useDataSources={this.props.useDataSources}
              onChange={this.onDataSourceChange}
              widgetId={this.props.id}
              hideDataView={true}
              isMultiple={false}
            />
          </SettingRow>
        </SettingSection>

        {/* NEW CHANGE: Display settings — show/hide title bar, same pattern as custom-grid-list.
            showTitle defaults to true (=== false check) so existing instances without the
            field saved yet continue to show the header without any migration needed. */}
        <SettingSection
          className="display-section"
          title="Display"
        >
          <SettingRow label="Show title bar">
            <Switch
              checked={c.showTitle !== false}
              onChange={(evt) => {
                this.props.onSettingChange({
                  id: this.props.id,
                  config: this.props.config.set('showTitle', evt.currentTarget.checked)
                })
              }}
            />
          </SettingRow>

          {c.showTitle !== false && (
            <>
              <SettingRow label="Title text" />
              <SettingRow>
                <TextInput
                  size="sm"
                  value={c.titleText || ''}
                  placeholder="e.g. ETS Review Form"
                  onChange={(evt) => {
                    this.props.onSettingChange({
                      id: this.props.id,
                      config: this.props.config.set('titleText', evt.currentTarget.value)
                    })
                  }}
                  onBlur={(evt) => {
                    this.props.onSettingChange({
                      id: this.props.id,
                      config: this.props.config.set('titleText', evt.currentTarget.value)
                    })
                  }}
                />
              </SettingRow>
              <SettingRow>
                <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Arial' }}>
                  Leave blank to use the default: &ldquo;ETS Review Form&rdquo;
                </div>
              </SettingRow>
            </>
          )}
        </SettingSection>

        {/* NEW CHANGE: ETSReviewTime field type toggle.
            Controls how the timestamp value is written to the feature layer.
            ON  → Date.now() (milliseconds) — use when ETSReviewTime is an ArcGIS Date field
            OFF → new Date().toISOString() (UTC ISO string) — use when it is a String field
            Try ON first. If ETSReviewTime shows no value after saving, switch to OFF. */}
        <SettingSection
          className="audit-fields-section"
          title="Audit fields (ETSReviewer + ETSReviewTime)"
        >
          <SettingRow>
            <div style={{ fontSize: '12px', color: '#555', fontFamily: 'Arial', lineHeight: 1.5 }}>
              On update, <strong>ETSReviewer</strong> is written from the page URL
              <code> ?username=</code> parameter, and <strong>ETSReviewTime</strong> is
              written as the current UTC timestamp.
            </div>
          </SettingRow>

          <SettingRow label="ETSReviewTime is a Date field (not String)">
            <Switch
              checked={reviewTimeAsEpoch}
              onChange={(evt) => {
                this.props.onSettingChange({
                  id: this.props.id,
                  config: this.props.config.set('reviewTimeAsEpoch', evt.currentTarget.checked)
                })
              }}
            />
          </SettingRow>

          <SettingRow>
            <div style={{ fontSize: '11px', color: '#888', fontFamily: 'Arial', lineHeight: 1.5 }}>
              <strong>ON</strong> — writes milliseconds since epoch e.g. <code>1718000000000</code>.
              Required when the field type is <em>Date</em> in ArcGIS.
              <br />
              <strong>OFF</strong> — writes a UTC ISO string e.g.{' '}
              <code>2024-06-10T12:00:00.000Z</code>.
              Required when the field type is <em>String</em>.
              <br />
              Start with ON. If the field saves blank, switch to OFF.
            </div>
          </SettingRow>
        </SettingSection>

        <SettingSection
          className="notification-target-widgets-section"
          title={this.props.intl.formatMessage({
            id: 'notificationTargets',
            defaultMessage: defaultI18nMessages.notificationTargets
          })}
        >
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
          <SettingRow>
            <label style={{ fontSize: '12px' }}>
              {this.props.intl.formatMessage({
                id: 'enterTargetWidgetId',
                defaultMessage: defaultI18nMessages.enterTargetWidgetId
              })}
            </label>
          </SettingRow>
          <SettingRow>
            <input
              key={this.state.inputKey}
              type="text"
              style={{
                width: '100%',
                padding: '4px 6px',
                fontSize: '13px',
                color: '#333',
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '0'
              }}
              onChange={this.onTargetWidgetIdChange}
              onInput={this.onTargetWidgetIdChange}
              placeholder="Enter widget ID..."
            />
          </SettingRow>
          <SettingRow>
            <Button size='default' type='primary' onClick={this.onAddTargetWidgetId}>
              Add
            </Button>
          </SettingRow>
          <SettingRow>
            <Button size='default' type='primary' onClick={this.onClearTargetWidgetIds}>
              Clear
            </Button>
          </SettingRow>
        </SettingSection>
      </div>
    )
  }
}
