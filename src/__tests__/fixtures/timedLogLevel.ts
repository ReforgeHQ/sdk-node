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
  project_id: irrelevantNumber,
  key: "log-level.some.component.path",
  changed_by: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [
            {
              property_name: "reforge.current-time",
              operator: Criterion_CriterionOperator.InIntRange,
              value_to_match: {
                int_range: {
                  start: BigInt(start),
                  end: BigInt(end),
                },
              },
            },
          ],
          value: { log_level: LogLevel.Debug },
        },
        {
          criteria: [],
          value: { log_level: LogLevel.Info },
        },
      ],
    },
  ],
  allowable_values: [],
  config_type: ConfigType.LogLevel,
  value_type: ConfigValueType.LogLevel,
  send_to_client_sdk: false,
});

export default config;
