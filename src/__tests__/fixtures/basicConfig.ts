import { type Config, ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: "999",
  project_id: irrelevantNumber,
  key: "basic.value",
  changed_by: undefined,
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
  allowable_values: [],
  config_type: ConfigType.Config,
  value_type: ConfigValueType.Int,
  send_to_client_sdk: false,
};

export default config;
