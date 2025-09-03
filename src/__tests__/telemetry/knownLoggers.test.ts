import { knownLoggers, stub } from "../../telemetry/knownLoggers";
import { mockApiClient } from "../testHelpers";
import { LogLevel } from "../../types";

const telemetrySource = "https://telemetry.example.com";

// NOTE: Integration tests for this function are in the reforge.test.ts file.
describe("knownLoggers", () => {
  it("returns stub if collectLoggerCounts is false", () => {
    expect(
      knownLoggers(mockApiClient, telemetrySource, "instanceHash", false)
    ).toBe(stub);
  });

  it("should push log entries to the logger", () => {
    const logger = knownLoggers(
      mockApiClient,
      telemetrySource,
      "instanceHash",
      true
    );
    logger.push("loggerName1", LogLevel.Trace);
    logger.push("loggerName1", LogLevel.Trace);
    logger.push("loggerName2", LogLevel.Debug);

    expect(logger.data).toEqual({
      loggerName1: { [LogLevel.Trace]: 2 },
      loggerName2: { [LogLevel.Debug]: 1 },
    });
  });

  it("should sync log entries to the server", async () => {
    const mockFetchResult = {
      status: 200,
      json: async (): Promise<any> => {
        return await Promise.resolve(JSON.stringify({ key: "value" }));
      },
    };
    mockApiClient.fetch.mockResolvedValue(mockFetchResult);

    const logger = knownLoggers(
      mockApiClient,
      telemetrySource,
      "instanceHash",
      true
    );
    logger.push("loggerName1", LogLevel.Trace);
    logger.push("loggerName1", LogLevel.Debug);
    logger.push("loggerName1", LogLevel.Trace);
    logger.push("loggerName2", LogLevel.Debug);

    const syncResult = await logger.sync();

    expect(mockApiClient.fetch).toHaveBeenCalled();
    expect(syncResult).toEqual({
      status: 200,
      dataSent: expect.objectContaining({
        loggers: [
          {
            loggerName: "loggerName1",
            traces: 2,
            debugs: 1,
          },
          {
            loggerName: "loggerName2",
            debugs: 1,
          },
        ],
        startAt: expect.any(Number),
        endAt: expect.any(Number),
        instanceHash: "instanceHash",
      }),
    });

    expect(logger.data).toEqual({});
  });

  it("won't add data past the maxDataSize", () => {
    const logger = knownLoggers(
      mockApiClient,
      telemetrySource,
      "instanceHash",
      true,
      undefined,
      2
    );
    logger.push("loggerName1", LogLevel.Trace);
    logger.push("loggerName2", LogLevel.Trace);
    logger.push("loggerName3", LogLevel.Debug);
    logger.push("loggerName1", LogLevel.Trace);

    expect(logger.data).toEqual({
      loggerName1: { [LogLevel.Trace]: 2 },
      loggerName2: { [LogLevel.Trace]: 1 },
    });
  });
});
