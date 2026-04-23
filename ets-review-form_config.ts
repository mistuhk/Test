import { ImmutableObject } from 'seamless-immutable'

export interface Config {
  notificationTargetWidgetIds: string[]

  // Controls how ETSReviewTime is written to the feature layer on update.
  // true  → Date.now() — milliseconds since epoch (use when ETSReviewTime is an ArcGIS Date field)
  // false → new Date().toISOString() — UTC ISO 8601 string (use when ETSReviewTime is a String field)
  // Default: true (Date field). Toggle OFF if the field is a String field.
  reviewTimeAsEpoch: boolean
}

export type IMConfig = ImmutableObject<Config>
