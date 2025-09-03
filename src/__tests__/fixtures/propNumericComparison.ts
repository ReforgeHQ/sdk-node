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
    projectId: irrelevantNumber,
    key,
    changedBy: undefined,
    rows: [
      {
        properties: {},
        values: [
          {
            criteria: [
              {
                propertyName,
                operator,
                valueToMatch, // Directly use the passed object
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
    allowableValues: [],
    configType: ConfigType.Config,
    valueType: ConfigValueType.Bool,
    sendToClientSdk: false,
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
