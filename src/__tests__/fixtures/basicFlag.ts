import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumberAsString, irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: irrelevantNumberAsString,
  project_id: irrelevantNumber,
  key: "basic.flag",
  changed_by: undefined,
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
  allowable_values: [{ bool: true }, { bool: false }],
  config_type: ConfigType.FeatureFlag,
  value_type: ConfigValueType.Bool,
  send_to_client_sdk: false,
};

export default config;
