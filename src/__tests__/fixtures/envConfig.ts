import { type Config, ConfigValueType, ConfigType } from "../../types";
import {
  irrelevantNumberAsString,
  irrelevantNumber,
  projectEnvIdUnderTest,
} from "../testHelpers";

const config: Config = {
  id: irrelevantNumberAsString,
  projectId: irrelevantNumber,
  key: "basic.env",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      projectEnvId: projectEnvIdUnderTest,
      values: [
        {
          criteria: [],
          value: {
            stringList: {
              values: ["a", "b", "c", "d"],
            },
          },
        },
      ],
    },
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            stringList: {
              values: ["no"],
            },
          },
        },
      ],
    },
  ],
  configType: ConfigType.Config,
  allowableValues: [],
  valueType: ConfigValueType.StringList,
  sendToClientSdk: false,
};

export default config;
