import type { Reforge } from "../reforge";
import { LogLevel } from "../types";

/**
 * Creates a Pino logger instance with dynamic log levels from Reforge.
 *
 * @param reforge - The Reforge instance
 * @param loggerName - The name of the logger (used to fetch log level from Reforge)
 * @param pinoOptions - Optional Pino options to pass to the logger
 * @returns A Pino logger instance or undefined if Pino is not installed
 *
 * @example
 * ```typescript
 * import { Reforge } from '@reforge-com/node';
 * import { createPinoLogger } from '@reforge-com/node/integrations/pino';
 *
 * const reforge = new Reforge({
 *   sdkKey: process.env.REFORGE_SDK_KEY,
 *   loggerKey: 'my.log.config'
 * });
 *
 * await reforge.init();
 *
 * const logger = createPinoLogger(reforge, 'my.app.component', {
 *   // optional Pino options
 *   transport: { target: 'pino-pretty' }
 * });
 *
 * if (logger) {
 *   logger.info('Hello world');
 * }
 * ```
 */
export async function createPinoLogger(
  reforge: Reforge,
  loggerName: string,
  pinoOptions: any = {}
): Promise<any | undefined> {
  try {
    // Dynamically import pino only if it's available
    // @ts-ignore - pino is an optional peer dependency
    const pino = await import("pino");

    // Map Reforge LogLevel to Pino level names
    const levelMap: Record<LogLevel, string> = {
      [LogLevel.Trace]: "trace",
      [LogLevel.Debug]: "debug",
      [LogLevel.Info]: "info",
      [LogLevel.Warn]: "warn",
      [LogLevel.Error]: "error",
      [LogLevel.Fatal]: "fatal",
    };

    // Get the current log level from Reforge
    const reforgeLevel = reforge.getLogLevel(loggerName);
    const pinoLevel = levelMap[reforgeLevel] ?? "info";

    // Create the logger with the determined level
    const logger = pino.default({
      ...pinoOptions,
      level: pinoLevel,
      name: loggerName,
    });

    // Create a wrapper that updates the level dynamically
    const updateLevel = (): void => {
      const newReforgeLevel = reforge.getLogLevel(loggerName);
      const newPinoLevel = levelMap[newReforgeLevel] ?? "info";
      logger.level = newPinoLevel;
    };

    // Update level on each call if needed (for dynamic updates)
    const wrappedLogger = new Proxy(logger, {
      get(target, prop) {
        // Update level before each log call
        if (
          typeof prop === "string" &&
          ["trace", "debug", "info", "warn", "error", "fatal"].includes(prop)
        ) {
          updateLevel();
        }
        return target[prop as keyof typeof target];
      },
    });

    return wrappedLogger;
  } catch (error) {
    console.warn(
      "[reforge] Pino is not installed. Install it with: npm install pino"
    );
    return undefined;
  }
}

/**
 * Creates a custom Pino hook that updates log levels from Reforge.
 *
 * This can be used if you already have a Pino logger instance and want to
 * integrate it with Reforge's dynamic log levels.
 *
 * @param reforge - The Reforge instance
 * @param loggerName - The name of the logger (used to fetch log level from Reforge)
 * @returns A Pino mixin function
 *
 * @example
 * ```typescript
 * import pino from 'pino';
 * import { createPinoHook } from '@reforge-com/node/integrations/pino';
 *
 * const logger = pino({
 *   mixin: createPinoHook(reforge, 'my.app.component')
 * });
 * ```
 */
export function createPinoHook(
  reforge: Reforge,
  loggerName: string
): () => Record<string, any> {
  const levelMap: Record<LogLevel, string> = {
    [LogLevel.Trace]: "trace",
    [LogLevel.Debug]: "debug",
    [LogLevel.Info]: "info",
    [LogLevel.Warn]: "warn",
    [LogLevel.Error]: "error",
    [LogLevel.Fatal]: "fatal",
  };

  return () => {
    const reforgeLevel = reforge.getLogLevel(loggerName);
    return {
      reforgeLogLevel: levelMap[reforgeLevel],
    };
  };
}
