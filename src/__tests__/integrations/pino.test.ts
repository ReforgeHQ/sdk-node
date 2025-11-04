import { Reforge } from "../../reforge";
import { LogLevel } from "../../types";
import { createPinoLogger, createPinoHook } from "../../integrations/pino";
import { projectEnvIdUnderTest } from "../testHelpers";

// Check if pino is installed
let pinoInstalled = false;
try {
  require.resolve("pino");
  pinoInstalled = true;
} catch {
  pinoInstalled = false;
}

// Create a mock logger function
const mockPinoLogger: any = {
  level: "info",
  trace: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
};

const mockPinoFn = jest.fn((options: any) => {
  mockPinoLogger.level = options.level;
  return mockPinoLogger;
});

// Mock the pino module using doMock with moduleFactory
if (pinoInstalled) {
  jest.doMock(
    "pino",
    () => ({
      default: mockPinoFn,
    }),
    { virtual: true }
  );
}

describe("Pino Integration", () => {
  beforeAll(() => {
    if (!pinoInstalled) {
      console.log(
        "Skipping Pino integration tests - pino not installed. Install with: npm install pino"
      );
    }
  });
  let reforge: Reforge;

  beforeEach(() => {
    reforge = new Reforge({
      sdkKey: "test-key",
      loggerKey: "my.logger.config",
      enableSSE: false,
      enablePolling: false,
    });

    reforge.setConfig(
      [
        {
          id: "1",
          projectId: 1,
          key: "my.logger.config",
          changedBy: undefined,
          rows: [
            {
              properties: {},
              projectEnvId: projectEnvIdUnderTest,
              values: [
                {
                  criteria: [],
                  value: {
                    logLevel: LogLevel.Debug,
                  },
                },
              ],
            },
          ],
          allowableValues: [],
          configType: "LOG_LEVEL_V2" as any,
          valueType: "LOG_LEVEL" as any,
          sendToClientSdk: false,
        },
      ],
      projectEnvIdUnderTest,
      new Map()
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createPinoLogger", () => {
    (pinoInstalled ? it : it.skip)(
      "creates a Pino logger with the correct initial level",
      async () => {
        const logger = await createPinoLogger(reforge, "my.app.component");

        expect(logger).toBeDefined();
        expect(logger.level).toBe("debug");
      }
    );

    (pinoInstalled ? it : it.skip)(
      "includes the logger name in options",
      async () => {
        await createPinoLogger(reforge, "my.app.component");

        expect(mockPinoFn).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "my.app.component",
            level: "debug",
          })
        );
      }
    );

    (pinoInstalled ? it : it.skip)("merges custom Pino options", async () => {
      const customOptions = {
        transport: { target: "pino-pretty" },
        base: { pid: 123 },
      };

      await createPinoLogger(reforge, "my.app.component", customOptions);

      expect(mockPinoFn).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "my.app.component",
          level: "debug",
          transport: { target: "pino-pretty" },
          base: { pid: 123 },
        })
      );
    });

    (pinoInstalled ? it : it.skip)(
      "maps Reforge log levels to Pino levels correctly",
      async () => {
        const testCases = [
          { reforge: LogLevel.Trace, pino: "trace" },
          { reforge: LogLevel.Debug, pino: "debug" },
          { reforge: LogLevel.Info, pino: "info" },
          { reforge: LogLevel.Warn, pino: "warn" },
          { reforge: LogLevel.Error, pino: "error" },
          { reforge: LogLevel.Fatal, pino: "fatal" },
        ];

        for (const testCase of testCases) {
          // Update config for each level
          reforge.setConfig(
            [
              {
                id: "1",
                projectId: 1,
                key: "my.logger.config",
                changedBy: undefined,
                rows: [
                  {
                    properties: {},
                    projectEnvId: projectEnvIdUnderTest,
                    values: [
                      {
                        criteria: [],
                        value: {
                          logLevel: testCase.reforge,
                        },
                      },
                    ],
                  },
                ],
                allowableValues: [],
                configType: "LOG_LEVEL_V2" as any,
                valueType: "LOG_LEVEL" as any,
                sendToClientSdk: false,
              },
            ],
            projectEnvIdUnderTest,
            new Map()
          );

          const logger = await createPinoLogger(reforge, "my.app.component");
          expect(logger.level).toBe(testCase.pino);
        }
      }
    );
  });

  describe("createPinoHook", () => {
    (pinoInstalled ? it : it.skip)(
      "returns a mixin function that includes the Reforge log level",
      () => {
        const mixin = createPinoHook(reforge, "my.app.component");
        const result = mixin();

        expect(result).toHaveProperty("reforgeLogLevel");
        expect(result["reforgeLogLevel"]).toBe("debug");
      }
    );

    (pinoInstalled ? it : it.skip)(
      "updates when Reforge log level changes",
      () => {
        const mixin = createPinoHook(reforge, "my.app.component");

        let result = mixin();
        expect(result["reforgeLogLevel"]).toBe("debug");

        // Update the config
        reforge.setConfig(
          [
            {
              id: "1",
              projectId: 1,
              key: "my.logger.config",
              changedBy: undefined,
              rows: [
                {
                  properties: {},
                  projectEnvId: projectEnvIdUnderTest,
                  values: [
                    {
                      criteria: [],
                      value: {
                        logLevel: LogLevel.Error,
                      },
                    },
                  ],
                },
              ],
              allowableValues: [],
              configType: "LOG_LEVEL_V2" as any,
              valueType: "LOG_LEVEL" as any,
              sendToClientSdk: false,
            },
          ],
          projectEnvIdUnderTest,
          new Map()
        );

        result = mixin();
        expect(result["reforgeLogLevel"]).toBe("error");
      }
    );
  });
});
