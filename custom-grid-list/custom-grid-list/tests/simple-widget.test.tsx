import { React } from 'jimu-core'
import _Widget from '../src/runtime/widget'
import { widgetRender, wrapWidget } from 'jimu-for-test'

const render = widgetRender()

describe('test custom-grid-list widget', () => {
  it('renders with no data', () => {
    const Widget = wrapWidget(_Widget, {
      config: {
        webApiUrl: '',
        urlParams: '',
        columnHeaders: 'id:ID,name:Name',
        itemsPerPage: '10',
        use_username_for_datafilter: false,
        addTitle: false,
        list_title: '',
        enableRowDispatch: false,
        dispatchNotificationChannel: '',
        dispatchPayloadField: '',
        dispatchPayloadKey: '',
        targetWidgetIds: [],
        listenNotificationChannel: '',
        listenAction: 'refresh',
        populateNotificationChannel: '',
        populateTargetWidgetIds: [],
        zoomToFeature: false,
        zoomExpression: '',
        highlightFeature: false,
        flashFeature: false,
        filterLayer: false,
        useNavigation: false,
        view_name: '',
        showCheckboxes: false,
        showRowActionButton: false,
        showGlobalButton: false,
        buttonCaption: '',
        buttonConfirmTitle: 'Confirm Action',
        buttonConfirmMessage: 'Are you sure?',
        listButton1APIUrl: '',
        rowActionHttpMethod: 'PUT',
        rowActionParamMode: 'query',
        rowActionFields: '',
        icon_file: '',
        use_username_for_button_action: false,
        globalButtonCaption: '',
        globalButtonConfirmTitle: 'Confirm Action',
        globalButtonConfirmMessage: 'Are you sure?',
        globalButtonAPIUrl: '',
        globalButtonHttpMethod: 'POST',
        globalActionPayloadMode: 'collection',
        collectionIdField: '',
        collectionIdKey: '',
        globalActionFields: '',
        globalButtonDefaultValues: '',
        tokenValidate_webapiURL: '',
        tokenExpired_appUrl: ''
      }
    })
    const { queryByText } = render(<Widget widgetId='Widget_1' />)
    expect(queryByText('No data to display.')).not.toBeNull()
  })
})
