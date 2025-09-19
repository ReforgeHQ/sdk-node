import type { Config } from "../../types";
import {
  ConfigValueType,
  ConfigType,
  Criterion_CriterionOperator,
} from "../../types";
import { irrelevantNumber, projectEnvIdUnderTest } from "../testHelpers";

const config: Config = {
  id: "991",
  project_id: irrelevantNumber,

  key: "prop.is.one.of",
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
              property_name: "reforge.user-id",
              operator: Criterion_CriterionOperator.PropIsOneOf,
              value_to_match: {
                string_list: {
                  values: ["4", "5"],
                },
              },
            },
          ],
          value: {
            string: "context-override",
          },
        },
        {
          criteria: [
            {
              property_name: "user.country",
              operator: Criterion_CriterionOperator.PropIsOneOf,
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
          criteria: [
            {
              property_name: "user.trackingId",
              operator: Criterion_CriterionOperator.PropIsOneOf,
              value_to_match: {
                string_list: {
                  values: ["CONFIDENTIAL"],
                },
              },
            },
          ],
          value: {
            confidential: true,
            string: "For British Eyes Only",
          },
        },
        {
          criteria: [
            {
              property_name: "user.trackingId",
              operator: Criterion_CriterionOperator.PropIsOneOf,
              value_to_match: {
                string_list: {
                  values: ["SECRET"],
                },
              },
            },
          ],
          value: {
            decrypt_with: "reforge.secrets.encryption.key",
            string:
              "9cf7cb1581853fb38e5ac3--9b5eb8e37fd79c52ef907b40--77cb8ca1fa2ef3e7714ad3b505f657d1",
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
