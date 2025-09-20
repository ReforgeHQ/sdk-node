import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

// This is technically a deleted config. It has no rows, but its configType is still CONFIG (rather than DELETED)

const config: Config = {
  id: "999",
  projectId: irrelevantNumber,
  key: "mostly.deleted.value",
  changedBy: undefined,
  rows: [],
  allowableValues: [],
  configType: ConfigType.Config,
  valueType: ConfigValueType.Int,
  sendToClientSdk: false,
};

export default config;
