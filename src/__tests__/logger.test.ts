import type { Config } from "../types";
import {
  ConfigType,
  LogLevel,
  Criterion_CriterionOperator,
  ConfigValueType,
} from "../types";
import { Resolver } from "../resolver";
import { shouldLog, PREFIX, type LogLevelMethodName } from "../logger";
import {
  levelAt,
  irrelevantNumberAsString,
  projectEnvIdUnderTest,
  irrelevantNumber,
} from "./testHelpers";

const getResolver = (configs: Config[]): Resolver => {
  return new Resolver(
    configs,
    projectEnvIdUnderTest,
    "some-namespace",
    "error",
    () => undefined
  );
};

const examples: Array<[LogLevelMethodName, LogLevelMethodName, boolean]> = [
  ["trace", "trace", true],
  ["trace", "debug", true],
  ["trace", "info", true],
  ["trace", "warn", true],
  ["trace", "error", true],
  ["trace", "fatal", true],

  ["debug", "trace", false],
  ["debug", "debug", true],
  ["debug", "info", true],
  ["debug", "warn", true],
  ["debug", "error", true],
  ["debug", "fatal", true],

  ["info", "trace", false],
  ["info", "debug", false],
  ["info", "info", true],
  ["info", "warn", true],
  ["info", "error", true],
  ["info", "fatal", true],

  ["warn", "trace", false],
  ["warn", "debug", false],
  ["warn", "info", false],
  ["warn", "warn", true],
  ["warn", "error", true],
  ["warn", "fatal", true],

  ["error", "trace", false],
  ["error", "debug", false],
  ["error", "info", false],
  ["error", "warn", false],
  ["error", "error", true],
  ["error", "fatal", true],

  ["fatal", "trace", false],
  ["fatal", "debug", false],
  ["fatal", "info", false],
  ["fatal", "warn", false],
  ["fatal", "error", false],
  ["fatal", "fatal", true],
];

describe("shouldLog", () => {
  it("returns true if the resolved level is greater than or equal to the desired level", () => {
    const loggerName = "noDotsHere";
    const resolver = getResolver([levelAt(loggerName, "trace")]);

    expect(
      shouldLog({
        loggerName,
        desiredLevel: LogLevel.Trace,
        resolver,
        defaultLevel: LogLevel.Trace,
      })
    ).toEqual(true);
  });

  examples.forEach(([ruleLevel, desiredLevel, expected]) => {
    it(`returns ${expected.toString()} if the resolved level is ${ruleLevel} and the desired level is ${desiredLevel}`, () => {
      const loggerName = "some.test.name";
      const resolver = getResolver([levelAt(loggerName, ruleLevel)]);
      expect(
        shouldLog({
          loggerName,
          desiredLevel: desiredLevel.toUpperCase() as LogLevel,
          resolver,
          defaultLevel: LogLevel.Warn,
        })
      ).toEqual(expected);
    });
  });

  it("traverses the hierarchy to get the closest level for the loggerName", () => {
    const loggerName = "some.test.name.with.more.levels";
    const resolver = getResolver([
      levelAt("some.test.name", "trace"),
      levelAt("some.test", "debug"),
      levelAt("irrelevant", "error"),
    ]);

    expect(
      shouldLog({
        loggerName,
        defaultLevel: LogLevel.Warn,
        desiredLevel: LogLevel.Trace,
        resolver,
      })
    ).toEqual(true);

    expect(
      shouldLog({
        loggerName: "some.test",
        defaultLevel: LogLevel.Warn,
        desiredLevel: LogLevel.Trace,
        resolver,
      })
    ).toEqual(false);

    expect(
      shouldLog({
        loggerName: "some.test",
        defaultLevel: LogLevel.Warn,
        desiredLevel: LogLevel.Debug,
        resolver,
      })
    ).toEqual(true);

    expect(
      shouldLog({
        loggerName: "some.test",
        defaultLevel: LogLevel.Warn,
        desiredLevel: LogLevel.Info,
        resolver,
      })
    ).toEqual(true);
  });

  it("considers context", () => {
    const loggerName = "some.test.name";

    const config: Config = {
      id: irrelevantNumberAsString,
      project_id: irrelevantNumber,
      key: `${PREFIX}${loggerName}`,
      changed_by: undefined,
      rows: [
        {
          properties: {},
          project_env_id: projectEnvIdUnderTest,
          values: [
            {
              criteria: [
                {
                  property_name: "user.country",
                  operator: Criterion_CriterionOperator.PropIsOneOf,
                  value_to_match: {
                    string_list: {
                      values: ["US", "UK"],
                    },
                  },
                },
              ],
              value: {
                log_level: LogLevel.Info,
              },
            },
            {
              criteria: [],
              value: {
                log_level: LogLevel.Warn,
              },
            },
          ],
        },
      ],
      allowable_values: [],
      config_type: ConfigType.LogLevel,
      value_type: ConfigValueType.LogLevel,
      send_to_client_sdk: false,
    };

    const resolver = getResolver([config]);

    // without context
    expect(
      shouldLog({
        loggerName: "some.test.name.here",
        defaultLevel: LogLevel.Warn,
        desiredLevel: LogLevel.Info,
        resolver,
        contexts: new Map(),
      })
    ).toEqual(false);

    // with non-matching context
    expect(
      shouldLog({
        loggerName: "some.test.name.here",
        defaultLevel: LogLevel.Warn,
        desiredLevel: LogLevel.Info,
        resolver,
        contexts: new Map().set("user", new Map().set("country", "CA")),
      })
    ).toEqual(false);

    // with matching context
    expect(
      shouldLog({
        loggerName: "some.test.name.here",
        defaultLevel: LogLevel.Warn,
        desiredLevel: LogLevel.Info,
        resolver,
        contexts: new Map().set("user", new Map().set("country", "US")),
      })
    ).toEqual(true);
  });

  it("returns the default level provided if there is no match", () => {
    const resolver = getResolver([levelAt("irrelevant", "error")]);
    const loggerName = "a.b.c.d";

    expect(
      shouldLog({
        loggerName,
        desiredLevel: LogLevel.Debug,
        defaultLevel: LogLevel.Trace,
        resolver,
      })
    ).toEqual(true);

    expect(
      shouldLog({
        loggerName,
        desiredLevel: LogLevel.Debug,
        defaultLevel: LogLevel.Debug,
        resolver,
      })
    ).toEqual(true);

    expect(
      shouldLog({
        loggerName,
        desiredLevel: LogLevel.Debug,
        defaultLevel: LogLevel.Info,
        resolver,
      })
    ).toEqual(false);
  });
});
