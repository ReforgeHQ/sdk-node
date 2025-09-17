import type { ContextObj, Contexts } from "./types";
import { type Resolver } from "./resolver";
import { LogLevel } from "./types";
import { jsonStringifyWithBigInt } from "./bigIntUtils";

export const PREFIX = "log-level.";

// Create a union type of the enum values
type LogLevelValue = `${LogLevel}`;
// Use Lowercase utility type to get lowercase versions
export type LogLevelMethodName = Lowercase<LogLevelValue>;

export const LOG_LEVEL_RANK_LOOKUP: Record<
  LogLevel | LogLevelMethodName,
  number
> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
};

export const shouldLog = ({
  loggerName,
  desiredLevel,
  defaultLevel,
  resolver,
  contexts,
}: {
  loggerName: string;
  desiredLevel: LogLevel;
  defaultLevel: LogLevel;
  resolver: Resolver;
  contexts?: Contexts | ContextObj;
}): boolean => {
  let loggerNameWithPrefix = PREFIX + loggerName;

  while (loggerNameWithPrefix.includes(".")) {
    let resolvedLevel = resolver.get(
      loggerNameWithPrefix,
      contexts,
      undefined,
      "ignore"
    ) as LogLevel | undefined;

    if (resolvedLevel && !Object.values(LogLevel).includes(resolvedLevel)) {
      console.warn("Invalid log level for logger", resolvedLevel);
      resolvedLevel = undefined;
    }

    if (resolvedLevel !== undefined) {
      return (
        LOG_LEVEL_RANK_LOOKUP[resolvedLevel] <=
        LOG_LEVEL_RANK_LOOKUP[desiredLevel]
      );
    }

    loggerNameWithPrefix = loggerNameWithPrefix.slice(
      0,
      loggerNameWithPrefix.lastIndexOf(".")
    );
  }

  return (
    LOG_LEVEL_RANK_LOOKUP[defaultLevel] <= LOG_LEVEL_RANK_LOOKUP[desiredLevel]
  );
};

type MadeLogger = Record<
  LogLevelMethodName,
  (
    message: unknown,
    contexts?: Contexts | ContextObj | undefined
  ) => string | undefined
>;

export const makeLogger = ({
  loggerName,
  defaultLevel,
  resolver,
  contexts: makeLoggerLevelContexts,
}: {
  loggerName: string;
  defaultLevel: LogLevel;
  resolver: Resolver;
  contexts?: Contexts | ContextObj;
}): MadeLogger => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const logger = {} as MadeLogger;

  Object.values(LogLevel).forEach((sourceLevelName) => {
    // This is a safe cast, as LogLevelMethodNames is directly derived from LogLevel
    const levelName = sourceLevelName.toLowerCase() as LogLevelMethodName;

    const printableName = (
      levelName + " ".repeat(5 - levelName.length)
    ).toUpperCase();

    logger[levelName] = (message: unknown) => {
      if (
        resolver.shouldLog({
          loggerName,
          desiredLevel: sourceLevelName,
          defaultLevel,
          contexts: makeLoggerLevelContexts,
        })
      ) {
        const printableMessage =
          typeof message === "string"
            ? message
            : jsonStringifyWithBigInt(message);

        const output = `${printableName} ${loggerName}: ${printableMessage}`;
        console.log(output);

        return output;
      } else {
        return undefined;
      }
    };
  });

  return logger;
};
