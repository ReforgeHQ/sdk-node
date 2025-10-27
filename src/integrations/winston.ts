import type { Reforge } from "../reforge";
import { LogLevel } from "../types";

/**
 * Creates a Winston logger instance with dynamic log levels from Reforge.
 *
 * @param reforge - The Reforge instance
 * @param loggerName - The name of the logger (used to fetch log level from Reforge)
 * @param winstonOptions - Optional Winston options to pass to the logger
 * @returns A Winston logger instance or undefined if Winston is not installed
 *
 * @example
 * ```typescript
 * import { Reforge } from '@reforge-com/node';
 * import { createWinstonLogger } from '@reforge-com/node/integrations/winston';
 *
 * const reforge = new Reforge({
 *   sdkKey: process.env.REFORGE_SDK_KEY,
 *   loggerKey: 'my.log.config'
 * });
 *
 * await reforge.init();
 *
 * const logger = createWinstonLogger(reforge, 'my.app.component', {
 *   // optional Winston options
 *   transports: [new winston.transports.Console()]
 * });
 *
 * if (logger) {
 *   logger.info('Hello world');
 * }
 * ```
 */
export async function createWinstonLogger(
  reforge: Reforge,
  loggerName: string,
  winstonOptions: any = {}
): Promise<any | undefined> {
  try {
    // Dynamically import winston only if it's available
    // @ts-ignore - winston is an optional peer dependency
    const winston = await import("winston");

    // Map Reforge LogLevel to Winston level names
    const levelMap: Record<LogLevel, string> = {
      [LogLevel.Trace]: "debug", // Winston doesn't have trace, map to debug
      [LogLevel.Debug]: "debug",
      [LogLevel.Info]: "info",
      [LogLevel.Warn]: "warn",
      [LogLevel.Error]: "error",
      [LogLevel.Fatal]: "error", // Winston doesn't have fatal, map to error
    };

    // Get the current log level from Reforge
    const reforgeLevel = reforge.getLogLevel(loggerName);
    const winstonLevel = levelMap[reforgeLevel] ?? "info";

    // Create the logger with the determined level
    const logger = winston.createLogger({
      level: winstonLevel,
      defaultMeta: { loggerName },
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
      transports: [new winston.transports.Console()],
      ...winstonOptions,
    });

    // Create a wrapper that updates the level dynamically
    const updateLevel = (): void => {
      const newReforgeLevel = reforge.getLogLevel(loggerName);
      const newWinstonLevel = levelMap[newReforgeLevel] ?? "info";
      logger.level = newWinstonLevel;
    };

    // Update level on each call if needed (for dynamic updates)
    const wrappedLogger = new Proxy(logger, {
      get(target, prop) {
        // Update level before each log call
        if (
          typeof prop === "string" &&
          ["error", "warn", "info", "http", "verbose", "debug", "silly"].includes(
            prop
          )
        ) {
          updateLevel();
        }
        return target[prop as keyof typeof target];
      },
    });

    return wrappedLogger;
  } catch (error) {
    console.warn(
      "[reforge] Winston is not installed. Install it with: npm install winston"
    );
    return undefined;
  }
}

/**
 * Creates a custom Winston format that includes the Reforge log level.
 *
 * This can be used if you already have a Winston logger instance and want to
 * integrate it with Reforge's dynamic log levels.
 *
 * @param reforge - The Reforge instance
 * @param loggerName - The name of the logger (used to fetch log level from Reforge)
 * @returns A Winston format function
 *
 * @example
 * ```typescript
 * import winston from 'winston';
 * import { createWinstonFormat } from '@reforge-com/node/integrations/winston';
 *
 * const logger = winston.createLogger({
 *   format: winston.format.combine(
 *     createWinstonFormat(reforge, 'my.app.component'),
 *     winston.format.json()
 *   ),
 *   transports: [new winston.transports.Console()]
 * });
 * ```
 */
export async function createWinstonFormat(
  reforge: Reforge,
  loggerName: string
): Promise<any | undefined> {
  try {
    // @ts-ignore - winston is an optional peer dependency
    const winston = await import("winston");

    const levelMap: Record<LogLevel, string> = {
      [LogLevel.Trace]: "debug",
      [LogLevel.Debug]: "debug",
      [LogLevel.Info]: "info",
      [LogLevel.Warn]: "warn",
      [LogLevel.Error]: "error",
      [LogLevel.Fatal]: "error",
    };

    return winston.format((info: any) => {
      const reforgeLevel = reforge.getLogLevel(loggerName);
      info.reforgeLogLevel = levelMap[reforgeLevel];
      return info;
    })();
  } catch (error) {
    console.warn(
      "[reforge] Winston is not installed. Install it with: npm install winston"
    );
    return undefined;
  }
}
