import type { Config } from "../../types";
import { ConfigValueType, ConfigType, LogLevel } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: "33",
  project_id: irrelevantNumber,
  key: "log-level.some.component.path",
  changed_by: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            log_level: LogLevel.Info,
          },
        },
      ],
    },
  ],
  allowable_values: [],
  config_type: ConfigType.LogLevel,
  value_type: ConfigValueType.LogLevel,
  send_to_client_sdk: false,
};

export default config;
