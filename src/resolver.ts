import { shouldLog, makeLogger, LOG_LEVEL_RANK_LOOKUP } from "./logger";
import {
  type ContextObj,
  type MapContext,
  type Contexts,
  type OnNoDefault,
  type ProjectEnvId,
  type Config,
  type ConfigValue,
  type LogLevel,
  ConfigType,
  LogLevel as LogLevelEnum,
} from "./types";
import type { Telemetry, TypedNodeServerConfigurationRaw } from "./reforge";
import { REFORGE_DEFAULT_LOG_LEVEL } from "./reforge";

import { mergeContexts, contextObjToMap } from "./mergeContexts";

import { configValueType } from "./wrap";
import { evaluate } from "./evaluate";
import { jsonStringifyWithBigInt } from "./bigIntUtils";

const emptyContexts: Contexts = new Map<string, MapContext>();

export const NOT_PROVIDED = Symbol("NOT_PROVIDED");

// Interface for Resolver's public API
export interface ResolverAPI {
  id: number;
  contexts?: Contexts;
  readonly telemetry: Telemetry | undefined;
  readonly defaultContext?: Contexts;
  readonly loggerKey?: string;
  updateIfStalerThan:
    | ((durationInMs: number) => Promise<void> | undefined)
    | undefined;

  cloneWithContext: (contexts: Contexts | ContextObj) => ResolverAPI;
  withContext: (contexts: Contexts | ContextObj) => ResolverAPI;
  update: (
    configs: Array<Config | MinimumConfig>,
    defaultContext?: Contexts
  ) => void;
  raw: (key: string) => MinimumConfig | undefined;
  set: (key: string, value: ConfigValue) => void;
  get: <K extends keyof TypedNodeServerConfigurationRaw>(
    key: K,
    localContexts?: Contexts | ContextObj,
    defaultValue?: TypedNodeServerConfigurationRaw[K],
    onNoDefault?: OnNoDefault
  ) => TypedNodeServerConfigurationRaw[K];
  isFeatureEnabled: (key: string, contexts?: Contexts | ContextObj) => boolean;
  keys: () => string[];
  logger: (
    loggerName: string,
    defaultLevel: LogLevel,
    contexts?: Contexts | ContextObj
  ) => ReturnType<typeof makeLogger>;
  shouldLog: (args: {
    loggerName: string;
    desiredLevel: LogLevel;
    defaultLevel?: LogLevel;
    contexts?: Contexts | ContextObj;
  }) => boolean;
  getLogLevel: (loggerName: string) => LogLevel;
  setOnUpdate: (
    onUpdate: (configs: Array<Config | MinimumConfig>) => void
  ) => void;
}

type OptionalKeys = "id" | "projectId" | "changedBy" | "allowableValues";

export type MinimumConfig = {
  [K in keyof Config]: K extends OptionalKeys
    ? Config[K] | undefined
    : Config[K];
};

const mergeDefaultContexts = (
  contexts: Contexts | ContextObj,
  defaultContext: Contexts
): Contexts => {
  const localContexts =
    contexts instanceof Map ? contexts : contextObjToMap(contexts);

  const mergedContexts: Contexts = new Map(localContexts);

  for (const type of defaultContext.keys()) {
    const defaultSingleContext: MapContext =
      defaultContext.get(type) ?? new Map();

    const mergedContext = new Map(localContexts.get(type) ?? new Map());

    defaultSingleContext.forEach((value, key) => {
      mergedContext.set(key, value);
    });

    mergedContexts.set(type, mergedContext);
  }

  return mergedContexts;
};

let id = 0;

class Resolver implements ResolverAPI {
  // Implement the new interface
  private readonly config = new Map<string, MinimumConfig>();
  private readonly projectEnvId: ProjectEnvId;
  private readonly namespace: string | undefined;
  private readonly onNoDefault: OnNoDefault;
  public contexts?: Contexts;
  readonly telemetry: Telemetry | undefined;
  private onUpdate: (configs: Array<Config | MinimumConfig>) => void;
  private readonly globalContext?: Contexts;
  public id: number;
  public readonly defaultContext?: Contexts;
  public readonly loggerKey?: string;
  public updateIfStalerThan: (
    durationInMs: number
  ) => Promise<void> | undefined;

  constructor(
    configs: Config[] | Map<string, MinimumConfig>,
    projectEnvId: ProjectEnvId,
    namespace: string | undefined,
    onNoDefault: OnNoDefault,
    updateIfStalerThan: (durationInMs: number) => Promise<void> | undefined,
    telemetry?: Telemetry,
    contexts?: Contexts | ContextObj,
    onInitialUpdate?: (configs: Array<Config | MinimumConfig>) => void,
    defaultContext?: Contexts,
    globalContext?: Contexts,
    loggerKey?: string
  ) {
    id += 1;
    this.id = id;
    this.projectEnvId = projectEnvId;
    this.namespace = namespace;
    this.onNoDefault = onNoDefault;
    this.onUpdate = onInitialUpdate ?? (() => {});
    this.defaultContext = defaultContext ?? new Map();
    this.globalContext = globalContext ?? new Map();
    this.loggerKey = loggerKey;
    this.contexts = mergeDefaultContexts(
      this.globalContext,
      mergeDefaultContexts(contexts ?? new Map(), defaultContext ?? new Map())
    );
    this.update(
      Array.isArray(configs) ? configs : Array.from(configs.values())
    );
    this.telemetry = telemetry;
    this.updateIfStalerThan = updateIfStalerThan;
  }

