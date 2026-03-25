import { React } from 'jimu-core'
import _Widget from '../src/runtime/widget'
import { widgetRender, wrapWidget } from 'jimu-for-test'

const render = widgetRender()
describe('test review-features-grid-list widget', () => {
  it('simple test', () => {
    const Widget = wrapWidget(_Widget, {
      config: {
        webApiUrl: '',
        urlParams: '',
        columnHeaders: 'FeatureCode:Feature Code,ETSAutoStatus:ETS AutoStatus',
        objectIdField: 'objectId',
        zoomToFeature: false,
        zoomExpression: '',
        highlightFeature: false,
        flashFeature: false,
        filterLayer: false,
        addTitle: false,
        list_title: '',
        itemsPerPage: '10',
        targetWidgetIds: [],
        use_username_for_datafilter: false,
        useNavigation: false,
        view_name: ''
      }
    })
    const { queryByText } = render(<Widget widgetId="Widget_1" />)
    expect(queryByText('No data to display.')).not.toBeNull()
  })
})
