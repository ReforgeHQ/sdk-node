import { type Config, ConfigValueType, ConfigType } from "../../types";
import {
  irrelevantNumberAsString,
  irrelevantNumber,
  projectEnvIdUnderTest,
} from "../testHelpers";

const config: Config = {
  id: irrelevantNumberAsString,
  project_id: irrelevantNumber,
  key: "rollout.flag",
  changed_by: undefined,
  rows: [
    {
      properties: {},
      project_env_id: irrelevantNumber,
      values: [
        {
          criteria: [],
          value: {
            bool: false,
          },
        },
      ],
    },
    {
      properties: {},
      project_env_id: projectEnvIdUnderTest,
      values: [
        {
          criteria: [],
          value: {
            weighted_values: {
              weighted_values: [
                {
                  weight: 90,
                  value: {
                    bool: false,
                  },
                },
                {
                  weight: 10,
                  value: {
                    bool: true,
                  },
                },
              ],
              hash_by_property_name: "user.trackingId",
            },
          },
        },
      ],
    },
  ],
  allowable_values: [
    {
      bool: false,
    },
    {
      bool: true,
    },
  ],
  config_type: ConfigType.FeatureFlag,
  value_type: ConfigValueType.Bool,
  send_to_client_sdk: false,
};

export default config;
