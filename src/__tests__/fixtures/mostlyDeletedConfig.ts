import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

// This is technically a deleted config. It has no rows, but its configType is still CONFIG (rather than DELETED)

const config: Config = {
  id: "999",
  project_id: irrelevantNumber,
  key: "mostly.deleted.value",
  changed_by: undefined,
  rows: [],
  allowable_values: [],
  config_type: ConfigType.Config,
  value_type: ConfigValueType.Int,
  send_to_client_sdk: false,
};

export default config;
