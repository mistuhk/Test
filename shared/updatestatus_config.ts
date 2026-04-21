import { ImmutableObject } from 'seamless-immutable'

export interface Config {
  buttonCaption: string
  targetWidgetIds: string[]
  icon_file: string
  button_action_url: string
  button_action_params: string
  useNavigation: boolean
  view_name: string
  api_success_message?: string
  api_failure_message?: string

  // NEW CHANGE: channel name to listen on for grid data loaded events — Request 2.
  // When a notification arrives on this channel the widget reads payload.count
  // and shows the main button if count >= 1, hides it otherwise.
  // Defaults to 'GridDataLoaded' to match the custom-grid-list default.
  gridDataListenChannel: string
}

export type IMConfig = ImmutableObject<Config>
