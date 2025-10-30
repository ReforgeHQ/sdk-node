import { type Config, ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: "888",
  projectId: irrelevantNumber,
  key: "timeout.duration",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            duration: {
              definition: "PT5S", // 5 seconds
            },
          },
        },
      ],
    },
  ],
  allowableValues: [],
  configType: ConfigType.Config,
  valueType: ConfigValueType.Duration,
  sendToClientSdk: false,
};

export default config;
