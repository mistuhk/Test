import { ImmutableObject } from 'seamless-immutable'

export interface Config {

  // ─── Data ────────────────────────────────────────────────────────────────────

  // API endpoint to fetch data from
  webApiUrl: string

  // URL filter expression — supports {placeholder} tokens resolved from page URL
  // e.g. 'caseId={caseId}' or 'crn={crn}'
  urlParams: string

  // Comma-separated fieldName:Label pairs defining which columns to render
  // e.g. 'caseId:Case ID,crn:CRN,fileRefNo:File Ref No'
  columnHeaders: string

  // Number of rows to display per page
  itemsPerPage: string

  // When true, appends &username={username} from the page URL to the data fetch request
  use_username_for_datafilter: boolean

  // ─── Display ─────────────────────────────────────────────────────────────────

  addTitle: boolean
  list_title: string

  // ─── Row click — dispatch notification ───────────────────────────────────────

  // When true, clicking a row dispatches a notification to all targetWidgetIds
  enableRowDispatch: boolean

  // Notification channel name dispatched on row click e.g. 'ETSFeatureSelected'
  dispatchNotificationChannel: string

  // Field in the row data whose value is read for the dispatch payload e.g. 'objectId'
  dispatchPayloadField: string

  // Key name used in the dispatched payload object
  // e.g. 'objectId' produces { objectId: 1001 }
  // e.g. 'featureId' produces { featureId: 1001 }
  dispatchPayloadKey: string

  // Widget IDs to dispatch the row click notification to
  targetWidgetIds: string[]

  // ─── Listen — incoming notification ──────────────────────────────────────────

  // Notification channel name to listen on e.g. 'ETSReviewStatusUpdated'
  // Leave empty to disable listening
  listenNotificationChannel: string

  // Action to perform when the configured notification is received
  // 'refresh'  — reload data from the API
  // 'populate' — forward the received payload to populateTargetWidgetIds
  listenAction: 'refresh' | 'populate'

  // Only used when listenAction = 'populate'
  // Channel name to dispatch the received payload on
  populateNotificationChannel: string

  // Widget IDs to dispatch the populate payload to
  populateTargetWidgetIds: string[]

  // ─── Map interaction ──────────────────────────────────────────────────────────
  // Only active when enableRowDispatch is true

  zoomToFeature: boolean
  zoomExpression: string     // SQL expression e.g. 'OBJECTID = {objectId}'
  highlightFeature: boolean
  flashFeature: boolean
  filterLayer: boolean
  useNavigation: boolean
  view_name: string

  // ─── Action buttons ───────────────────────────────────────────────────────────
  // Individual toggles — each controls its own UI element independently
  // Note: showGlobalButton at runtime also requires showCheckboxes to be true,
  // since rows must be checkable before a global action is meaningful
  showCheckboxes: boolean
  showRowActionButton: boolean
  showGlobalButton: boolean

  // ─── Per-row action button ────────────────────────────────────────────────────

  buttonCaption: string
  buttonConfirmTitle: string
  buttonConfirmMessage: string
  listButton1APIUrl: string

  // HTTP method for the per-row action request
  rowActionHttpMethod: 'GET' | 'POST' | 'PUT'

  // How parameters are sent in the per-row action request
  // 'query' — URL query string e.g. ?caseId=1&username=x  (for [FromQuery] APIs)
  // 'body'  — JSON request body
  rowActionParamMode: 'query' | 'body'

  // Comma-separated fieldName:payloadKey pairs for the per-row action request
  // e.g. 'caseId:caseId,crn:crn'
  // query mode: ?caseId=1001&crn=A0045523
  // body mode:  { "caseId": 1001, "crn": "A0045523" }
  rowActionFields: string

  icon_file: string
  use_username_for_button_action: boolean

  // ─── Global action button ─────────────────────────────────────────────────────

  globalButtonCaption: string
  globalButtonConfirmTitle: string
  globalButtonConfirmMessage: string
  globalButtonAPIUrl: string
  globalButtonHttpMethod: 'POST' | 'PUT'

  // Payload structure for the global action request
  // 'collection' — single object with an ID array plus fixed properties
  //                e.g. { "caseIds": [1001, 1002], "caseStatus": "AVAILABLE" }
  //                Configured via collectionIdField, collectionIdKey, globalButtonDefaultValues
  // 'array'      — array of objects, one per checked row
  //                e.g. [{ "caseId": 1001, "crn": "A0045523" }, ...]
  //                Configured via globalActionFields, globalButtonDefaultValues
  globalActionPayloadMode: 'collection' | 'array'

  // collection mode — field in each row whose value is collected into the ID array
  collectionIdField: string

  // collection mode — key name used for the collected ID array in the payload
  // e.g. 'caseIds' produces { caseIds: [1001, 1002] }
  collectionIdKey: string

  // array mode — comma-separated fieldName:payloadKey pairs from each checked row
  globalActionFields: string

  // shared by both modes — comma-separated key:value pairs injected as fixed properties
  // e.g. 'caseStatus:AVAILABLE,casePool:DCR_AUTO'
  globalButtonDefaultValues: string

  // ─── Token validation ─────────────────────────────────────────────────────────

  tokenValidate_webapiURL: string
  tokenExpired_appUrl: string
}

export type IMConfig = ImmutableObject<Config>
