import type { Config } from "../../types";
import {
  ConfigValueType,
  ConfigType,
  Criterion_CriterionOperator,
} from "../../types";
import {
  irrelevantNumberAsString,
  irrelevantNumber,
  projectEnvIdUnderTest,
} from "../testHelpers";

const config: Config = {
  id: irrelevantNumberAsString,
  project_id: irrelevantNumber,

  key: "prop.is.not.one.of",
  changed_by: undefined,
  rows: [
    {
      properties: {},
      project_env_id: irrelevantNumber,
      values: [
        {
          criteria: [],
          value: {
            string: "wrong projectEnvId",
          },
        },
      ],
    },
    {
      properties: {},
      project_env_id: projectEnvIdUnderTest,
      values: [
        {
          criteria: [
            {
              property_name: "user.country",
              operator: Criterion_CriterionOperator.PropIsNotOneOf,
              value_to_match: {
                string_list: {
                  values: ["US", "UK"],
                },
              },
            },
          ],
          value: {
            string: "correct",
          },
        },
        {
          criteria: [],
          value: {
            string: "default",
          },
        },
      ],
    },
  ],
  allowable_values: [
    {
      string: "correct",
    },
    {
      string: "wrong projectEnvId",
    },
    {
      string: "default",
    },
  ],
  config_type: ConfigType.Config,
  value_type: ConfigValueType.String,
  send_to_client_sdk: false,
};
export default config;
