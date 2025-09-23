export type ContextValue = unknown;
type ContextName = string;
type ContextKey = string;
export type MapContext = Map<ContextKey, ContextValue>;
export type Contexts = Map<ContextName, MapContext>;

export type ContextObj = Record<ContextName, Record<ContextKey, ContextValue>>;

export type ConfigId = string;
export type ProjectEnvId = number;

export type HashByPropertyValue = string | undefined;

export type OnNoDefault = "error" | "warn" | "ignore";

export type FetchResult = Promise<{
  status: number;
  json: () => Promise<any>;
  [key: string]: any;
}>;

export type Fetch = (resource: any, options?: any) => FetchResult;

export enum ProvidedSource {
  EnvVar = "ENV_VAR",
}

export enum ConfigType {
  Config = "CONFIG",
  FeatureFlag = "FEATURE_FLAG",
  LogLevel = "LOG_LEVEL",
  Segment = "SEGMENT",
  LimitDefinition = "LIMIT_DEFINITION",
  Deleted = "DELETED",
  Schema = "SCHEMA",
}

export enum LogLevel {
  Trace = "TRACE",
  Debug = "DEBUG",
  Info = "INFO",
  Warn = "WARN",
  Error = "ERROR",
  Fatal = "FATAL",
}

export interface ConfigServicePointer {
  projectId: ProjectEnvId;
  startAtId: ProjectEnvId;
  projectEnvId: ProjectEnvId;
}

export interface ConfigValue {
  int?: bigint | undefined;
  string?: string | undefined;
  bytes?: Buffer | undefined;
  double?: number | undefined;
  bool?: boolean | undefined;
  weightedValues?: WeightedValues | undefined;
  limitDefinition?: LimitDefinition | undefined;
  logLevel?: LogLevel | undefined;
  stringList?: StringList | undefined;
  intRange?: IntRange | undefined;
  provided?: Provided | undefined;
  duration?: IsoDuration | undefined;
  json?: Json | undefined;
  schema?: Schema | undefined;
  /** don't log or telemetry this value */
  confidential?: boolean | undefined;
  /** key name to decrypt with */
  decryptWith?: string | undefined;
}

export interface Json {
  json: string;
}

export interface IsoDuration {
  /** value is eg P1h30s */
  definition: string;
}

export interface Provided {
  source?: ProvidedSource | undefined;
  /** eg MY_ENV_VAR */
  lookup?: string | undefined;
}

export interface IntRange {
  /** if empty treat as Number.MIN_VALUE. Inclusive */
  start?: bigint | undefined;
  /** if empty treat as Number.MAX_VALUE. Exclusive */
  end?: bigint | undefined;
}

export interface StringList {
  values: string[];
}

export interface WeightedValue {
  /** out of 1000 */
  weight: number;
  value: ConfigValue | undefined;
}

export interface WeightedValues {
  weightedValues: WeightedValue[];
  hashByPropertyName?: string | undefined;
}

export interface ApiKeyMetadata {
  /** numeric currently, but making it string will be more flexible over time */
  keyId?: string | undefined;
  /** ditto */
  userId?: string | undefined;
}

export interface Configs {
  configs: Config[];
  configServicePointer: ConfigServicePointer | undefined;
  apikeyMetadata?: ApiKeyMetadata | undefined;
  defaultContext?: ContextSet | undefined;
  keepAlive?: boolean | undefined;
}

export interface Config {
  id: ConfigId;
  projectId: ProjectEnvId;
  key: string;
  changedBy: ChangedBy | undefined;
  rows: ConfigRow[];
  allowableValues: ConfigValue[];
  configType: ConfigType;
  draftId?: number | undefined;
  valueType: ConfigValueType;
  /** default value of a boolean in proto3 is false */
  sendToClientSdk: boolean;
  schemaKey?: string | undefined;
}

export enum ConfigValueType {
  Int = "INT",
  String = "STRING",
  Bytes = "BYTES",
  Double = "DOUBLE",
  Bool = "BOOL",
  LimitDefinition = "LIMIT_DEFINITION",
  LogLevel = "LOG_LEVEL",
  StringList = "stringList",
  IntRange = "INT_RANGE",
  Duration = "DURATION",
  Json = "JSON",
}

