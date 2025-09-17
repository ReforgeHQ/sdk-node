import {
  type Config,
  ConfigValueType,
  ConfigType,
  type Criterion_CriterionOperator,
} from "../../types";
import { irrelevantNumber } from "../testHelpers";

const createConfig = (
  key: string,
  propertyName: string,
  valueToMatch: string,
  operator:
    | Criterion_CriterionOperator.PropMatches
    | Criterion_CriterionOperator.PropDoesNotMatch
): Config => {
  return {
    id: "999",
    project_id: irrelevantNumber,
    key,
    changed_by: undefined,
    rows: [
      {
        properties: {},
        values: [
          {
            criteria: [
              {
                property_name: propertyName,
                operator,
                value_to_match: {
                  string: valueToMatch,
                },
              },
            ],
            value: {
              bool: true,
            },
          },
          {
            criteria: [],
            value: {
              bool: false,
            },
          },
        ],
      },
    ],
    allowable_values: [],
    config_type: ConfigType.Config,
    value_type: ConfigValueType.Bool,
    send_to_client_sdk: false,
  };
};

export { createConfig };
