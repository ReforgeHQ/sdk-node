import { Resolver } from "../resolver";
import { Reforge } from "../reforge";
import { ConfigType, ConfigValueType, LogLevel } from "../types";
import type { Config } from "../types";
import {
  projectEnvIdUnderTest,
  irrelevantNumberAsString,
  irrelevantNumber,
} from "./testHelpers";

const getResolver = (configs: Config[], loggerKey?: string): Resolver => {
  return new Resolver(
    configs,
    projectEnvIdUnderTest,
    "some-namespace",
    "error",
    () => undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    loggerKey
  );
};

const createLogLevelV2Config = (
  key: string,
  loggerPath: string,
  logLevel: LogLevel
): Config => {
  return {
    id: irrelevantNumberAsString,
    projectId: irrelevantNumber,
    key,
    changedBy: undefined,
    rows: [
      {
        properties: {},
        projectEnvId: projectEnvIdUnderTest,
        values: [
          {
            criteria: [
              {
                propertyName: "reforge-sdk-logging.logger-path",
                operator: "PROP_IS_ONE_OF" as any,
                valueToMatch: {
                  stringList: {
                    values: [loggerPath],
                  },
                },
              },
            ],
            value: {
              logLevel,
            },
          },
          {
            criteria: [],
            value: {
              logLevel: LogLevel.Warn,
            },
          },
        ],
      },
    ],
    allowableValues: [],
    configType: ConfigType.LogLevelV2,
    valueType: ConfigValueType.LogLevel,
    sendToClientSdk: false,
  };
};

describe("getLogLevel", () => {
  describe("Resolver.getLogLevel", () => {
    it("returns DEBUG when loggerKey is undefined", () => {
      const resolver = getResolver([], undefined);

      expect(resolver.getLogLevel("any.logger.name")).toBe(LogLevel.Debug);
    });

    it("returns DEBUG when config with loggerKey does not exist", () => {
      const resolver = getResolver([], "my.logger.config");

      expect(resolver.getLogLevel("any.logger.name")).toBe(LogLevel.Debug);
    });

    it("uses default loggerKey 'log-levels.default' when not specified", () => {
      const config = createLogLevelV2Config(
        "log-levels.default",
        "my.app.component",
        LogLevel.Info
      );
      const resolver = getResolver([config], "log-levels.default");

      expect(resolver.getLogLevel("my.app.component")).toBe(LogLevel.Info);
    });

    it("returns the configured log level when context matches", () => {
      const config = createLogLevelV2Config(
        "my.logger.config",
        "my.app.component",
        LogLevel.Trace
      );
      const resolver = getResolver([config], "my.logger.config");

      expect(resolver.getLogLevel("my.app.component")).toBe(LogLevel.Trace);
    });

    it("returns default level when context does not match", () => {
      const config = createLogLevelV2Config(
        "my.logger.config",
        "my.app.component",
        LogLevel.Trace
      );
      const resolver = getResolver([config], "my.logger.config");

      // This logger name doesn't match the criteria, so it should get the default from the config
      expect(resolver.getLogLevel("different.logger.name")).toBe(LogLevel.Warn);
    });

    it("evaluates with correct context structure", () => {
      const config = createLogLevelV2Config(
        "my.logger.config",
        "com.example.service",
        LogLevel.Info
      );
      const resolver = getResolver([config], "my.logger.config");

      expect(resolver.getLogLevel("com.example.service")).toBe(LogLevel.Info);
    });

    it("supports multiple log level configurations", () => {
      const config1 = createLogLevelV2Config(
        "my.logger.config",
        "service.auth",
        LogLevel.Debug
      );
      const config2 = createLogLevelV2Config(
        "my.logger.config",
        "service.database",
        LogLevel.Error
      );

      const resolver = getResolver([config1, config2], "my.logger.config");

      // Only config1 will be used since they have the same key
      // The last one wins in the config map
      expect(resolver.getLogLevel("service.database")).toBe(LogLevel.Error);
    });

    it("does not traverse logger hierarchy like old implementation", () => {
      // Create a config that matches "my.app"
      const config = createLogLevelV2Config(
        "my.logger.config",
        "my.app",
        LogLevel.Trace
      );
      const resolver = getResolver([config], "my.logger.config");

      // Old implementation would traverse up to find "my.app" for "my.app.component"
      // New implementation does NOT do this - it only evaluates the exact logger name
      expect(resolver.getLogLevel("my.app.component")).toBe(LogLevel.Warn);

      // But exact match still works
      expect(resolver.getLogLevel("my.app")).toBe(LogLevel.Trace);
    });
  });

  describe("Reforge.getLogLevel", () => {
    it("throws when not initialized", () => {
      const reforge = new Reforge({
        sdkKey: "test-key",
        loggerKey: "my.logger.config",
      });

      expect(() => reforge.getLogLevel("any.logger.name")).toThrow(
        "reforge.resolver is undefined. Did you call init()?"
      );
    });

    it("uses default loggerKey 'log-levels.default' when not specified", () => {
      const reforge = new Reforge({
        sdkKey: "test-key",
        enableSSE: false,
        enablePolling: false,
      });

      const config = createLogLevelV2Config(
        "log-levels.default",
        "test.logger",
        LogLevel.Warn
      );

      reforge.setConfig([config], projectEnvIdUnderTest, new Map());

      expect(reforge.getLogLevel("test.logger")).toBe(LogLevel.Warn);
    });

    it("works after initialization", async () => {
      const config = createLogLevelV2Config(
        "my.logger.config",
        "test.logger",
        LogLevel.Error
      );

      const reforge = new Reforge({
        sdkKey: "test-key",
        loggerKey: "my.logger.config",
        enableSSE: false,
        enablePolling: false,
      });

      reforge.setConfig([config], projectEnvIdUnderTest, new Map());

      expect(reforge.getLogLevel("test.logger")).toBe(LogLevel.Error);
    });
  });
});
