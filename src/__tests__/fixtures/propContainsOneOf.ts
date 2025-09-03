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
  projectId: irrelevantNumber,

  key: "prop.contains",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      projectEnvId: irrelevantNumber,
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
      projectEnvId: projectEnvIdUnderTest,
      values: [
        {
          criteria: [
            {
              propertyName: "user.aka",
              operator: Criterion_CriterionOperator.PropContainsOneOf,
              valueToMatch: {
                stringList: {
                  values: ["one", "two"],
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
  allowableValues: [
    {
      string: "wrong projectEnvId",
    },
    {
      string: "default",
    },
  ],
  configType: ConfigType.Config,
  valueType: ConfigValueType.String,
  sendToClientSdk: false,
};
export default config;
