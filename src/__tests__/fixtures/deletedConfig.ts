import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config: Config = {
  id: "999",
  projectId: irrelevantNumber,
  key: "deleted.value",
  changedBy: undefined,
  rows: [],
  allowableValues: [],
  configType: ConfigType.Deleted,
  valueType: ConfigValueType.Int,
  sendToClientSdk: false,
};

export default config;
