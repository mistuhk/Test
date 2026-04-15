export default {
    _widgetLabel: 'Custom Grid List Settings',

    // Sections
    sectionData: 'Data',
    sectionDisplay: 'Display',
    sectionRowDispatch: 'Row click: dispatches notification',
    sectionListen: 'Incoming notification',
    sectionPopulate: 'Populate: forwards payload',
    sectionMap: 'Map interaction',
    sectionButtons: 'Action buttons',
    sectionPerRow: 'Per-row action button',
    sectionGlobal: 'Global action button',
    sectionGlobalPayload: 'Global action payload',
    sectionToken: 'Token validation',
    sectionTargetWidgets: 'Notification target widgets',
    sectionPopulateTargets: 'Populate target widgets',

    // Data
    webApiUrl: 'Web API URL',
    urlParams: 'URL parameter expression',
    urlParamsHint: 'Supports {placeholder} tokens resolved from the page URL e.g. caseId={caseId}',
    columnHeaders: 'Column headers',
    columnHeadersHint: 'One row per column. Field name must exactly match the API response property name.',
    itemsPerPage: 'Items per page',
    useUsernameDataFilter: 'Append username to data request',

    // Display
    addTitle: 'Show widget title bar',
    listTitle: 'Title text',
    noDataMessage: 'No data message',
    noDataMessageHint: 'Text shown when the API returns no rows. Leave blank to use the default: "No data to display."',

    // Row dispatch
    enableRowDispatch: 'Enable row click dispatch',
    dispatchNotificationChannel: 'Dispatch channel name e.g. ETSReviewFeatureSelected',
    dispatchPayloadField: 'Row field to read for payload value e.g. objectId',
    dispatchPayloadKey: 'Payload key name e.g. objectId',

    // Listen
    listenNotificationChannel: 'Listen channel name e.g. ETSReviewStatusUpdated',
    listenChannelHint: 'Leave empty to disable listening',
    listenAction: 'Action on receipt',

    // Populate
    populateNotificationChannel: 'Channel to forward payload on',
    populateTargetWidgets: 'Forward payload to these widget IDs',

    // Map
    zoomToFeature: 'Zoom to feature on row click',
    zoomExpression: 'Zoom SQL expression e.g. OBJECTID = {objectId}',
    highlightFeature: 'Highlight feature on map',
    flashFeature: 'Flash feature on map',
    filterLayer: 'Filter connected layer',
    useNavigation: 'Navigate to a different view',
    viewName: 'Target view name',

    // Buttons — three independent toggles
    showCheckboxes: 'Show checkboxes',
    showCheckboxesHint: 'Checkboxes are required for the global action button to function. They only appear when more than 1 row is returned from the API.',
    showRowActionButton: 'Show per-row action button',
    showGlobalButton: 'Show global action button',
    showGlobalButtonHint: 'The global button appears at runtime only when checkboxes are also enabled and the minimum number of rows are checked.',
    globalButtonMinRows: 'Minimum rows to activate',
    globalButtonMinRowsHint: 'The global button is only shown when at least this many rows are checked. Default is 2. Must be 1 or more.',

    // Per-row
    buttonCaption: 'Button label',
    buttonConfirmTitle: 'Confirmation popup title',
    buttonConfirmMessage: 'Confirmation popup message',
    listButton1APIUrl: 'API endpoint URL',
    rowActionHttpMethod: 'HTTP method (GET, POST or PUT)',
    rowActionParamMode: 'Parameter mode (query or body)',
    rowActionParamModeHint: 'query: URL query string e.g. ?id=1&username=x  |  body: JSON request body',
    rowActionFields: 'Fields to send',
    rowActionFieldsHint: 'One row per field. Field name must match the API response property name.',
    iconFile: 'Icon file',
    useUsernameRowAction: 'Append username to row action',

    // Global
    globalButtonCaption: 'Button label',
    globalButtonConfirmTitle: 'Confirmation popup title',
    globalButtonConfirmMessage: 'Confirmation popup message',
    globalButtonAPIUrl: 'API endpoint URL',
    globalButtonHttpMethod: 'HTTP method (POST or PUT)',
    globalActionPayloadMode: 'Payload mode (collection or array)',
    globalActionPayloadModeHint: 'collection: single object with ID array e.g. { ids: [1,2], status: "X" }  |  array: one object per row e.g. [{ id: 1 }, { id: 2 }]',

    // Collection mode
    collectionIdField: 'Row field to collect IDs from e.g. caseId',
    collectionIdKey: 'Key name for ID array in payload e.g. caseIds',

    // Array mode
    globalActionFields: 'Fields per row',
    globalActionFieldsHint: 'One row per field. Field name must match the API response property name.',

    // Both modes
    globalButtonDefaultValues: 'Fixed default values',
    globalButtonDefaultValuesHint: 'One row per fixed property. Injected into every payload item e.g. caseStatus → AVAILABLE.',

    // Token
    tokenValidateUrl: 'Token validation API URL',
    tokenExpiredUrl: 'Token expired redirect URL',

    // Widget ID inputs
    currentWidgetId: 'Current Widget ID: ',
    targetWidgetIds: 'Target Widget IDs: ',
    enterWidgetId: 'Enter widget ID',
    addButton: 'Add',
    clearButton: 'Clear all'
}
