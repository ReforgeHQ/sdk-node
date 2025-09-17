import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: "999",
  project_id: irrelevantNumber,
  key: "reforge.secrets.encryption.key",
  changed_by: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            string:
              "7ce2dbcc3e0b463c99575bf5b2fc164c51166d065043b9f322bb6d7228b14a3a",
          },
        },
      ],
    },
  ],
  allowable_values: [],
  config_type: ConfigType.Config,
  value_type: ConfigValueType.String,
  send_to_client_sdk: false,
};

export default config;
