import { React, jsx, Immutable, UseDataSource, JimuFieldType, AllDataSourceTypes, FormattedMessage } from "jimu-core";
import { AllWidgetSettingProps } from "jimu-for-builder";
import { DataSourceSelector, FieldSelector } from "jimu-ui/advanced/data-source-selector";
import { MapWidgetSelector } from 'jimu-ui/advanced/setting-components'
import {
  SettingSection,
  SettingRow
} from "jimu-ui/advanced/setting-components";
import { Button, Switch, TextInput } from "jimu-ui";
import { IMConfig } from "../config";
import defaultI18nMessages from "./translations/default";
import { SearchOutlined } from 'jimu-icons/outlined/editor/search'
import { useState, useCallback } from "react";

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {

  const [newTargetWidgetId, setNewTargetWidgetId] = useState("");

  /** --- General Handlers --- */
  const updateConfig = useCallback(
    (key: keyof IMConfig, value: any) => {
      props.onSettingChange({
        id: props.id,
        config: props.config.set(key, value)
      });
    },
    [props]
  );

  /** --- Input handlers --- */
  const onButtonCaptionChange = (e: React.FormEvent<HTMLInputElement>) =>
    updateConfig("buttonCaption", e.currentTarget.value);

  const onIconChange = (e: React.FormEvent<HTMLInputElement>) =>
    updateConfig("icon_file", e.currentTarget.value);

  const onButtonActionUrlChange = (e: React.FormEvent<HTMLInputElement>) =>
    updateConfig("button_action_url", e.currentTarget.value);

  const onButtonActionParamChange = (e: React.FormEvent<HTMLInputElement>) =>
    updateConfig("button_action_params", e.currentTarget.value);

  const onUseNavigationView = (e: React.FormEvent<HTMLInputElement>) =>
    updateConfig("useNavigation", e.currentTarget.checked);

  const onViewNameChange = (e: React.FormEvent<HTMLInputElement>) =>
    updateConfig("view_name", e.currentTarget.value);

  const onApiSuccessMsgChange = (e: React.FormEvent<HTMLInputElement>) =>
    updateConfig("api_success_message", e.currentTarget.value);

  const onApiFailureMsgChange = (e: React.FormEvent<HTMLInputElement>) =>
    updateConfig("api_failure_message", e.currentTarget.value);

  /** Widget ID handling **/
  const getWidgetIds = () =>
    props.config.targetWidgetIds ? props.config.targetWidgetIds.join(",") : "";

  const onAddWidgetId = () => {
    let newWidgetIds = props.config.targetWidgetIds
      ? [...props.config.targetWidgetIds]
      : [];

    if (!newWidgetIds.includes(newTargetWidgetId)) {
      newWidgetIds.push(newTargetWidgetId);
    }

    updateConfig("targetWidgetIds", newWidgetIds);
    setNewTargetWidgetId("");
  };

  const onClearWidgetIds = () => {
    updateConfig("targetWidgetIds", []);
  };

  return (
    <div>
      <div className="widget-setting-simple-button">

        {/* BUTTON SETTINGS */}
        <SettingSection className="add-button-setting" role="group">

          <SettingRow label="Button Settings" />

          <SettingRow label={defaultI18nMessages.buttonCaption} />
          <TextInput
            className="list-button-text"
            value={props.config.buttonCaption || ""}
            size="sm"
            onChange={onButtonCaptionChange}
            onBlur={onButtonCaptionChange}
          />

          <SettingRow label={defaultI18nMessages.icon_file_caption} />
          <TextInput
            className="list-button-icon"
            value={props.config.icon_file || ""}
            size="sm"
            onChange={onIconChange}
          />

          <SettingRow label="Backend Web API URL" />
          <TextInput
            value={props.config.button_action_url || ""}
            size="sm"
            onChange={onButtonActionUrlChange}
          />

          <SettingRow label="Backend Web API Params" />
          <TextInput
            value={props.config.button_action_params || ""}
            size="sm"
            onChange={onButtonActionParamChange}
          />

        </SettingSection>

        {/* NAVIGATION SETTINGS */}
        <SettingSection className="navigate-view-setting">
          <SettingRow label="Navigate to Home Page" />
          <Switch
            checked={props.config.useNavigation || false}
            onChange={onUseNavigationView}
          />

          <SettingRow label="Page name :" />
          <TextInput
            className="view-name-text"
            value={props.config.view_name}
            size="sm"
            onChange={onViewNameChange}
          />
        </SettingSection>

        {/* TARGET WIDGETS */}
        <SettingSection className="add-widget-id-setting">
          <label>
            <FormattedMessage id="current-widget-id" defaultMessage="Current Widget Id: " />
            {props.widgetId}
          </label>

          <label>
            <FormattedMessage id="target-widget-id" defaultMessage="Target Widgets Ids: " />
            {getWidgetIds()}
          </label>

          <SettingRow>
            <label>Enter new widget id</label>
          </SettingRow>

          <SettingRow>
            <TextInput
              className="target-widget-text"
              size="sm"
              value={newTargetWidgetId}
              onChange={(e) => setNewTargetWidgetId(e.currentTarget.value)}
            />
          </SettingRow>

          <SettingRow>
            <Button size="default" type="primary" onClick={onAddWidgetId}>
              Add
            </Button>
          </SettingRow>

          <SettingRow>
            <Button size="default" type="primary" onClick={onClearWidgetIds}>
              Clear
            </Button>
          </SettingRow>
        </SettingSection>

        {/* API MESSAGES */}
        <SettingSection className="api-message-setting">

          <SettingRow label="API Success Message" />
          <TextInput
            className="api-success-message"
            size="sm"
            value={props.config.api_success_message || ""}
            onChange={onApiSuccessMsgChange}
          />
          <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>
            This message appears in an alert when the API call succeeds.
          </div>

          <SettingRow label="API Failure Message" />
          <TextInput
            className="api-failure-message"
            size="sm"
            value={props.config.api_failure_message || ""}
            onChange={onApiFailureMsgChange}
          />
          <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>
            This message appears in an alert when the API call fails.
          </div>

        </SettingSection>

        {/* NEW CHANGE: Grid data visibility — Request 2.
            Configures which channel name this widget listens on to receive
            the row count from a custom-grid-list instance.
            Must match the 'On data loaded: channel name' configured on the grid. */}
        <SettingSection className="grid-data-loaded-setting">

          <SettingRow label="Grid data loaded channel" />
          <TextInput
            size="sm"
            value={props.config.gridDataListenChannel || 'GridDataLoaded'}
            onChange={e => updateConfig('gridDataListenChannel', e.currentTarget.value)}
            onBlur={e => updateConfig('gridDataListenChannel', e.currentTarget.value)}
          />
          <div style={{ fontSize: 12, color: "#6b6b6b", marginTop: 4 }}>
            Channel name to listen on for grid row count. Must match the
            &lsquo;On data loaded&rsquo; channel configured on the grid widget.
            The main button is hidden when the grid reports 0 rows.
          </div>

        </SettingSection>

      </div>
    </div>
  );
}
