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
    | Criterion_CriterionOperator.PropLessThan
    | Criterion_CriterionOperator.PropLessThanOrEqual
    | Criterion_CriterionOperator.PropGreaterThan
    | Criterion_CriterionOperator.PropGreaterThanOrEqual
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
                property_name: propertyName,
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
export const propertyName: string = "organization.memberCount";
export const testValueInt = BigInt(100);
export const testValueDouble = 100.0;
export const configLessThanInt = createConfig(
  "prop.lessThanInt",
  { int: testValueInt },
  Criterion_CriterionOperator.PropLessThan
); // int type
export const configLessThanDouble = createConfig(
  "prop.lessThanDouble",
  { double: testValueDouble },
  Criterion_CriterionOperator.PropLessThan
);
export const configLessThanEqualInt = createConfig(
  "prop.lessThanEqualInt",
  { int: testValueInt },
  Criterion_CriterionOperator.PropLessThanOrEqual
); // int type
export const configLessThanEqualDouble = createConfig(
  "prop.lessThanEqualDouble",
  { double: testValueDouble },
  Criterion_CriterionOperator.PropLessThanOrEqual
);
export const configGreaterThanInt = createConfig(
  "prop.greaterThanInt",
  { int: testValueInt },
  Criterion_CriterionOperator.PropGreaterThan
); // int type
export const configGreaterThanDouble = createConfig(
  "prop.greaterThanDouble",
  { double: testValueDouble },
  Criterion_CriterionOperator.PropGreaterThan
);
export const configGreaterThanEqualInt = createConfig(
  "prop.greaterThanEqualInt",
  { int: testValueInt },
  Criterion_CriterionOperator.PropGreaterThanOrEqual
); // int type
export const configGreaterThanEqualDouble = createConfig(
  "prop.greaterThanEqualDouble",
  { double: testValueDouble },
  Criterion_CriterionOperator.PropGreaterThanOrEqual
);
