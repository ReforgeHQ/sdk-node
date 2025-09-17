import { type Config, ConfigValueType, ConfigType } from "../../types";
import {
  irrelevantNumberAsString,
  irrelevantNumber,
  projectEnvIdUnderTest,
} from "../testHelpers";

const config: Config = {
  id: irrelevantNumberAsString,
  project_id: irrelevantNumber,
  key: "basic.env",
  changed_by: undefined,
  rows: [
    {
      properties: {},
      project_env_id: projectEnvIdUnderTest,
      values: [
        {
          criteria: [],
          value: {
            string_list: {
              values: ["a", "b", "c", "d"],
            },
          },
        },
      ],
    },
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            string_list: {
              values: ["no"],
            },
          },
        },
      ],
    },
  ],
  config_type: ConfigType.Config,
  allowable_values: [],
  value_type: ConfigValueType.StringList,
  send_to_client_sdk: false,
};

export default config;
