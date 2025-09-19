import * as path from "path";
import fs from "fs";
import { spawn } from "child_process";

import basicConfig from "./fixtures/basicConfig";
import { DEFAULT_SOURCES } from "../sources";
import deletedConfig from "./fixtures/deletedConfig";
import basicFlag from "./fixtures/basicFlag";
import rolloutFlag from "./fixtures/rolloutFlag";
import envConfig from "./fixtures/envConfig";
import propIsOneOf from "./fixtures/propIsOneOf";
import propIsOneOfAndEndsWith from "./fixtures/propIsOneOfAndEndsWith";
import {
  Reforge,
  type TypedNodeServerConfigurationRaw,
  MULTIPLE_INIT_WARNING,
} from "../reforge";
import type { Contexts, ProjectEnvId, Config, ConfigValue } from "../types";
import {
  LogLevel,
  Criterion_CriterionOperator,
  ConfigType,
  ConfigValueType,
} from "../types";
import { encrypt, generateNewHexKey } from "../encryption";
import secretConfig from "./fixtures/secretConfig";
import decryptionKeyConfig from "./fixtures/decryptionKeyConfig";

import {
  nTimes,
  irrelevant,
  projectEnvIdUnderTest,
  levelAt,
  irrelevantNumber,
} from "./testHelpers";
import mostlyDeletedConfig from "./fixtures/mostlyDeletedConfig";
import { jsonStringifyWithBigInt } from "../bigIntUtils";

const configs = [
  basicConfig,
  basicFlag,
  envConfig,
  propIsOneOf,
  propIsOneOfAndEndsWith,
  rolloutFlag,
  deletedConfig,
];

afterEach(() => {
  jest.restoreAllMocks();
});

const validSdkKey = process.env["REFORGE_TEST_SDK_KEY"];

if (validSdkKey === undefined) {
  throw new Error(
    "You must set the REFORGE_TEST_SDK_KEY environment variable to run these tests."
  );
}

const defaultOptions = {
  collectLoggerCounts: false,
  contextUploadMode: "none" as const,
  collectEvaluationSummaries: false,
};

