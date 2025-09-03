import type { Config } from "../../types";
import {
  ConfigValueType,
  ConfigType,
  Criterion_CriterionOperator,
} from "../../types";
import { irrelevantNumber, projectEnvIdUnderTest } from "../testHelpers";

const config: Config = {
  id: "991",
  projectId: irrelevantNumber,

  key: "prop.is.one.of",
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
            string: "context-override",
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
            string: "correct",
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
            decryptWith: "reforge.secrets.encryption.key",
            string:
              "8933c39f7f73b6e815dfbe--b3f5216809e719efd8803dad--b16761b9418d8145a98f88a631681298",
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
      string: "correct",
    },
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
