import type { Config } from "../../types";
import { ConfigValueType, ConfigType, LogLevel } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: "33",
  projectId: irrelevantNumber,
  key: "log-level.some.component.path",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            logLevel: LogLevel.Info,
          },
        },
      ],
    },
  ],
  allowableValues: [],
  configType: ConfigType.LogLevel,
  valueType: ConfigValueType.LogLevel,
  sendToClientSdk: false,
};

export default config;
