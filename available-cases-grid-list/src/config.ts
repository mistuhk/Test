import { ImmutableObject } from 'seamless-immutable'

export interface Config {
  // Data
  webApiUrl: string
  urlParams: string
  columnHeaders: string       // comma-separated fieldName:Label pairs e.g. "caseId:Case ID,crn:CRN"
  itemsPerPage: string
  use_username_for_datafilter: boolean
  // Display
  showButtons: boolean        // controls checkboxes, per-row button and global button
  addTitle: boolean
  list_title: string
  // Per-row action button
  buttonCaption: string
  buttonConfirmTitle: string  // popup header for per-row button
  buttonConfirmMessage: string // popup body for per-row button
  listButton1APIUrl: string
  button1ParamExpression: string
  icon_file: string
  use_username_for_button_action: boolean
  // Global action button
  globalButtonCaption: string
  globalButtonConfirmTitle: string   // popup header for global button
  globalButtonConfirmMessage: string // popup body for global button
  globalButtonAPIUrl: string
  globalButtonPayloadFields: string  // comma-separated field names from each row e.g. "caseId,crn,fileRefNo"
  globalButtonDefaultValues: string  // comma-separated key:value pairs e.g. "caseStatus:Available,destinationPool:DCR_AUTO"
  globalButtonHttpMethod: string     // POST or PUT
  use_username_for_global_action: boolean
  // Token validation
  tokenValidate_webapiURL: string
  tokenExpired_appUrl: string
}

export type IMConfig = ImmutableObject<Config>
