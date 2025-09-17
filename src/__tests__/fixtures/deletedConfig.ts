import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: "999",
  project_id: irrelevantNumber,
  key: "deleted.value",
  changed_by: undefined,
  rows: [],
  allowable_values: [],
  config_type: ConfigType.Deleted,
  value_type: ConfigValueType.Int,
  send_to_client_sdk: false,
};

export default config;
