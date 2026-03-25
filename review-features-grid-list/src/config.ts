import { ImmutableObject } from 'seamless-immutable'

export interface Config {
  // Data
  webApiUrl: string
  urlParams: string
  // Columns — comma-separated fieldName:Label pairs e.g. "FeatureCode:Feature Code,ETSAutoStatus:ETS AutoStatus"
  // objectId is NEVER included here — it is never rendered as a column
  columnHeaders: string
  // The field name in the API response that holds the objectId
  // e.g. "objectId" or "OBJECTID" — sent in ETSFeatureSelected payload on row click
  objectIdField: string
  // Map interaction
  zoomToFeature: boolean
  zoomExpression: string
  highlightFeature: boolean
  flashFeature: boolean
  filterLayer: boolean
  // Title
  addTitle: boolean
  list_title: string
  // Pagination
  itemsPerPage: string
  // Notification target widget IDs — widgets to dispatch ETSFeatureSelected to (e.g. ETS Review Form)
  targetWidgetIds: string[]
  // Data filter
  use_username_for_datafilter: boolean
  // Navigation
  useNavigation: boolean
  view_name: string
}

export type IMConfig = ImmutableObject<Config>
