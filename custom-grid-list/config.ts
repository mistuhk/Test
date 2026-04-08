import { ImmutableObject } from 'seamless-immutable'

// NEW CHANGE: EXPORTED ListenChannelEntry INTERFACE — REPRESENTS ONE INDEPENDENT
// INCOMING NOTIFICATION LISTENER. THE WIDGET NOW SUPPORTS MULTIPLE LISTENERS,
// EACH WITH ITS OWN CHANNEL AND ACTION. REPLACES THE PREVIOUS SINGLE-LISTENER
// FIELDS (listenNotificationChannel, listenAction, populateNotificationChannel,
// populateTargetWidgetIds).
export interface ListenChannelEntry {
  channel: string                          // NEW CHANGE: CHANNEL NAME TO LISTEN ON e.g. 'ETSReviewStatusUpdated'
  action: 'refresh' | 'populate'          // NEW CHANGE: INDEPENDENT ACTION PER LISTENER
  populateNotificationChannel?: string    // NEW CHANGE: ONLY USED WHEN action = 'populate'
  populateTargetWidgetIds?: string[]      // NEW CHANGE: ONLY USED WHEN action = 'populate'
}

export interface Config {

  // ─── Data ──────────────────────────────────────────────────────────────────

  webApiUrl: string
  urlParams: string
  columnHeaders: string
  itemsPerPage: string
  use_username_for_datafilter: boolean

  // ─── Display ───────────────────────────────────────────────────────────────

  addTitle: boolean
  list_title: string

  // ─── Row click — dispatch notification ─────────────────────────────────────

  enableRowDispatch: boolean
  dispatchNotificationChannel: string
  dispatchPayloadField: string
  dispatchPayloadKey: string
  targetWidgetIds: string[]

  // NEW CHANGE: REPLACES SINGLE listenNotificationChannel / listenAction FIELDS
  // WITH AN ARRAY OF INDEPENDENT LISTENER ENTRIES. EACH ENTRY HAS ITS OWN
  // CHANNEL AND ACTION. EXISTING INSTANCES USING THE OLD SINGLE-LISTENER CONFIG
  // MUST BE RECONFIGURED USING THIS ARRAY FORMAT.
  listenChannels: ListenChannelEntry[]

  // ─── Map interaction ───────────────────────────────────────────────────────

  zoomToFeature: boolean
  zoomExpression: string
  highlightFeature: boolean
  flashFeature: boolean
  filterLayer: boolean
  useNavigation: boolean
  view_name: string

  // ─── Action buttons ─────────────────────────────────────────────────────────

  showCheckboxes: boolean
  showRowActionButton: boolean
  showGlobalButton: boolean

  // ─── Per-row action button ──────────────────────────────────────────────────

  buttonCaption: string
  rowActionMode: 'api' | 'navigate'

  // ── api mode ──────────────────────────────────────────────────────────────

  buttonConfirmTitle: string
  buttonConfirmMessage: string
  listButton1APIUrl: string
  rowActionHttpMethod: 'GET' | 'POST' | 'PUT'
  rowActionParamMode: 'query' | 'body'
  rowActionFields: string
  icon_file: string
  use_username_for_button_action: boolean

  // NEW CHANGE: POST-API ACTION NOTIFICATION FIELDS — ALL FOUR FIELDS BELOW ARE
  // NEW. OPTIONALLY DISPATCHED AFTER A SUCCESSFUL PER-ROW API CALL.
  // ONLY ACTIVE WHEN rowActionMode = 'api'.
  enablePostActionNotification: boolean       // NEW CHANGE: MASTER TOGGLE FOR POST-ACTION NOTIFICATION
  postActionNotificationChannel: string       // NEW CHANGE: CHANNEL TO DISPATCH ON AFTER SUCCESS
  postActionPayloadFields: string             // NEW CHANGE: COMMA-SEPARATED fieldName:payloadKey PAIRS FROM CLICKED ROW. LEAVE EMPTY FOR PURE SUCCESS SIGNAL {}
  postActionTargetWidgetIds: string[]         // NEW CHANGE: TARGET WIDGET IDS — INDEPENDENT FROM targetWidgetIds (ROW CLICK DISPATCH)

  // ── navigate mode ─────────────────────────────────────────────────────────

  navigateTargetType: 'page' | 'view' | 'widget'
  navigateTarget: string
  showConfirmBeforeNavigate: boolean
  navigateConfirmTitle: string
  navigateConfirmMessage: string
  navigateUrlParams: string
  navigateCarryUrlParams: boolean

  // ─── Global action button ───────────────────────────────────────────────────

  globalButtonCaption: string
  globalButtonConfirmTitle: string
  globalButtonConfirmMessage: string
  globalButtonAPIUrl: string
  globalButtonHttpMethod: 'POST' | 'PUT'
  globalActionPayloadMode: 'collection' | 'array'
  collectionIdField: string
  collectionIdKey: string
  globalActionFields: string
  globalButtonDefaultValues: string

  // ─── Token validation ───────────────────────────────────────────────────────

  tokenValidate_webapiURL: string
  tokenExpired_appUrl: string
}

export type IMConfig = ImmutableObject<Config>