export interface ChangedBy {
  userId: string;
  email: string;
  apiKeyId: string;
}

export interface ConfigRow {
  /** one row per projectEnvId */
  projectEnvId?: number | undefined;
  values: ConditionalValue[];
  /** can store "activated" */
  properties: Record<string, ConfigValue>;
}

export interface ConfigRow_PropertiesEntry {
  key: string;
  value: ConfigValue | undefined;
}

export interface ConditionalValue {
  /** if all criteria match, then the rule is matched and value is returned */
  criteria: Criterion[];
  value: ConfigValue | undefined;
}

export interface Criterion {
  propertyName: string;
  operator: Criterion_CriterionOperator;
  valueToMatch: ConfigValue | undefined;
}

export enum Criterion_CriterionOperator {
  LookupKeyIn = "LOOKUP_KEY_IN",
  LookupKeyNotIn = "LOOKUP_KEY_NOT_IN",
  InSeg = "IN_SEG",
  NotInSeg = "NOT_IN_SEG",
  AlwaysTrue = "ALWAYS_TRUE",
  PropIsOneOf = "PROP_IS_ONE_OF",
  PropIsNotOneOf = "PROP_IS_NOT_ONE_OF",
  PropEndsWithOneOf = "PROP_ENDS_WITH_ONE_OF",
  PropDoesNotEndWithOneOf = "PROP_DOES_NOT_END_WITH_ONE_OF",
  HierarchicalMatch = "HIERARCHICAL_MATCH",
  InIntRange = "IN_INT_RANGE",
  PropStartsWithOneOf = "PROP_STARTS_WITH_ONE_OF",
  PropDoesNotStartWithOneOf = "PROP_DOES_NOT_START_WITH_ONE_OF",
  PropContainsOneOf = "PROP_CONTAINS_ONE_OF",
  PropDoesNotContainOneOf = "PROP_DOES_NOT_CONTAIN_ONE_OF",
  PropLessThan = "PROP_LESS_THAN",
  PropLessThanOrEqual = "PROP_LESS_THAN_OR_EQUAL",
  PropGreaterThan = "PROP_GREATER_THAN",
  PropGreaterThanOrEqual = "PROP_GREATER_THAN_OR_EQUAL",
  PropBefore = "PROP_BEFORE",
  PropAfter = "PROP_AFTER",
  PropMatches = "PROP_MATCHES",
  PropDoesNotMatch = "PROP_DOES_NOT_MATCH",
  PropSemverLessThan = "PROP_SEMVER_LESS_THAN",
  PropSemverEqual = "PROP_SEMVER_EQUAL",
  PropSemverGreaterThan = "PROP_SEMVER_GREATER_THAN",
}

export interface Loggers {
  loggers: Logger[];
  startAt: number;
  endAt: number;
  /** random UUID generated on startup - represents the server so we can aggregate */
  instanceHash: string;
  namespace?: string | undefined;
}

export interface Logger {
  loggerName: string;
  traces?: number | undefined;
  debugs?: number | undefined;
  infos?: number | undefined;
  warns?: number | undefined;
  errors?: number | undefined;
  fatals?: number | undefined;
}

export enum LimitResponse_LimitPolicyNames {
  SecondlyRolling = 1,
  MinutelyRolling = 3,
  HourlyRolling = 5,
  DailyRolling = 7,
  MonthlyRolling = 8,
  Infinite = 9,
  YearlyRolling = 10,
}

export interface LimitRequest {
  accountId: number;
  acquireAmount: number;
  groups: string[];
  limitCombiner: LimitRequest_LimitCombiner;
  allowPartialResponse: boolean;
  /** [default = L4_BEST_EFFORT]; */
  safetyLevel: LimitDefinition_SafetyLevel;
}

export enum LimitRequest_LimitCombiner {
  MINIMUM = 1,
  MAXIMUM = 2,
}

/** if the same Context type exists, last one wins */
export interface ContextSet {
  contexts: Context[];
}

export interface Context {
  type?: string | undefined;
  values: Record<string, ConfigValue>;
}

export interface Context_ValuesEntry {
  key: string;
  value: ConfigValue | undefined;
}

