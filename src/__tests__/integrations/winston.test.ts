import { Reforge } from "../../reforge";
import { LogLevel } from "../../types";
import {
  createWinstonLogger,
  createWinstonFormat,
} from "../../integrations/winston";
import { projectEnvIdUnderTest } from "../testHelpers";

// Check if winston is installed
let winstonInstalled = false;
try {
  require.resolve("winston");
  winstonInstalled = true;
} catch {
  winstonInstalled = false;
}

// Create mock Winston objects
const mockWinstonLogger: any = {
  level: "info",
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  http: jest.fn(),
  verbose: jest.fn(),
  debug: jest.fn(),
  silly: jest.fn(),
};

const mockCreateLogger = jest.fn((options: any) => {
  mockWinstonLogger.level = options.level;
  return mockWinstonLogger;
});

// Mock the winston module using doMock with moduleFactory
if (winstonInstalled) {
  jest.doMock(
    "winston",
    () => ({
      createLogger: mockCreateLogger,
      format: {
        combine: jest.fn((...formats: any[]) => formats),
        timestamp: jest.fn(),
        errors: jest.fn(() => "errors"),
        splat: jest.fn(),
        json: jest.fn(),
      },
      transports: {
        Console: jest.fn(),
      },
    }),
    { virtual: true }
  );
}

describe("Winston Integration", () => {
  beforeAll(() => {
    if (!winstonInstalled) {
      console.log(
        "Skipping Winston integration tests - winston not installed. Install with: npm install winston"
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

  describe("createWinstonLogger", () => {
    (winstonInstalled ? it : it.skip)(
      "creates a Winston logger with the correct initial level",
      async () => {
        const logger = await createWinstonLogger(reforge, "my.app.component");

        expect(logger).toBeDefined();
        expect(logger.level).toBe("debug");
      }
    );

    (winstonInstalled ? it : it.skip)(
      "includes the logger name in defaultMeta",
      async () => {
        await createWinstonLogger(reforge, "my.app.component");

        expect(mockCreateLogger).toHaveBeenCalledWith(
          expect.objectContaining({
            level: "debug",
            defaultMeta: { loggerName: "my.app.component" },
          })
        );
      }
    );

    (winstonInstalled ? it : it.skip)(
      "merges custom Winston options",
      async () => {
        const customOptions = {
          transports: [],
          exitOnError: false,
        };

        await createWinstonLogger(reforge, "my.app.component", customOptions);

        expect(mockCreateLogger).toHaveBeenCalledWith(
          expect.objectContaining({
            level: "debug",
            exitOnError: false,
          })
        );
      }
    );

    (winstonInstalled ? it : it.skip)(
      "maps Reforge log levels to Winston levels correctly",
      async () => {
        const testCases = [
          { reforge: LogLevel.Trace, winston: "debug" }, // Winston doesn't have trace
          { reforge: LogLevel.Debug, winston: "debug" },
          { reforge: LogLevel.Info, winston: "info" },
          { reforge: LogLevel.Warn, winston: "warn" },
          { reforge: LogLevel.Error, winston: "error" },
          { reforge: LogLevel.Fatal, winston: "error" }, // Winston doesn't have fatal
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

          const logger = await createWinstonLogger(reforge, "my.app.component");
          expect(logger.level).toBe(testCase.winston);
        }
      }
    );
  });

  describe("createWinstonFormat", () => {
    (winstonInstalled ? it : it.skip)(
      "returns a Winston format function",
      async () => {
        const format = await createWinstonFormat(reforge, "my.app.component");

        expect(format).toBeDefined();
      }
    );
  });
});
