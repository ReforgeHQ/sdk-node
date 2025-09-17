import {
  type Config,
  ConfigValueType,
  ConfigType,
  Criterion_CriterionOperator,
} from "../../types";
import { irrelevantNumber, projectEnvIdUnderTest } from "../testHelpers";

const config: Config = {
  id: "992",
  project_id: irrelevantNumber,

  key: "prop.is.one.of.jsonValue",
  changed_by: undefined,
  rows: [
    {
      properties: {},
      project_env_id: irrelevantNumber,
      values: [
        {
          criteria: [],
          value: {
            json: {
              json: JSON.stringify({ result: "wrong projectEnvId" }),
            },
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
            json: {
              json: JSON.stringify({ result: "context-override" }),
            },
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
            json: {
              json: JSON.stringify({ result: "correct" }),
            },
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
            json: {
              json: JSON.stringify({ result: "encrypted" }),
            },
          },
        },
        {
          criteria: [],
          value: {
            json: {
              json: JSON.stringify({ result: "default" }),
            },
          },
        },
      ],
    },
  ],
  allowable_values: [
    {
      json: {
        json: JSON.stringify({ result: "default" }),
      },
    },
    {
      json: {
        json: JSON.stringify({ result: "encrypted" }),
      },
    },
    {
      json: {
        json: JSON.stringify({ result: "correct" }),
      },
    },
    {
      json: {
        json: JSON.stringify({ result: "context-override" }),
      },
    },
    {
      json: {
        json: JSON.stringify({ result: "wrong projectEnvId" }),
      },
    },
  ],
  config_type: ConfigType.Config,
  value_type: ConfigValueType.Json,
  send_to_client_sdk: false,
};
export default config;
