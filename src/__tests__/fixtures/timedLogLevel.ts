import type { Config } from "../../types";
import {
  ConfigValueType,
  ConfigType,
  Criterion_CriterionOperator,
  LogLevel,
} from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config = (start: number, end: number): Config => ({
  id: "33",
  projectId: irrelevantNumber,
  key: "log-level.some.component.path",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [
            {
              propertyName: "reforge.current-time",
              operator: Criterion_CriterionOperator.InIntRange,
              valueToMatch: {
                intRange: {
                  start: BigInt(start),
                  end: BigInt(end),
                },
              },
            },
          ],
          value: { logLevel: LogLevel.Debug },
        },
        {
          criteria: [],
          value: { logLevel: LogLevel.Info },
        },
      ],
    },
  ],
  allowableValues: [],
  configType: ConfigType.LogLevel,
  valueType: ConfigValueType.LogLevel,
  sendToClientSdk: false,
});

export default config;