export interface Identity {
  lookup?: string | undefined;
  attributes: Record<string, string>;
}

export interface Identity_AttributesEntry {
  key: string;
  value: string;
}

export interface ConfigEvaluationMetaData {
  configRowIndex?: number | undefined;
  conditionalValueIndex?: number | undefined;
  weightedValueIndex?: number | undefined;
  type?: ConfigType | undefined;
  id?: string | undefined;
  valueType?: ConfigValueType | undefined;
}

export interface ClientConfigValue {
  int?: bigint | undefined;
  string?: string | undefined;
  double?: number | undefined;
  bool?: boolean | undefined;
  logLevel?: LogLevel | undefined;
  stringList?: StringList | undefined;
  intRange?: IntRange | undefined;
  duration?: ClientDuration | undefined;
  json?: Json | undefined;
  configEvaluationMetadata?: ConfigEvaluationMetaData | undefined;
}

export interface ClientDuration {
  /** the actual time is the sum of these, so 1.5 seconds would be seconds = 1, nanos = 500_000_000 */
  seconds: number;
  nanos: number;
  definition: string;
}

export interface ConfigEvaluations {
  values: Record<string, ClientConfigValue>;
  apikeyMetadata?: ApiKeyMetadata | undefined;
  defaultContext?: ContextSet | undefined;
}

export interface ConfigEvaluations_ValuesEntry {
  key: string;
  value: ClientConfigValue | undefined;
}

export interface LimitDefinition {
  policyName: LimitResponse_LimitPolicyNames;
  limit: number;
  burst: number;
  accountId: number;
  lastModified: number;
  returnable: boolean;
  /** [default = L4_BEST_EFFORT]; // Overridable by request */
  safetyLevel: LimitDefinition_SafetyLevel;
}

export enum LimitDefinition_SafetyLevel {
  L4_BEST_EFFORT = 4,
  L5_BOMBPROOF = 5,
}

export interface ContextShape {
  name: string;
  fieldTypes: Record<string, number>;
}

export interface ContextShapes {
  shapes: ContextShape[];
  namespace?: string | undefined;
}

export interface ConfigEvaluationCounter {
  count: number;
  configId?: string | undefined;
  /** index into the allowed-values list in the config */
  selectedIndex?: number | undefined;
  selectedValue?: ConfigValue | undefined;
  /** which row matched */
  configRowIndex?: number | undefined;
  /** which ConditionalValue in the row matched? */
  conditionalValueIndex?: number | undefined;
  /** index into the weighted value array */
  weightedValueIndex?: number | undefined;
  reason: ConfigEvaluationCounter_Reason;
}

export enum ConfigEvaluationCounter_Reason {
  Unknown = 0,
}

export interface ConfigEvaluationSummary {
  key: string;
  /** type of config eval */
  type: ConfigType;
  counters: ConfigEvaluationCounter[];
}

export interface ConfigEvaluationSummaries {
  start: number;
  end: number;
  summaries: ConfigEvaluationSummary[];
}

export interface LoggersTelemetryEvent {
  loggers: Logger[];
  startAt: number;
  endAt: number;
}

export interface TelemetryEvent {
  summaries?: ConfigEvaluationSummaries | undefined;
  exampleContexts?: ExampleContexts | undefined;
  clientStats?: ClientStats | undefined;
  loggers?: LoggersTelemetryEvent | undefined;
  contextShapes?: ContextShapes | undefined;
}

export interface TelemetryEvents {
  /** random UUID generated on startup - represents the server so we can aggregate */
  instanceHash: string;
  events: TelemetryEvent[];
}

export interface ExampleContexts {
  examples: ExampleContext[];
}

export interface ExampleContext {
  timestamp: number;
  contextSet: ContextSet | undefined;
}

export interface ClientStats {
  start: number;
  end: number;
  droppedEventCount: number;
}

export interface Schema {
  schema: string;
  schemaType: Schema_SchemaType;
}

export enum Schema_SchemaType {
  UNKNOWN = 0,
  ZOD = 1,
  JSON_SCHEMA = 2,
}

export const isNonNullable = <T>(value: T): value is NonNullable<T> => {
  return value !== null && value !== undefined;
};
