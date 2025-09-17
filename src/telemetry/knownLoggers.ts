import { type Logger, type Loggers, LogLevel } from "../types";
import type { ApiClient } from "../apiClient";

import type { SyncResult, Telemetry } from "./types";
import { jsonStringifyWithBigInt } from "../bigIntUtils";

const ENDPOINT = "/api/v1/telemetry";

const MAX_DATA_SIZE = 10000;

type KnownLogger = Telemetry & {
  data: Record<string, Record<string, number>>;
  push: (loggerName: string, severity: LogLevel) => void;
};

export const stub: KnownLogger = {
  enabled: false,
  data: {},
  push() {},
  sync: async () => undefined,
  timeout: undefined,
};

type Pluralize<S extends string> = `${S}s`;

export type LoggerLevelName = Pluralize<
  "trace" | "debug" | "info" | "warn" | "error" | "fatal"
>;

const NUMBER_LEVEL_LOOKUP: Record<LogLevel, LoggerLevelName> = {
  [LogLevel.Trace]: "traces",
  [LogLevel.Debug]: "debugs",
  [LogLevel.Info]: "infos",
  [LogLevel.Warn]: "warns",
  [LogLevel.Error]: "errors",
  [LogLevel.Fatal]: "fatals",
};

export const knownLoggers = (
  apiClient: ApiClient,
  telemetryHost: string | undefined,
  instanceHash: string,
  collectLoggerCounts: boolean,
  namespace?: string,
  maxDataSize: number = MAX_DATA_SIZE
): KnownLogger => {
  if (!collectLoggerCounts) {
    return stub;
  }

  const data: Record<string, Partial<Record<LogLevel, number>>> = {};
  let startAt: number | undefined;

  return {
    enabled: true,

    data,

    timeout: undefined,

    push(loggerName: string, severity: LogLevel) {
      if (telemetryHost === undefined) {
        return;
      }

      startAt = startAt ?? Date.now();

      if (data[loggerName] == null) {
        if (Object.keys(data).length >= maxDataSize) {
          return;
        }

        data[loggerName] = {};
      }

      (data[loggerName] as Record<string, number>)[severity] =
        ((data[loggerName] as Record<string, number>)[severity] ?? 0) + 1;
    },

    async sync(): Promise<SyncResult | undefined> {
      if (Object.keys(data).length === 0 || telemetryHost === undefined) {
        return;
      }

      const loggers = Object.keys(data).map((loggerName) => {
        const logger: Logger = { loggerName };

        const record = data[loggerName] ?? {};

        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete data[loggerName];

        Object.keys(record).forEach((severity) => {
          const key: LoggerLevelName | undefined =
            NUMBER_LEVEL_LOOKUP[severity as LogLevel];

          if (key !== undefined) {
            logger[key] = record[severity as LogLevel] ?? 0;
          }
        });

        return logger;
      });

      const apiData: Loggers = {
        loggers,
        startAt: startAt ?? Date.now(),
        endAt: Date.now(),
        instanceHash,
      };

      if (namespace !== undefined) {
        apiData.namespace = namespace;
      }

      const result = await apiClient.fetch({
        source: telemetryHost,
        path: ENDPOINT,
        options: {
          method: "POST",
          body: jsonStringifyWithBigInt({ loggers: apiData }),
        },
      });

      startAt = undefined;

      return {
        status: result.status,
        dataSent: apiData,
      };
    },
  };
};
