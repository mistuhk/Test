import { ImmutableObject } from 'seamless-immutable'

// Represents an independent incoming notification listener.
export interface ListenChannelEntry {
    channel: string
    action: 'refresh' | 'populate'
    populateNotificationChannel?: string
    populateTargetWidgetIds?: string[]
}

// Represents one independent row-click dispatch event.
export interface DispatchEventEntry {
    channel: string
    payloadFields: string
    targetWidgetIds: string[]
}

export interface Config {

    /****** DATA SECTION ******/
    webApiUrl: string
    urlParams: string
    columnHeaders: string
    itemsPerPage: string
    use_username_for_datafilter: boolean

    /****** DISPLAY SECTION ******/
    addTitle: boolean
    list_title: string
    noDataMessage: string

    /****** ROW CLICK DISPATCH NOTIFICATION ******/
    dispatchEvents: DispatchEventEntry[]

    /****** LISTEN: NOTIFICATION SUBSCRIPTION ******/
    listenChannels: ListenChannelEntry[]

    /****** ON DATA LOADED: DISPATCH NOTIFICATION ******/
    // Fired once inside loadData after a successful API response.
    // The available source fields are: { count } where count is the
    // total number of records returned by the API endpoint.
    // payloadFields follows the same fieldName:payloadKey comma-separated
    // format as row click dispatch. If left empty, the payload defaults
    // to { count: n } automatically.
    gridDataLoadedChannel: string
    gridDataLoadedPayloadFields: string
    gridDataLoadedTargetWidgetIds: string[]

    /****** MAP INTERACTION ******/
    zoomToFeature: boolean
    zoomExpression: string
    highlightFeature: boolean
    flashFeature: boolean
    filterLayer: boolean
    useNavigation: boolean
    view_name: string

    /****** Action Buttons ******/
    showCheckboxes: boolean
    showRowActionButton: boolean
    showGlobalButton: boolean

    /****** PER-ROW ACTION BUTTON ******/
    buttonCaption: string
    rowActionMode: 'api' | 'navigate'
    buttonConfirmTitle: string
    buttonConfirmMessage: string
    listButton1APIUrl: string
    rowActionHttpMethod: 'GET' | 'POST' | 'PUT'
    rowActionParamMode: 'query' | 'body'
    rowActionFields: string
    icon_file: string
    use_username_for_button_action: boolean
    enablePostActionNotification: boolean
    postActionNotificationChannel: string
    postActionPayloadFields: string
    postActionTargetWidgetIds: string[]
    navigateTargetType: 'page' | 'view' | 'widget'
    navigateTarget: string
    showConfirmBeforeNavigate: boolean
    navigateConfirmTitle: string
    navigateConfirmMessage: string
    navigateUrlParams: string
    navigateCarryUrlParams: boolean

    /****** GLOBAL ACTION BUTTON ******/
    globalButtonCaption: string
    globalButtonConfirmTitle: string
    globalButtonConfirmMessage: string
    globalButtonAPIUrl: string
    globalButtonHttpMethod: 'POST' | 'PUT'
    use_username_for_global_action: boolean
    use_username_in_global_payload: boolean
    globalButtonMinRows: number
    globalActionPayloadMode: 'collection' | 'array'
    collectionIdField: string
    collectionIdKey: string
    globalActionFields: string
    globalButtonDefaultValues: string

    /****** TOKEN VALIDATION ******/
    tokenValidate_webapiURL: string
    tokenExpired_appUrl: string
}

export type IMConfig = ImmutableObject<Config>
