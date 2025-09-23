import { ConfigValueType, ConfigType } from "../types";
import type { Config, LogLevel } from "../types";
import { type LogLevelMethodName, PREFIX } from "../logger";

export const nTimes = (n: number, fn: () => void): void => {
  for (let i = 0; i < n; i++) {
    fn();
  }
};

export const projectEnvIdUnderTest = 5;
export const emptyContexts = new Map();
export const irrelevant = "this value does not matter";
export const irrelevantNumberAsString = "-1";
export const irrelevantNumber = -1;

export const levelAt = (path: string, level: LogLevelMethodName): Config => {
  return {
    id: irrelevantNumberAsString,
    projectId: irrelevantNumber,
    key: `${PREFIX}${path}`,
    changedBy: undefined,
    rows: [
      {
        properties: {},
        values: [
          {
            criteria: [],
            value: {
              logLevel: level.toUpperCase() as LogLevel,
            },
          },
        ],
      },
    ],
    allowableValues: [],
    configType: ConfigType.LogLevel,
    valueType: ConfigValueType.LogLevel,
    sendToClientSdk: true,
  };
};

export const mockApiClient = {
  fetch: jest.fn(async () => ({
    status: 200,
    json: async (): Promise<any> => {
      return await Promise.resolve(JSON.stringify({ key: "value" }));
    },
  })),
};
