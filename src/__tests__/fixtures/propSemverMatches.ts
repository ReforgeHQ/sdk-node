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
    | Criterion_CriterionOperator.PropSemverLessThan
    | Criterion_CriterionOperator.PropSemverEqual
    | Criterion_CriterionOperator.PropSemverGreaterThan
): Config => {
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
                valueToMatch: {
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
    allowableValues: [],
    configType: ConfigType.Config,
    valueType: ConfigValueType.Bool,
    sendToClientSdk: false,
  };
};

export { createConfig };
