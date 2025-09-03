import {
  type Config,
  ConfigValueType,
  ConfigType,
  Criterion_CriterionOperator,
} from "../../types";
import { irrelevantNumber, projectEnvIdUnderTest } from "../testHelpers";

const config: Config = {
  id: "992",
  projectId: irrelevantNumber,

  key: "prop.is.one.of.jsonValue",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      projectEnvId: irrelevantNumber,
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
      projectEnvId: projectEnvIdUnderTest,
      values: [
        {
          criteria: [
            {
              propertyName: "reforge.user-id",
              operator: Criterion_CriterionOperator.PropIsOneOf,
              valueToMatch: {
                stringList: {
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
              propertyName: "user.country",
              operator: Criterion_CriterionOperator.PropIsOneOf,
              valueToMatch: {
                stringList: {
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
              propertyName: "user.trackingId",
              operator: Criterion_CriterionOperator.PropIsOneOf,
              valueToMatch: {
                stringList: {
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
              propertyName: "user.trackingId",
              operator: Criterion_CriterionOperator.PropIsOneOf,
              valueToMatch: {
                stringList: {
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
  allowableValues: [
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
  configType: ConfigType.Config,
  valueType: ConfigValueType.Json,
  sendToClientSdk: false,
};
export default config;