  cloneWithContext(contexts: Contexts | ContextObj): Resolver {
    return new Resolver(
      this.config,
      this.projectEnvId,
      this.namespace,
      this.onNoDefault,
      this.updateIfStalerThan,
      this.telemetry,
      contexts,
      this.onUpdate,
      this.defaultContext,
      this.globalContext,
      this.loggerKey
    );
  }

  withContext(contexts: Contexts | ContextObj): Resolver {
    return this.cloneWithContext(contexts);
  }

  update(
    configs: Array<Config | MinimumConfig>,
    defaultContext?: Contexts
  ): void {
    for (const config of configs) {
      if (
        config.configType === ConfigType.Deleted ||
        config.rows?.length === 0
      ) {
        this.config.delete(config.key);
      } else {
        this.config.set(config.key, config);
      }
    }

    if (defaultContext !== undefined) {
      this.contexts = mergeDefaultContexts(
        this.contexts ?? new Map(),
        defaultContext
      );
    }

    this.onUpdate(configs);
  }

  raw(key: string): MinimumConfig | undefined {
    return this.config.get(key);
  }

  set(key: string, value: ConfigValue): void {
    const valueType = configValueType(value);

    if (!valueType) {
      throw new Error(
        `Unknown value type for ${jsonStringifyWithBigInt(value)}`
      );
    }

    const config: MinimumConfig = {
      id: undefined,
      projectId: undefined,
      changedBy: undefined,
      allowableValues: undefined,
      key,
      rows: [{ properties: {}, values: [{ value, criteria: [] }] }],
      configType: ConfigType.Config,
      valueType,
      sendToClientSdk: false,
    };

    this.config.set(key, config);
  }

  get<K extends keyof TypedNodeServerConfigurationRaw>(
    key: K,
    localContexts?: Contexts | ContextObj,
    defaultValue: TypedNodeServerConfigurationRaw[K] = NOT_PROVIDED,
    onNoDefault: OnNoDefault = this.onNoDefault
  ): TypedNodeServerConfigurationRaw[K] {
    const config = this.raw(key);

    if (config === undefined) {
      if (defaultValue === NOT_PROVIDED) {
        if (onNoDefault === "error") {
          throw new Error(`No value found for key '${key}'`);
        }

        if (onNoDefault === "warn") {
          console.warn(`No value found for key '${key}'`);
        }
        return undefined;
      }

      return defaultValue;
    }

    const mergedContexts = mergeContexts(
      this.contexts,
      localContexts ?? emptyContexts
    );

    if (this.telemetry !== undefined && config.id !== undefined) {
      this.telemetry.contextShapes.push(mergedContexts);
      this.telemetry.exampleContexts.push(mergedContexts);
    }

    const evaluation = evaluate({
      config,
      projectEnvId: this.projectEnvId,
      namespace: this.namespace,
      contexts: mergedContexts,
      resolver: this,
    });

    if (this.telemetry !== undefined && config.id !== undefined) {
      this.telemetry.evaluationSummaries.push(evaluation);
    }

    return evaluation.unwrappedValue;
  }

  isFeatureEnabled(key: string, contexts?: Contexts | ContextObj): boolean {
    const value = this.get(key, contexts);

    if (typeof value === "boolean") {
      return value;
    }

    if (value === "true" || value === "false") {
      return value === "true";
    }

    console.warn(
      `Expected boolean value for key ${key}, got ${typeof value}. Non-boolean FF's return \`false\` for isFeatureEnabled checks.`
    );
    return false;
  }

  keys(): string[] {
    return Array.from(this.config.keys());
  }

  logger(
    loggerName: string,
    defaultLevel: LogLevel,
    contexts?: Contexts | ContextObj
  ): ReturnType<typeof makeLogger> {
    return makeLogger({
      loggerName,
      defaultLevel,
      contexts: contexts ?? this.contexts,
      resolver: this,
    });
  }

  shouldLog({
    loggerName,
    desiredLevel,
    defaultLevel,
    contexts,
  }: {
    loggerName: string;
    desiredLevel: LogLevel;
    defaultLevel?: LogLevel;
    contexts?: Contexts | ContextObj;
  }): boolean {
    const numericDesiredLevel = LOG_LEVEL_RANK_LOOKUP[desiredLevel];

    if (numericDesiredLevel === undefined) {
      console.warn(
        `[reforge]: Invalid desiredLevel \`${desiredLevel}\` provided to shouldLog. Returning \`true\``
      );

      return true;
    }

    if (this.telemetry != null) {
      this.telemetry.knownLoggers.push(loggerName, desiredLevel);
    }

    return shouldLog({
      loggerName,
      desiredLevel,
      contexts: contexts ?? this.contexts,
      defaultLevel: defaultLevel ?? REFORGE_DEFAULT_LOG_LEVEL,
      resolver: this,
    });
  }

  getLogLevel(loggerName: string): LogLevel {
    const key = this.loggerKey;

    if (key === undefined) {
      return LogLevelEnum.Debug;
    }

    const contexts: Contexts = new Map([
      [
        "reforge-sdk-logging",
        new Map([
          ["lang", "javascript"],
          ["logger-path", loggerName],
        ]),
      ],
    ]);

    const result = this.get(key, contexts, LogLevelEnum.Debug, "ignore");

    // Validate that the result is actually a LogLevel
    if (
      typeof result === "string" &&
      Object.values(LogLevelEnum).includes(result as LogLevel)
    ) {
      return result as LogLevel;
    }

    return LogLevelEnum.Debug;
  }

  public setOnUpdate(
    onUpdate: (configs: Array<Config | MinimumConfig>) => void
  ): void {
    this.onUpdate = onUpdate;
  }
}

export { Resolver };
