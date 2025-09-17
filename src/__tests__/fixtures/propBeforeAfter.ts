import {
  type Config,
  ConfigValueType,
  ConfigType,
  Criterion_CriterionOperator,
} from "../../types";
import { irrelevantNumber } from "../testHelpers";

function createConfig(
  key: string,
  valueToMatch: object,
  operator:
    | Criterion_CriterionOperator.PropBefore
    | Criterion_CriterionOperator.PropAfter
): Config {
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
                property_name: "user.createdAt",
                operator,
                value_to_match: valueToMatch, // Directly use the passed object
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
}

export const epochMillis = 1738359581000;
export const dateString = "2025-01-31T21:39:41Z";
export const configAfterWithInt = createConfig(
  "prop.after",
  { int: epochMillis },
  Criterion_CriterionOperator.PropAfter
); // int type
export const configAfterWithString = createConfig(
  "prop.after",
  { string: dateString },
  Criterion_CriterionOperator.PropAfter
); // string type
export const configBeforeWithInt = createConfig(
  "prop.before",
  { int: epochMillis },
  Criterion_CriterionOperator.PropBefore
); // int type
export const configBeforeWithString = createConfig(
  "prop.before",
  { string: dateString },
  Criterion_CriterionOperator.PropBefore
); // string type
