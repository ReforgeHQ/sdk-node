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
                propertyName: "user.createdAt",
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
