import { type Config, ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: "999",
  projectId: irrelevantNumber,
  key: "basic.value",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            int: BigInt(42),
          },
        },
      ],
    },
  ],
  allowableValues: [],
  configType: ConfigType.Config,
  valueType: ConfigValueType.Int,
  sendToClientSdk: false,
};

export default config;
