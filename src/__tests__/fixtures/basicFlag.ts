import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumberAsString, irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: irrelevantNumberAsString,
  projectId: irrelevantNumber,
  key: "basic.flag",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            bool: true,
          },
        },
      ],
    },
  ],
  allowableValues: [{ bool: true }, { bool: false }],
  configType: ConfigType.FeatureFlag,
  valueType: ConfigValueType.Bool,
  sendToClientSdk: false,
};

export default config;
