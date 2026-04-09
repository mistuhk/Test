import { ImmutableObject } from 'seamless-immutable'

// Represents an independent incoming notification listener.
// Widget supports multiple listeners, each with its own channel
// and action. Replaces the previous single-listener fields
// (listenNotificationChannel, listenAction, populateNotificationChannel,
// populateTargetWidgetIds).
export interface ListenChannelEntry {
    channel: string                          // Channel name to listen on e.g. 'ETSReviewStatusUpdated'
    action: 'refresh' | 'populate'          // Independent action per listener
    populateNotificationChannel?: string    // Only used when action = 'populate'
    populateTargetWidgetIds?: string[]      // Only used when action = 'populate'
}

// NEW CHANGE: Represents one independent row-click dispatch event.
// The widget now supports multiple dispatch events per row click, each
// with its own channel, payload field mappings and target widget IDs.
// Replaces the previous single-event fields: enableRowDispatch,
// dispatchNotificationChannel, dispatchPayloadField, dispatchPayloadKey,
// targetWidgetIds. Existing instances must be reconfigured.
export interface DispatchEventEntry {
    // Channel name to dispatch on e.g. 'ETSFeatureSelected'
    channel: string
    // Comma-separated fieldName:payloadKey pairs from the clicked row.
    // e.g. 'objectId:objectId,crn:crn' sends { objectId: 1001, crn: 'A0069409' }
    // Leave empty to dispatch an empty payload {}
    payloadFields: string
    // Widget IDs to dispatch this event to
    targetWidgetIds: string[]
}

export interface Config {

    /****** DATA SECTION ******/
    // API endpoint to fetch data from
    webApiUrl: string

    // URL filter expression: supports {placeholder}
    // tokens resolved from URL parameters
    // e.g. 'caseId={caseid}' — note: placeholders must be lowercase
    urlParams: string

    // Comma-separated fieldName:Label pairs
    // defining which columns to render
    // e.g. 'caseId:Case ID,crn:CRN,fileRefNo:File Ref No'
    columnHeaders: string

    // Number of rows to display per page
    itemsPerPage: string

    // When true, appends &username={username}
    // from the URL parameters to the data fetch request
    use_username_for_datafilter: boolean

    /****** DISPLAY SECTION ******/
    addTitle: boolean
    list_title: string

    // NEW CHANGE: Array of independent row-click dispatch events.
    // Replaces the previous single-event fields (enableRowDispatch,
    // dispatchNotificationChannel, dispatchPayloadField, dispatchPayloadKey,
    // targetWidgetIds). When the array is empty, no notifications are dispatched
    // on row click. Presence of entries drives dispatch — no master toggle needed.
    dispatchEvents: DispatchEventEntry[]

    // Collection of notification listener entries.
    // Each entry has its own independent channel and action.
    listenChannels: ListenChannelEntry[]

    /****** MAP INTERACTION ******/
    // NEW CHANGE: Map interaction is now independent of dispatch events.
    // It fires on row click whenever zoomToFeature is true, regardless of
    // whether any dispatch events are configured. Previously this section
    // was only active when enableRowDispatch was true.
    zoomToFeature: boolean
    zoomExpression: string
    highlightFeature: boolean
    flashFeature: boolean
    filterLayer: boolean
    useNavigation: boolean
    view_name: string

    /****** Action Buttons ******/
    // Individual toggles — each controls its own UI element independently
    showCheckboxes: boolean
    showRowActionButton: boolean
    showGlobalButton: boolean

    /****** PER-ROW ACTION BUTTON ******/
    buttonCaption: string

    // 'api': calls the configured API endpoint
    // 'navigate': navigates to a page, view or widget within the app
    rowActionMode: 'api' | 'navigate'

    // api mode
    buttonConfirmTitle: string
    buttonConfirmMessage: string
    listButton1APIUrl: string
    rowActionHttpMethod: 'GET' | 'POST' | 'PUT'
    rowActionParamMode: 'query' | 'body'
    rowActionFields: string
    icon_file: string
    use_username_for_button_action: boolean

    // Post API action notification — optionally dispatched after a successful
    // per-row action API call. Active when rowActionMode = 'api'.
    enablePostActionNotification: boolean
    postActionNotificationChannel: string
    postActionPayloadFields: string
    postActionTargetWidgetIds: string[]

    // navigate mode
    navigateTargetType: 'page' | 'view' | 'widget'
    navigateTarget: string
    showConfirmBeforeNavigate: boolean
    navigateConfirmTitle: string
    navigateConfirmMessage: string
    navigateUrlParams: string
    // When true, carries token and username from the current page URL to the destination.
    // Read with !== false in widget code to handle undefined on pre-existing instances.
    navigateCarryUrlParams: boolean

    /****** GLOBAL ACTION BUTTON ******/
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

    /****** TOKEN VALIDATION ******/
    tokenValidate_webapiURL: string
    tokenExpired_appUrl: string
}

export type IMConfig = ImmutableObject<Config>