describe("reforge", () => {
  beforeEach(() => {
    process.env["REFORGE_API_URL_OVERRIDE"] = "";
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("init", () => {
    const invalidSdkKey = "this won't work";

    it("can parse config from the CDN", async () => {
      const reforge = new Reforge({
        ...defaultOptions,
        sdkKey: validSdkKey,
      });
      await reforge.init();

      expect(reforge.get("abc")).toEqual(true);
    });

    it("throws a 401 if you have an invalid API key", async () => {
      const reforge = new Reforge({ sdkKey: invalidSdkKey });

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(reforge.init()).rejects.toThrow(
        "Unauthorized. Check your Reforge SDK API key for https://secondary.reforge.com/api/v1/configs/0"
      );

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    [mostlyDeletedConfig, deletedConfig].forEach((deletionConfig) => {
      it(`clobbers deleted config with ${deletionConfig.key}`, () => {
        const reforge = new Reforge({
          sdkKey: irrelevant,
        });

        const missingValue = "_missing_";
        const presentValue = 42;

        const configToBeDeleted: Config = {
          id: "999",
          project_id: irrelevantNumber,
          key: deletionConfig.key,
          changed_by: undefined,
          rows: [
            {
              properties: {},
              values: [{ criteria: [], value: { int: BigInt(presentValue) } }],
            },
          ],
          allowable_values: [],
          config_type: ConfigType.Config,
          value_type: ConfigValueType.Int,
          send_to_client_sdk: false,
        };

        reforge.setConfig(
          [configToBeDeleted],
          projectEnvIdUnderTest,
          new Map()
        );

        expect(
          reforge.get(deletionConfig.key, new Map(), missingValue)
        ).toEqual(presentValue);

        // `as any` to avoid the fact that resolver is private
        (reforge as any).resolver.update([deletionConfig]);

        expect(
          reforge.get(deletionConfig.key, new Map(), missingValue)
        ).toEqual(missingValue);
      });
    });

    it("allows overriding sources with REFORGE_API_URL_OVERRIDE env var", () => {
      const reforgeDefault = new Reforge({
        sdkKey: irrelevant,
      });

      expect(reforgeDefault.sources.configSources).toEqual(DEFAULT_SOURCES);

      process.env["REFORGE_API_URL_OVERRIDE"] = "https://example.com";

      const reforgeWithOverride = new Reforge({
        sdkKey: irrelevant,
      });

      expect(reforgeWithOverride.sources.configSources).toEqual([
        "https://example.com",
      ]);
    });

    it("allows specifying sources", () => {
      const reforgeDefault = new Reforge({
        sdkKey: irrelevant,
      });

      expect(reforgeDefault.sources.configSources).toEqual(DEFAULT_SOURCES);

      const reforgeWithOverride = new Reforge({
        sdkKey: irrelevant,
        sources: ["https://example.com", "https://2.example.com"],
      });

      expect(reforgeWithOverride.sources.configSources).toEqual([
        "https://example.com",
        "https://2.example.com",
      ]);
    });

    it("allows for polling", async () => {
      let updateCount = 0;

      const pollPromise = new Promise((resolve) => {
        const reforge = new Reforge({
          ...defaultOptions,
          sdkKey: validSdkKey,
          enablePolling: true,
          pollInterval: 10,
          onUpdate: () => {
            updateCount++;

            if (updateCount > 2) {
              reforge.stopPolling();
              resolve("onUpdate fired");
            }
          },
        });

        reforge.init().catch((e) => {
          console.error(e);
        });
      });

      const result = await pollPromise;

      expect(result).toEqual("onUpdate fired");
      expect(updateCount).toBeGreaterThan(2);
    });

    it("warns when called multiple times if enablePolling is set", async () => {
      const reforge = new Reforge({
        ...defaultOptions,
        sdkKey: validSdkKey,
        enablePolling: true,
      });

      const mock = jest.spyOn(console, "warn").mockImplementation();

      await reforge.init();
      expect(mock).not.toHaveBeenCalled();

      await reforge.init();
      expect(mock).toHaveBeenCalledTimes(2);
      expect(mock.mock.calls).toStrictEqual([
        [MULTIPLE_INIT_WARNING],
        ["Reforge already initialized."],
      ]);
      mock.mockRestore();
    });

    it("warns when called multiple times if enableSSE is set", async () => {
      const reforge = new Reforge({
        ...defaultOptions,
        sdkKey: validSdkKey,
        enableSSE: true,
      });

      const mock = jest.spyOn(console, "warn").mockImplementation();

      await reforge.init();
      expect(mock).not.toHaveBeenCalled();

      await reforge.init();
      expect(mock).toHaveBeenCalledTimes(2);
      expect(mock.mock.calls).toStrictEqual([
        [MULTIPLE_INIT_WARNING],
        ["Reforge already initialized."],
      ]);
      mock.mockRestore();
    });

    it("does not warn when init is called multiple times if enableSSE and enablePolling are false", async () => {
      const reforge = new Reforge({
        sdkKey: validSdkKey,
        enableSSE: false,
        enablePolling: false,
      });

      const mock = jest.spyOn(console, "warn").mockImplementation();

      await reforge.init();
      expect(mock).not.toHaveBeenCalled();

      await reforge.init();
      expect(mock).toHaveBeenCalledTimes(1);
      expect(mock.mock.calls).toStrictEqual([["Reforge already initialized."]]);
      mock.mockRestore();
    });

    it("loads remote config so Reforge can provided value", async () => {
      process.env["MY_ENV_VAR"] = "EXAMPLE";

      const reforge = new Reforge({
        sdkKey: validSdkKey,
        collectLoggerCounts: false,
        contextUploadMode: "none",
      });

      await reforge.init();

      expect(reforge.get("basic.provided")).toEqual("EXAMPLE");
    });

    it("allows setting a run-time config", async () => {
      const reforge = new Reforge({
        sdkKey: validSdkKey,
        collectLoggerCounts: false,
        contextUploadMode: "none",
      });

      await reforge.init({ runtimeConfig: [["hello", { int: BigInt(19) }]] });

      expect(reforge.get("hello")).toEqual(19);
    });
  });

  describe("updateNow", () => {
    it("immediately fetches new config", async () => {
      let reforge: Reforge | undefined;

      let updatePromise: Promise<string> | undefined;

      const initPromise = new Promise((resolveInit) => {
        updatePromise = new Promise((resolveUpdate) => {
          reforge = new Reforge({
            ...defaultOptions,
            sdkKey: validSdkKey,
            enablePolling: false,
            enableSSE: false,
            onUpdate: () => {
              resolveUpdate("updated");
            },
          });

          reforge
            .init()
            .then(() => {
              resolveInit("init");
            })
            .catch((e) => {
              console.error(e);
            });
        });
      });

      await initPromise;

      if (reforge === undefined) {
        throw new Error("reforge is undefined");
      }

      await reforge.updateNow();

      if (updatePromise === undefined) {
        throw new Error("updatePromise is undefined");
      }

      const result = await updatePromise;

      expect(result).toEqual("updated");
    });
  });

  describe("updateIfStalerThan", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it("fetches new config if the last update was longer than X ms ago", async () => {
      let reforge: Reforge | undefined;

      let updatePromise: Promise<string> | undefined;

      const initPromise = new Promise((resolveInit) => {
        updatePromise = new Promise((resolveUpdate) => {
          reforge = new Reforge({
            ...defaultOptions,
            sdkKey: validSdkKey,
            enablePolling: false,
            enableSSE: false,
            onUpdate: () => {
              resolveUpdate("updated");
            },
          });

          reforge
            .init()
            .then(() => {
              resolveInit("init");
            })
            .catch((e) => {
              console.error(e);
            });
        });
      });

      await initPromise;

      if (reforge === undefined) {
        throw new Error("reforge is undefined");
      }

      if (updatePromise === undefined) {
        throw new Error("updatePromise is undefined");
      }

      expect(reforge.updateIfStalerThan(1000)).toBeUndefined();

      // move a little into the future but not far enough to trigger an update
      jest.setSystemTime(jest.now() + 900);

      expect(reforge.updateIfStalerThan(1000)).toBeUndefined();

      // move far enough into the future to trigger an update
      jest.setSystemTime(jest.now() + 101);

      const promiseResult = reforge.updateIfStalerThan(1000);
      expect(typeof promiseResult).toEqual("object");

      // Immediately calling updateIfStalerThan again should return undefined because
      // the update is already in progress
      expect(reforge.updateIfStalerThan(1000)).toBeUndefined();

      const updateResult = await updatePromise;
      expect(updateResult).toEqual("updated");
    });

    it("works in inContext", async () => {
      let reforge: Reforge | undefined;

      let updatePromise: Promise<string> | undefined;

      const initPromise = new Promise((resolveInit) => {
        updatePromise = new Promise((resolveUpdate) => {
          reforge = new Reforge({
            ...defaultOptions,
            sdkKey: validSdkKey,
            enablePolling: false,
            enableSSE: false,
            onUpdate: () => {
              resolveUpdate("updated");
            },
          });

          reforge
            .init()
            .then(() => {
              resolveInit("init");
            })
            .catch((e) => {
              console.error(e);
            });
        });
      });

      await initPromise;

      if (reforge === undefined) {
        throw new Error("reforge is undefined");
      }

      if (updatePromise === undefined) {
        throw new Error("updatePromise is undefined");
      }

      await reforge.inContext({ user: { country: "US" } }, async (pf) => {
        expect(pf.updateIfStalerThan(1000)).toBeUndefined();

        // move a little into the future but not far enough to trigger an update
        jest.setSystemTime(jest.now() + 900);

        expect(pf.updateIfStalerThan(1000)).toBeUndefined();

        // move far enough into the future to trigger an update
        jest.setSystemTime(jest.now() + 101);

        const promiseResult = pf.updateIfStalerThan(1000);
        expect(typeof promiseResult).toEqual("object");

        // Immediately calling updateIfStalerThan again should return undefined because
        // the update is already in progress
        expect(pf.updateIfStalerThan(1000)).toBeUndefined();

        const updateResult = await updatePromise;
        expect(updateResult).toEqual("updated");
      });
    });

    it("withContext returns a resolver with the provided context", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());

      // Create a resolver with US context
      const usResolver = reforge.withContext({ user: { country: "US" } });
      expect(usResolver.get("prop.is.one.of")).toEqual("correct");

      // Create a resolver with a different context
      const otherResolver = reforge.withContext({ user: { country: "FR" } });
      expect(otherResolver.get("prop.is.one.of")).toEqual("default");

      // Original reforge remains unchanged
      expect(reforge.get("prop.is.one.of")).toEqual("default");
    });
  });

  // While the evaluation logic is best tested in evaluate.test.ts,
  // these serve as more integration-like tests for happy paths.
  describe("get", () => {
    describe("when the key cannot be found", () => {
      it("throws if no default is provided and onNoDefault is `error`", () => {
        const reforge = new Reforge({ sdkKey: irrelevant });
        reforge.setConfig([], projectEnvIdUnderTest, new Map());

        expect(() => {
          reforge.get("missing.value");
        }).toThrow("No value found for key 'missing.value'");
      });

      it("warns if no default is provided and onNoDefault is `warn`", () => {
        const reforge = new Reforge({
          sdkKey: irrelevant,
          onNoDefault: "warn",
        });
        reforge.setConfig([], projectEnvIdUnderTest, new Map());

        jest.spyOn(console, "warn").mockImplementation();

        expect(reforge.get("missing.value")).toBeUndefined();

        expect(console.warn).toHaveBeenCalledWith(
          "No value found for key 'missing.value'"
        );
      });

      it("returns undefined if no default is provided and onNoDefault is `ignore`", () => {
        const reforge = new Reforge({
          sdkKey: irrelevant,
          onNoDefault: "warn",
        });
        reforge.setConfig([], projectEnvIdUnderTest, new Map());

        jest.spyOn(console, "warn").mockImplementation();

        expect(reforge.get("missing.value")).toBeUndefined();
      });

      it("returns the default if one is provided", () => {
        const reforge = new Reforge({
          sdkKey: irrelevant,
          onNoDefault: "warn",
        });
        reforge.setConfig([], projectEnvIdUnderTest, new Map());

        const defaultValue = "default-value";

        expect(reforge.get("missing.value", new Map(), defaultValue)).toEqual(
          defaultValue
        );
      });
    });

    it("returns a config value with no rules", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());
      expect(reforge.get("basic.value")).toEqual(42);
    });

    it("returns a config value with no rules but an environment", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());
      expect(reforge.get("basic.env")).toEqual(["a", "b", "c", "d"]);
    });

    it("returns a config value for a PROP_IS_ONE_OF match", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());

      expect(reforge.get("prop.is.one.of")).toEqual("default");

      expect(
        reforge.get(
          "prop.is.one.of",
          new Map([["user", new Map([["country", "US"]])]])
        )
      ).toEqual("correct");
    });

    it("returns a config value for a PROP_IS_ONE_OF and PROP_ENDS_WITH_ONE_OF match", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());

      expect(reforge.get("prop.is.one.of.and.ends.with")).toEqual("default");

      expect(
        reforge.get(
          "prop.is.one.of.and.ends.with",
          new Map([
            [
              "user",
              new Map([
                ["country", "US"],
                ["email", "test@reforge.com"],
              ]),
            ],
          ])
        )
      ).toEqual("correct");
    });

    it("can use reforge default context as an override", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(
        configs,
        projectEnvIdUnderTest,
        new Map([["reforge", new Map([["user-id", "5"]])]])
      );

      expect(reforge.get("prop.is.one.of")).toEqual("context-override");

      expect(
        reforge.get(
          "prop.is.one.of",
          new Map([
            [
              "user",
              new Map([
                ["country", "US"],
                ["email", "test@reforge.com"],
              ]),
            ],
          ])
        )
      ).toEqual("context-override");
    });

    it("can use a Context object instead of a Context map", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());

      expect(
        reforge.get("prop.is.one.of", {
          user: { country: "US", "user-id": "5" },
        })
      ).toEqual("correct");
    });

    it("returns a decrypted secret", () => {
      const decryptionKey = generateNewHexKey();
      const clearText = "very secret stuff";

      const encrypted = encrypt(clearText, decryptionKey);

      const secret: Config = secretConfig(encrypted);

      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(
        [secret, decryptionKeyConfig(secret, decryptionKey)],
        projectEnvIdUnderTest,
        new Map()
      );

      expect(reforge.get(secret.key)).toEqual(clearText);
    });

    it("can load from a datafile", async () => {
      const reforge = new Reforge({
        sdkKey: irrelevant,
        datafile: path.resolve("./src/__tests__/fixtures/datafile.json"),
      });

      await reforge.init();

      expect(reforge.get("from.the.datafile")).toEqual("it.works");
    });

    it("can use a datafile and a run-time config", async () => {
      const reforge = new Reforge({
        sdkKey: irrelevant,
        datafile: path.resolve("./src/__tests__/fixtures/datafile.json"),
      });

      await reforge.init({ runtimeConfig: [["example", { string: "ok" }]] });

      expect(reforge.get("from.the.datafile")).toEqual("it.works");
      expect(reforge.get("example")).toEqual("ok");
    });
  });

  describe("isFeatureEnabled", () => {
    describe("when the key cannot be found", () => {
      it("throws if no default is provided and onNoDefault is `error`", () => {
        const reforge = new Reforge({ sdkKey: irrelevant });
        reforge.setConfig([], projectEnvIdUnderTest, new Map());

        expect(() => {
          reforge.isFeatureEnabled("missing.value");
        }).toThrow("No value found for key 'missing.value'");
      });

      it("returns false and warns if onNoDefault is `warn`", () => {
        const reforge = new Reforge({
          sdkKey: irrelevant,
          onNoDefault: "warn",
        });
        reforge.setConfig([], projectEnvIdUnderTest, new Map());

        jest.spyOn(console, "warn").mockImplementation();

        expect(reforge.isFeatureEnabled("missing.value")).toEqual(false);

        expect(console.warn).toHaveBeenCalledWith(
          "No value found for key 'missing.value'"
        );
      });

      it("returns false if onNoDefault is `ignore`", () => {
        const reforge = new Reforge({
          sdkKey: irrelevant,
          onNoDefault: "warn",
        });
        reforge.setConfig([], projectEnvIdUnderTest, new Map());

        jest.spyOn(console, "warn").mockImplementation();

        expect(reforge.isFeatureEnabled("missing.value")).toEqual(false);
      });
    });

    it("returns true when the flag matches", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());
      expect(reforge.isFeatureEnabled("basic.flag")).toEqual(true);
    });

    it("returns a random value for a weighted flag with no context", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());

      const results: Record<string, number> = { true: 0, false: 0 };

      nTimes(100, () => {
        const enabled = reforge.isFeatureEnabled("rollout.flag").toString();
        if (results[enabled] === undefined) {
          results[enabled] = 0;
        }
        results[enabled]++;
      });

      // The flag has a 10% chance of being true and a 90% chance of being false
      // We'll allow a margin of error.
      expect(results["true"]).toBeLessThan(30);
      expect(results["false"]).toBeGreaterThan(70);
    });

    it("returns a consistent value for a weighted flag with context", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());

      const context = (trackingId: string): Contexts =>
        new Map([["user", new Map([["trackingId", trackingId]])]]);

      nTimes(100, () => {
        expect(
          reforge.isFeatureEnabled("rollout.flag", context("100"))
        ).toEqual(false);
      });

      nTimes(100, () => {
        expect(
          reforge.isFeatureEnabled("rollout.flag", context("120"))
        ).toEqual(true);
      });
    });
  });

  describe("keys", () => {
    it("returns the keys of the known config", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());

      expect(reforge.keys()).toStrictEqual([
        "basic.value",
        "basic.flag",
        "basic.env",
        "prop.is.one.of",
        "prop.is.one.of.and.ends.with",
        "rollout.flag",
      ]);
    });
  });

  describe("raw", () => {
    it("returns a raw config", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });

      reforge.setConfig([], projectEnvIdUnderTest, new Map());

      expect(reforge.raw("basic.value")).toBeUndefined();

      reforge.setConfig(configs, projectEnvIdUnderTest, new Map());

      expect(jsonStringifyWithBigInt(reforge.raw("basic.value"))).toStrictEqual(
        '{"id":"999","project_id":-1,"key":"basic.value","rows":[{"properties":{},"values":[{"criteria":[],"value":{"int":"42"}}]}],"allowable_values":[],"config_type":"CONFIG","value_type":"INT","send_to_client_sdk":false}'
      );
    });
  });

  describe("shouldLog", () => {
    it("returns true if the resolved level is greater than or equal to the desired level", () => {
      const loggerName = "a.b.c.d";

      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(
        [levelAt(loggerName, "info")],
        projectEnvIdUnderTest,
        new Map()
      );

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Error,
        })
      ).toEqual(true);

      expect(reforge.telemetry.knownLoggers.data).toStrictEqual({
        [loggerName]: {
          [LogLevel.Error]: 1,
        },
      });
    });

    it("returns false if the resolved level is lower than the desired level", () => {
      const loggerName = "a.b.c.d";

      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(
        [levelAt(loggerName, "info")],
        projectEnvIdUnderTest,
        new Map()
      );

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Debug,
        })
      ).toEqual(false);

      expect(reforge.telemetry.knownLoggers.data).toStrictEqual({
        [loggerName]: {
          [LogLevel.Debug]: 1,
        },
      });
    });

    it("returns true if the desired level is invalid", () => {
      jest.spyOn(console, "warn").mockImplementation();
      const loggerName = "a.b.c.d";

      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig(
        [levelAt(loggerName, "trace")],
        projectEnvIdUnderTest,
        new Map()
      );

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: "invalid" as any,
        })
      ).toEqual(true);

      expect(console.warn).toHaveBeenCalledWith(
        "[reforge]: Invalid desiredLevel `invalid` provided to shouldLog. Returning `true`"
      );

      expect(reforge.telemetry.knownLoggers.data).toStrictEqual({});
    });

    it("returns the default level provided if there is no match", () => {
      jest.spyOn(console, "warn").mockImplementation();

      const loggerName = "a.b.c.d";

      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig([], projectEnvIdUnderTest, new Map());

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Debug,
          defaultLevel: LogLevel.Trace,
        })
      ).toEqual(true);

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Debug,
          defaultLevel: LogLevel.Debug,
        })
      ).toEqual(true);

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Debug,
          defaultLevel: LogLevel.Info,
        })
      ).toEqual(false);

      expect(console.warn).not.toHaveBeenCalled();

      expect(reforge.telemetry.knownLoggers.data).toStrictEqual({
        [loggerName]: {
          [LogLevel.Debug]: 3,
        },
      });
    });

    it("returns the default level provided if the resolver hasn't finalized", () => {
      const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation();
      const loggerName = "a.b.c.d";

      const reforge = new Reforge({ sdkKey: irrelevant });

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Debug,
          defaultLevel: LogLevel.Trace,
        })
      ).toEqual(true);

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Debug,
          defaultLevel: LogLevel.Debug,
        })
      ).toEqual(true);

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Debug,
          defaultLevel: LogLevel.Info,
        })
      ).toEqual(false);

      expect(mockConsoleWarn.mock.calls).toEqual([
        [
          "[reforge] Still initializing... Comparing against defaultLogLevel setting: WARN",
        ],
        [
          "[reforge] Still initializing... Comparing against defaultLogLevel setting: WARN",
        ],
        [
          "[reforge] Still initializing... Comparing against defaultLogLevel setting: WARN",
        ],
      ]);

      expect(reforge.telemetry.knownLoggers.data).toStrictEqual({
        [loggerName]: {
          [LogLevel.Debug]: 3,
        },
      });
    });

    it("does not collect telemetry if collectLoggerCounts=false", () => {
      const loggerName = "a.b.c.d";

      const reforge = new Reforge({
        sdkKey: irrelevant,
        collectLoggerCounts: false,
      });
      reforge.setConfig(
        [levelAt(loggerName, "info")],
        projectEnvIdUnderTest,
        new Map()
      );

      expect(
        reforge.shouldLog({
          loggerName,
          desiredLevel: LogLevel.Error,
        })
      ).toEqual(true);

      expect(reforge.telemetry.knownLoggers.data).toStrictEqual({});
    });
  });

  describe("logger", () => {
    it("creates a logger from a path and defaultLevel", () => {
      const spy = jest.spyOn(console, "log").mockImplementation();

      const loggerName = "a.b.c.d";

      const reforge = new Reforge({
        sdkKey: irrelevant,
        collectLoggerCounts: false,
      });

      reforge.setConfig(
        [levelAt(loggerName, "info")],
        projectEnvIdUnderTest,
        new Map()
      );

      const logger = reforge.logger(loggerName, LogLevel.Info);

      expect(logger.trace("test")).toBeUndefined();
      expect(logger.debug("test")).toBeUndefined();
      expect(logger.info("test")).toEqual("INFO  a.b.c.d: test");
      expect(logger.warn("test")).toEqual("WARN  a.b.c.d: test");
      expect(logger.error("test")).toEqual("ERROR a.b.c.d: test");
      expect(logger.fatal("test")).toEqual("FATAL a.b.c.d: test");

      expect(console.log).toHaveBeenCalledTimes(4);
      expect(spy.mock.calls).toEqual([
        ["INFO  a.b.c.d: test"],
        ["WARN  a.b.c.d: test"],
        ["ERROR a.b.c.d: test"],
        ["FATAL a.b.c.d: test"],
      ]);
    });

    it("can use the JIT context when initializing the logger", () => {
      const spy = jest.spyOn(console, "log").mockImplementation();

      const loggerName = "a.b.c.d";

      const reforge = new Reforge({
        sdkKey: irrelevant,
        collectLoggerCounts: false,
      });

      const levelAtWithRule = levelAt(loggerName, "info");

      levelAtWithRule.rows.unshift({
        properties: {},
        values: [
          {
            criteria: [
              {
                property_name: "user.country",
                operator: Criterion_CriterionOperator.PropIsOneOf,
                value_to_match: { string_list: { values: ["US"] } },
              },
            ],
            value: { log_level: LogLevel.Debug },
          },
        ],
      });

      reforge.setConfig([levelAtWithRule], projectEnvIdUnderTest, new Map());

      // we initialize outside the inContext block and provide JIT context
      const logger = reforge.logger(loggerName, LogLevel.Info, {
        user: { country: "US" },
      });

      // but evaluate inside the context
      reforge.inContext({ user: { country: "FR" } }, (pf) => {
        expect(logger.trace("test")).toBeUndefined();
        expect(logger.debug("test")).toEqual("DEBUG a.b.c.d: test");
        expect(logger.info("test")).toEqual("INFO  a.b.c.d: test");
        expect(logger.warn("test")).toEqual("WARN  a.b.c.d: test");
        expect(logger.error("test")).toEqual("ERROR a.b.c.d: test");
        expect(logger.fatal("test")).toEqual("FATAL a.b.c.d: test");

        const innerLoggerInheritedContext = pf.logger(
          loggerName,
          LogLevel.Info
        );
        expect(innerLoggerInheritedContext.trace("ilic")).toBeUndefined();
        expect(innerLoggerInheritedContext.debug("ilic")).toBeUndefined();
        expect(innerLoggerInheritedContext.info("ilic")).toEqual(
          "INFO  a.b.c.d: ilic"
        );

        const innerLoggerJITContext = reforge.logger(
          loggerName,
          LogLevel.Info,
          {
            user: { country: "US" },
          }
        );
        expect(innerLoggerJITContext.trace("iljc")).toBeUndefined();
        expect(innerLoggerJITContext.debug("iljc")).toEqual(
          "DEBUG a.b.c.d: iljc"
        );
        expect(innerLoggerJITContext.info("iljc")).toEqual(
          "INFO  a.b.c.d: iljc"
        );
      });

      expect(console.log).toHaveBeenCalledTimes(8);
      expect(spy.mock.calls).toEqual([
        ["DEBUG a.b.c.d: test"],
        ["INFO  a.b.c.d: test"],
        ["WARN  a.b.c.d: test"],
        ["ERROR a.b.c.d: test"],
        ["FATAL a.b.c.d: test"],
        ["INFO  a.b.c.d: ilic"],
        ["DEBUG a.b.c.d: iljc"],
        ["INFO  a.b.c.d: iljc"],
      ]);
    });

    it("uses the context it is initialized in by default", () => {
      const spy = jest.spyOn(console, "log").mockImplementation();

      const loggerName = "a.b.c.d";

      const reforge = new Reforge({
        sdkKey: irrelevant,
        collectLoggerCounts: false,
      });

      const levelAtWithRule = levelAt(loggerName, "info");

      levelAtWithRule.rows.unshift({
        properties: {},
        values: [
          {
            criteria: [
              {
                property_name: "user.country",
                operator: Criterion_CriterionOperator.PropIsOneOf,
                value_to_match: {
                  string_list: {
                    values: ["US"],
                  },
                },
              },
            ],
            value: {
              log_level: LogLevel.Debug,
            },
          },
        ],
      });

      reforge.setConfig([levelAtWithRule], projectEnvIdUnderTest, new Map());

      const result = reforge.inContext({ user: { country: "US" } }, (pf) => {
        // we initialize inside the context
        const logger = pf.logger(loggerName, LogLevel.Info);

        expect(logger.trace("test")).toBeUndefined();
        expect(logger.debug("test")).toEqual("DEBUG a.b.c.d: test");
        expect(logger.info("test")).toEqual("INFO  a.b.c.d: test");
        expect(logger.warn("test")).toEqual("WARN  a.b.c.d: test");
        expect(logger.error("test")).toEqual("ERROR a.b.c.d: test");
        expect(logger.fatal("test")).toEqual("FATAL a.b.c.d: test");

        // Providing a context should result in that context being used
        const jitLogger = pf.logger(loggerName, LogLevel.Info, {
          user: { country: "FR" },
        });
        expect(jitLogger.debug("jitlogger")).toBeUndefined();
        expect(jitLogger.info("jitlogger")).toEqual("INFO  a.b.c.d: jitlogger");

        return "via inContext";
      });

      expect(result).toEqual("via inContext");

      expect(console.log).toHaveBeenCalledTimes(6);
      expect(spy.mock.calls).toEqual([
        ["DEBUG a.b.c.d: test"],
        ["INFO  a.b.c.d: test"],
        ["WARN  a.b.c.d: test"],
        ["ERROR a.b.c.d: test"],
        ["FATAL a.b.c.d: test"],
        ["INFO  a.b.c.d: jitlogger"],
      ]);
    });
  });

  it("can fire onUpdate when the resolver sets config", async () => {
    const mock = jest.fn();

    const reforge = new Reforge({
      sdkKey: validSdkKey,
      collectLoggerCounts: false,
      contextUploadMode: "none",
      onUpdate: mock,
    });

    await reforge.init();

    expect(reforge.get("abc")).toEqual(true);

    while (mock.mock.calls.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect(mock).toHaveBeenCalled();
  });

  describe("set", () => {
    it("allows setting a run-time config value for a secret lookup", () => {
      const decryptionKey = generateNewHexKey();
      const clearText = "very secret stuff";

      const encrypted = encrypt(clearText, decryptionKey);

      const secret: Config = secretConfig(encrypted);

      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig([secret], projectEnvIdUnderTest, new Map());

      reforge.set("reforge.secrets.encryption.key", { string: decryptionKey });

      expect(reforge.get("reforge.secrets.encryption.key")).toStrictEqual(
        decryptionKey
      );
      expect(reforge.get(secret.key)).toEqual(clearText);
    });
  });

  describe("closing behavior", () => {
    // NOTE: for ease of running the subprocess, we use Bun here.
    // https://bun.sh/docs/installation
    it("closes the reforge when the resolver is closed", async () => {
      const testFile = path.join(__dirname, "temp-test.ts");
      const testCode = `
import { Reforge } from "../reforge";

(async () => {
  const reforge = new Reforge({
    sdkKey: "${validSdkKey}",
  });
  await reforge.init();
  const value = reforge.get("abc");
  console.log(\`ABC is \${value}\`);
  reforge.close();
})();
`;
      fs.writeFileSync(testFile, testCode);

      const startTime = Date.now();
      const subprocess = spawn("bun", ["run", testFile]);

      let output = "";
      let errorOutput = "";

      subprocess.stdout.on("data", (data: Buffer) => {
        output += data.toString();
      });

      subprocess.stderr.on("data", (data: Buffer) => {
        errorOutput += data.toString();
      });

      await new Promise<void>((resolve) => {
        subprocess.on("close", () => {
          resolve();
        });
      });

      const duration = Date.now() - startTime;
      fs.unlinkSync(testFile);

      if (errorOutput.length > 0) {
        console.error("Subprocess stderr:", errorOutput);
      }

      expect(output.trim()).toEqual("ABC is true");
      expect(duration).toBeLessThan(3000);
    });
  });

  describe("ConfigChangeNotifier integration", () => {
    let reforge: Reforge;
    beforeEach(() => {
      // No longer async
      const sdkKeyForTests =
        process.env["REFORGE_INTEGRATION_TEST_SDK_KEY"] ??
        "fallback-api-key-if-not-set";
      reforge = new Reforge({
        ...defaultOptions,
        sdkKey: sdkKeyForTests,
        enablePolling: false,
        enableSSE: false,
      });

      const minimalConfigForInit: Config = {
        id: "1",
        key: "initial.key.for.notifier.test",
        project_id: irrelevantNumber,
        config_type: ConfigType.Config,
        rows: [
          {
            properties: {},
            values: [{ criteria: [], value: { string: "initial_value" } }],
          },
        ],
        value_type: ConfigValueType.String,
        send_to_client_sdk: false,
        allowable_values: [] as ConfigValue[],
        changed_by: undefined,
      };

      const projectEnvIdForTest: ProjectEnvId = irrelevantNumber; // projectEnvId is now a Long

      reforge.setConfig([minimalConfigForInit], projectEnvIdForTest, new Map());
    });

    it("should call a listener when total config ID changes", () => {
      const listenerCallback = jest.fn();
      reforge.addConfigChangeListener(listenerCallback);

      const initialResolver = (reforge as any).resolver;
      expect(initialResolver).toBeDefined();

      const newConfig: Config = {
        id: "1001",
        key: "new.config.key",
        project_id: irrelevantNumber,
        config_type: ConfigType.Config,
        rows: [
          {
            properties: {},
            values: [{ criteria: [], value: { string: "new_value" } }],
          },
        ],
        value_type: ConfigValueType.String,
        send_to_client_sdk: true,
        allowable_values: [],
        changed_by: undefined,
      };

      initialResolver.update([newConfig]);

      expect(listenerCallback).toHaveBeenCalledTimes(1);
    });

    it("should NOT call a listener if total config ID does not change", () => {
      const listenerCallback = jest.fn();
      const existingConfig: Config = { ...basicConfig, id: "500" };
      (reforge as any)._createOrReconfigureResolver(
        [existingConfig],
        projectEnvIdUnderTest,
        new Map()
      );
      reforge.addConfigChangeListener(listenerCallback);
      const resolver = (reforge as any).resolver;

      const nonChangingConfig: Config = {
        ...basicConfig,
        id: "100",
        key: "another.key",
        rows: basicConfig.rows.map((r) => ({
          ...r,
          properties: r.properties ?? {},
          values: r.values.map((v) => ({ ...v, criteria: v.criteria ?? [] })),
        })),
        value_type: basicConfig.value_type,
      };
      resolver.update([nonChangingConfig]);
      expect(listenerCallback).not.toHaveBeenCalled();

      const nonLongIdConfig: Config = {
        ...basicConfig,
        id: "not-a-long" as any,
        key: "yet.another.key",
        rows: basicConfig.rows.map((r) => ({
          ...r,
          properties: r.properties ?? {},
          values: r.values.map((v) => ({ ...v, criteria: v.criteria ?? [] })),
        })),
        value_type: basicConfig.value_type,
      };
      resolver.update([nonLongIdConfig]);
      expect(listenerCallback).not.toHaveBeenCalled();
    });

    it("unsubscribe should prevent listener from being called", () => {
      const listenerCallback = jest.fn();
      const unsubscribe = reforge.addConfigChangeListener(listenerCallback);

      unsubscribe();

      const resolver = (reforge as any).resolver;
      const newConfig: Config = { ...basicConfig, id: "2000" };
      resolver.update([newConfig]);

      expect(listenerCallback).not.toHaveBeenCalled();
    });

    it("should notify multiple listeners", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      reforge.addConfigChangeListener(listener1);
      reforge.addConfigChangeListener(listener2);

      const resolver = (reforge as any).resolver;
      const newConfig: Config = { ...basicConfig, id: "3000" };
      resolver.update([newConfig]);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it("listener can safely get updated value from Reforge", () => {
      const targetKey = basicConfig.key;
      const initialValue = "initial_test_value";
      const updatedValueString = "updated_test_value";

      const initialConfig: Config = {
        ...basicConfig,
        id: "100",
        rows: [
          {
            properties: {},
            values: [{ criteria: [], value: { string: initialValue } }],
          },
        ],
        value_type: ConfigValueType.String,
      };
      (reforge as any)._createOrReconfigureResolver(
        [initialConfig],
        projectEnvIdUnderTest,
        new Map()
      );

      expect(reforge.get(targetKey)).toBe(initialValue);

      let valueInListener: TypedNodeServerConfigurationRaw[typeof targetKey];

      const listenerCallback = jest.fn(() => {
        valueInListener = reforge.get(targetKey);
      });

      reforge.addConfigChangeListener(listenerCallback);

      const updatedConfig: Config = {
        ...basicConfig,
        id: "200",
        rows: [
          {
            properties: {},
            values: [{ criteria: [], value: { string: updatedValueString } }],
          },
        ],
        value_type: ConfigValueType.String,
      };

      const resolver = (reforge as any).resolver;
      resolver.update([updatedConfig]);

      expect(listenerCallback).toHaveBeenCalledTimes(1);
      expect(valueInListener).toBe(updatedValueString);
    });
  });
});
