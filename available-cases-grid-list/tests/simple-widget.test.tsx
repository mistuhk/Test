import { React } from 'jimu-core'
import _Widget from '../src/runtime/widget'
import { widgetRender, wrapWidget } from 'jimu-for-test'

const render = widgetRender()
describe('test available-cases-grid-list widget', () => {
  it('simple test', () => {
    const Widget = wrapWidget(_Widget, {
      config: {
        webApiUrl: '',
        urlParams: '',
        columnHeaders: 'caseId:Case ID,crn:CRN,fileRefNo:File Ref No',
        itemsPerPage: '10',
        use_username_for_datafilter: false,
        showButtons: true,
        addTitle: false,
        list_title: '',
        buttonCaption: 'QA Complete',
        buttonConfirmTitle: 'Confirm Action',
        buttonConfirmMessage: 'Do you want to mark this case as QA Complete?',
        listButton1APIUrl: '',
        button1ParamExpression: '',
        icon_file: '',
        use_username_for_button_action: false,
        globalButtonCaption: 'QA Complete All (Selected)',
        globalButtonConfirmTitle: 'Confirm Action',
        globalButtonConfirmMessage: 'Do you want to mark selected cases as QA Complete?',
        globalButtonAPIUrl: '',
        globalButtonPayloadFields: 'caseId,crn,fileRefNo',
        globalButtonDefaultValues: 'caseStatus:Available,destinationPool:DCR_AUTO',
        globalButtonHttpMethod: 'POST',
        use_username_for_global_action: false,
        tokenValidate_webapiURL: '',
        tokenExpired_appUrl: ''
      }
    })
    const { queryByText } = render(<Widget widgetId="Widget_1" />)
    expect(queryByText('No data to display.')).not.toBeNull()
  })
})
