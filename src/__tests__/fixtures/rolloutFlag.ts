import { type Config, ConfigValueType, ConfigType } from "../../types";
import {
  irrelevantNumberAsString,
  irrelevantNumber,
  projectEnvIdUnderTest,
} from "../testHelpers";

const config: Config = {
  id: irrelevantNumberAsString,
  projectId: irrelevantNumber,
  key: "rollout.flag",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      projectEnvId: irrelevantNumber,
      values: [
        {
          criteria: [],
          value: {
            bool: false,
          },
        },
      ],
    },
    {
      properties: {},
      projectEnvId: projectEnvIdUnderTest,
      values: [
        {
          criteria: [],
          value: {
            weightedValues: {
              weightedValues: [
                {
                  weight: 90,
                  value: {
                    bool: false,
                  },
                },
                {
                  weight: 10,
                  value: {
                    bool: true,
                  },
                },
              ],
              hashByPropertyName: "user.trackingId",
            },
          },
        },
      ],
    },
  ],
  allowableValues: [
    {
      bool: false,
    },
    {
      bool: true,
    },
  ],
  configType: ConfigType.FeatureFlag,
  valueType: ConfigValueType.Bool,
  sendToClientSdk: false,
};

export default config;
