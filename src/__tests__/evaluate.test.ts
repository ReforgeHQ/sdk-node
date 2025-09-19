import basicConfig from "./fixtures/basicConfig";
import basicLogLevel from "./fixtures/basicLogLevel";
import envConfig from "./fixtures/envConfig";
import propDoesNotEndWithOneOf from "./fixtures/propDoesNotEndWithOneOf";
import propEndsWithOneOf from "./fixtures/propEndsWithOneOf";
import propIsNotOneOf from "./fixtures/propIsNotOneOf";
import propIsOneOf from "./fixtures/propIsOneOf";
import propIsOneOfAndEndsWith from "./fixtures/propIsOneOfAndEndsWith";
import rolloutFlag from "./fixtures/rolloutFlag";
import mkTimedLogLevel from "./fixtures/timedLogLevel";
import { Resolver } from "../resolver";
import type { EvaluateArgs } from "../evaluate";
import { evaluate } from "../evaluate";
import { emptyContexts, projectEnvIdUnderTest } from "./testHelpers";
import { encrypt, generateNewHexKey } from "../../src/encryption";
import secretConfig from "./fixtures/secretConfig";
import secretKeyConfig from "./fixtures/secretKeyConfig";
import decryptionKeyConfig, {
  decryptionKeyForSecret,
} from "./fixtures/decryptionKeyConfig";
import {
  type Config,
  type Contexts,
  ConfigValueType,
  ConfigType,
  Criterion_CriterionOperator,
  LogLevel,
} from "../types";
import { makeConfidential } from "../unwrap";
import { contextObjToMap } from "../mergeContexts";
import propStartsWithOneOf from "./fixtures/propStartsWithOneOf";
import propDoesNotStartWithOneOf from "./fixtures/propDoesNotStartWithOneOf";
import propContainsOneOf from "./fixtures/propContainsOneOf";
import propDoesNotContainOneOf from "./fixtures/propDoesNotContainOneOf";
import {
  configAfterWithInt as propAfterWithMillis,
  configAfterWithString as propAfterWithString,
  configBeforeWithInt as propBeforeWithMillis,
  configBeforeWithString as propBeforeWithString,
  epochMillis as propBeforeAfterEpochMillis,
} from "./fixtures/propBeforeAfter";

import {
  configGreaterThanDouble as propGreaterThanDouble,
  configGreaterThanEqualDouble as propGreaterThanEqualDouble,
  configGreaterThanEqualInt as propGreaterThanEqualInt,
  configGreaterThanInt as propGreaterThanInt,
  configLessThanDouble as propLessThanDouble,
  configLessThanEqualDouble as propLessThanEqualDouble,
  configLessThanEqualInt as propLessThanEqualInt,
  configLessThanInt as propLessThanInt,
} from "./fixtures/propNumericComparison";

import { createConfig as createRegexConfig } from "./fixtures/propRegexMatches";
import { createConfig as createSemverConfig } from "./fixtures/propSemverMatches";

import { stringify } from "ts-jest";

const noNamespace = undefined;

// the Resolver is only used to back-reference Segments (which we test in the integration tests) and get secret keys so we can use a stand-in here.
const simpleResolver = new Resolver(
  [secretKeyConfig],
  projectEnvIdUnderTest,
  noNamespace,
  "error",
  () => undefined
);

const usContexts = new Map([
  [
    "user",
    new Map([
      ["trackingId", "abc"],
      ["country", "US"],
    ]),
  ],
]);
const ukContexts = new Map([
  [
    "user",
    new Map([
      ["trackingId", "123"],
      ["country", "UK"],
    ]),
  ],
]);
const frContexts = new Map([["user", new Map([["country", "FR"]])]]);

const reforgeEmailContexts = new Map([
  ["user", new Map([["email", "@reforge.com"]])],
]);
const exampleEmailContexts = new Map([
  ["user", new Map([["email", "@example.com"]])],
]);
const hotmailEmailContexts = new Map([
  ["user", new Map([["email", "@hotmail.com"]])],
]);

const akaStartsWithOneContext = new Map([
  ["user", new Map([["aka", "one too many"]])],
]);

const akaStartsWithFourContext = new Map([
  ["user", new Map([["aka", "four too many"]])],
]);

const akaContainsOneContext = new Map([
  ["user", new Map([["aka", "the one to watch"]])],
]);

const akaContainsFourContext = new Map([
  ["user", new Map([["aka", "the four to watch"]])],
]);

const secretContexts = contextObjToMap({
  user: { trackingId: "SECRET" },
});
const confidentialContexts = contextObjToMap({
  user: { trackingId: "CONFIDENTIAL" },
});

describe("evaluate", () => {
  it("returns an evaluation with no rules", () => {
    expect(
      evaluate({
        config: basicConfig,
        projectEnvId: projectEnvIdUnderTest,
        namespace: noNamespace,
        contexts: emptyContexts,
        resolver: simpleResolver,
      })
    ).toStrictEqual({
      configId: basicConfig.id,
      configKey: basicConfig.key,
      configType: basicConfig.config_type,
      valueType: ConfigValueType.Int,
      configRowIndex: 0,
      unwrappedValue: 42,
      reportableValue: undefined,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });
  });

  it("returns a config logLevel value with no rules", () => {
    expect(
      evaluate({
        config: basicLogLevel,
        projectEnvId: projectEnvIdUnderTest,
        namespace: noNamespace,
        contexts: emptyContexts,
        resolver: simpleResolver,
      })
    ).toStrictEqual({
      configId: basicLogLevel.id,
      configKey: basicLogLevel.key,
      configType: basicLogLevel.config_type,
      valueType: ConfigValueType.LogLevel,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      unwrappedValue: LogLevel.Info,
      reportableValue: undefined,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation with no rules but an environment", () => {
    expect(
      evaluate({
        config: envConfig,
        projectEnvId: projectEnvIdUnderTest,
        namespace: noNamespace,
        contexts: emptyContexts,
        resolver: simpleResolver,
      })
    ).toStrictEqual({
      configId: envConfig.id,
      configKey: envConfig.key,
      configType: envConfig.config_type,
      valueType: ConfigValueType.StringList,
      configRowIndex: 0,
      unwrappedValue: ["a", "b", "c", "d"],
      reportableValue: undefined,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a rollout", () => {
    const args = (contexts: Contexts): EvaluateArgs => ({
      config: rolloutFlag,
      namespace: undefined,
      projectEnvId: projectEnvIdUnderTest,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(ukContexts))).toStrictEqual({
      configId: rolloutFlag.id,
      configKey: rolloutFlag.key,
      conditionalValueIndex: 0,
      configRowIndex: 0,
      configType: ConfigType.FeatureFlag,
      valueType: rolloutFlag.value_type,
      unwrappedValue: true,
      reportableValue: undefined,
      weightedValueIndex: 1,
    });

    expect(evaluate(args(usContexts))).toStrictEqual({
      configId: rolloutFlag.id,
      configKey: rolloutFlag.key,
      conditionalValueIndex: 0,
      configRowIndex: 0,
      configType: ConfigType.FeatureFlag,
      valueType: rolloutFlag.value_type,
      unwrappedValue: false,
      reportableValue: undefined,
      weightedValueIndex: 0,
    });
  });

  it("returns an evaluation for a PROP_IS_ONE_OF match", () => {
    const args = (contexts: Contexts): EvaluateArgs => ({
      config: propIsOneOf,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: propIsOneOf.id,
      configKey: propIsOneOf.key,
      configType: propIsOneOf.config_type,
      valueType: propIsOneOf.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 4,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(usContexts))).toStrictEqual({
      configId: propIsOneOf.id,
      configKey: propIsOneOf.key,
      configType: propIsOneOf.config_type,
      valueType: propIsOneOf.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(ukContexts))).toStrictEqual({
      configId: propIsOneOf.id,
      configKey: propIsOneOf.key,
      configType: propIsOneOf.config_type,
      valueType: propIsOneOf.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(frContexts))).toStrictEqual({
      configId: propIsOneOf.id,
      configKey: propIsOneOf.key,
      configType: propIsOneOf.config_type,
      valueType: propIsOneOf.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 4,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(secretContexts))).toStrictEqual({
      configId: propIsOneOf.id,
      configKey: propIsOneOf.key,
      configType: propIsOneOf.config_type,
      valueType: propIsOneOf.value_type,
      unwrappedValue: "some-secret",
      reportableValue: "*****cda9e",
      configRowIndex: 0,
      conditionalValueIndex: 3,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(confidentialContexts))).toStrictEqual({
      configId: propIsOneOf.id,
      configKey: propIsOneOf.key,
      configType: propIsOneOf.config_type,
      valueType: propIsOneOf.value_type,
      unwrappedValue: "For British Eyes Only",
      reportableValue: "*****b9002",
      configRowIndex: 0,
      conditionalValueIndex: 2,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a PROP_IS_NOT_ONE_OF match", () => {
    const args = (contexts: Contexts): EvaluateArgs => ({
      config: propIsNotOneOf,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: propIsNotOneOf.id,
      configKey: propIsNotOneOf.key,
      configType: propIsNotOneOf.config_type,
      valueType: propIsNotOneOf.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(usContexts))).toStrictEqual({
      configId: propIsNotOneOf.id,
      configKey: propIsNotOneOf.key,
      configType: propIsNotOneOf.config_type,
      valueType: propIsNotOneOf.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(ukContexts))).toStrictEqual({
      configId: propIsNotOneOf.id,
      configKey: propIsNotOneOf.key,
      configType: propIsNotOneOf.config_type,
      valueType: propIsNotOneOf.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(frContexts))).toStrictEqual({
      configId: propIsNotOneOf.id,
      configKey: propIsNotOneOf.key,
      configType: propIsNotOneOf.config_type,
      valueType: propIsNotOneOf.value_type,
      configRowIndex: 0,
      unwrappedValue: "correct",
      reportableValue: undefined,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a PROP_ENDS_WITH_ONE_OF match", () => {
    const args = (contexts: Contexts): EvaluateArgs => ({
      config: propEndsWithOneOf,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: propEndsWithOneOf.id,
      configKey: propEndsWithOneOf.key,
      configType: propEndsWithOneOf.config_type,
      valueType: propEndsWithOneOf.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(reforgeEmailContexts))).toStrictEqual({
      configId: propEndsWithOneOf.id,
      configKey: propEndsWithOneOf.key,
      configType: propEndsWithOneOf.config_type,
      valueType: propEndsWithOneOf.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(exampleEmailContexts))).toStrictEqual({
      configId: propEndsWithOneOf.id,
      configKey: propEndsWithOneOf.key,
      configType: propEndsWithOneOf.config_type,
      valueType: propEndsWithOneOf.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(hotmailEmailContexts))).toStrictEqual({
      configId: propEndsWithOneOf.id,
      configKey: propEndsWithOneOf.key,
      configType: propEndsWithOneOf.config_type,
      valueType: propEndsWithOneOf.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a PROP_DOES_NOT_END_WITH_ONE_OF match", () => {
    const args = (contexts: Contexts): EvaluateArgs => ({
      config: propDoesNotEndWithOneOf,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: propDoesNotEndWithOneOf.id,
      configKey: propDoesNotEndWithOneOf.key,
      configType: propDoesNotEndWithOneOf.config_type,
      valueType: propDoesNotEndWithOneOf.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(reforgeEmailContexts))).toStrictEqual({
      configId: propDoesNotEndWithOneOf.id,
      configKey: propDoesNotEndWithOneOf.key,
      configType: propDoesNotEndWithOneOf.config_type,
      valueType: propDoesNotEndWithOneOf.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(exampleEmailContexts))).toStrictEqual({
      configId: propDoesNotEndWithOneOf.id,
      configKey: propDoesNotEndWithOneOf.key,
      configType: propDoesNotEndWithOneOf.config_type,
      valueType: propDoesNotEndWithOneOf.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(hotmailEmailContexts))).toStrictEqual({
      configId: propDoesNotEndWithOneOf.id,
      configKey: propDoesNotEndWithOneOf.key,
      configType: propDoesNotEndWithOneOf.config_type,
      valueType: propDoesNotEndWithOneOf.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a PROP_STARTS_WITH_ONE_OF match", () => {
    const prop = propStartsWithOneOf;

    const args = (contexts: Contexts): EvaluateArgs => ({
      config: prop,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(akaStartsWithOneContext))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(akaStartsWithFourContext))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a PROP_DOES_NOT_START_WITH_ONE_OF match", () => {
    const prop = propDoesNotStartWithOneOf;

    const args = (contexts: Contexts): EvaluateArgs => ({
      config: prop,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(akaStartsWithFourContext))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(akaStartsWithOneContext))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a PROP_CONTAINS_ONE_OF match", () => {
    const prop = propContainsOneOf;

    const args = (contexts: Contexts): EvaluateArgs => ({
      config: prop,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(akaContainsOneContext))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(akaContainsFourContext))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a PROP_DOES_NOT_CONTAIN_ONE_OF match", () => {
    const prop = propDoesNotContainOneOf;

    const args = (contexts: Contexts): EvaluateArgs => ({
      config: prop,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(akaContainsFourContext))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(akaContainsOneContext))).toStrictEqual({
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a PROP_IS_ONE_OF and PROP_ENDS_WITH_ONE_OF match", () => {
    const args = (contexts: Contexts): EvaluateArgs => ({
      config: propIsOneOfAndEndsWith,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: propIsOneOfAndEndsWith.id,
      configKey: propIsOneOfAndEndsWith.key,
      configType: propIsOneOfAndEndsWith.config_type,
      valueType: propIsOneOfAndEndsWith.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(usContexts))).toStrictEqual({
      configId: propIsOneOfAndEndsWith.id,
      configKey: propIsOneOfAndEndsWith.key,
      configType: propIsOneOfAndEndsWith.config_type,
      valueType: propIsOneOfAndEndsWith.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(reforgeEmailContexts))).toStrictEqual({
      configId: propIsOneOfAndEndsWith.id,
      configKey: propIsOneOfAndEndsWith.key,
      configType: propIsOneOfAndEndsWith.config_type,
      valueType: propIsOneOfAndEndsWith.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    const frReforgeContexts = new Map([
      [
        "user",
        new Map([
          ["country", "FR"],
          ["email", "test@reforge.com"],
        ]),
      ],
    ]);
    expect(evaluate(args(frReforgeContexts))).toStrictEqual({
      configId: propIsOneOfAndEndsWith.id,
      configKey: propIsOneOfAndEndsWith.key,
      configType: propIsOneOfAndEndsWith.config_type,
      valueType: propIsOneOfAndEndsWith.value_type,
      unwrappedValue: "default",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    });

    const usReforgeContexts = new Map([
      [
        "user",
        new Map([
          ["country", "US"],
          ["email", "test@reforge.com"],
        ]),
      ],
    ]);
    expect(evaluate(args(usReforgeContexts))).toStrictEqual({
      configId: propIsOneOfAndEndsWith.id,
      configKey: propIsOneOfAndEndsWith.key,
      configType: propIsOneOfAndEndsWith.config_type,
      valueType: propIsOneOfAndEndsWith.value_type,
      unwrappedValue: "correct",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });
  });

  it("returns an evaluation for a secret when the key is found", () => {
    const decryptionKey = generateNewHexKey();
    const clearText = "very secret stuff";

    const encrypted = encrypt(clearText, decryptionKey);

    const secret: Config = secretConfig(encrypted);

    const decryptionConfig = decryptionKeyConfig(secret, decryptionKey);

    const resolver = new Resolver(
      [decryptionConfig],
      projectEnvIdUnderTest,
      noNamespace,
      "error",
      () => undefined
    );

    expect(
      evaluate({
        config: secret,
        projectEnvId: projectEnvIdUnderTest,
        namespace: noNamespace,
        contexts: emptyContexts,
        resolver,
      })
    ).toStrictEqual({
      configId: secret.id,
      configKey: secret.key,
      configType: secret.config_type,
      valueType: secret.value_type,
      reportableValue: makeConfidential(encrypted),
      configRowIndex: 0,
      unwrappedValue: clearText,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });
  });

  it("can return an evaluation for a timed log level", () => {
    const timedLogLevel = mkTimedLogLevel(0, 1000);

    expect(
      evaluate({
        config: timedLogLevel,
        projectEnvId: projectEnvIdUnderTest,
        namespace: noNamespace,
        contexts: emptyContexts,
        resolver: simpleResolver,
      })
    ).toStrictEqual({
      configId: timedLogLevel.id,
      configKey: timedLogLevel.key,
      configType: timedLogLevel.config_type,
      valueType: timedLogLevel.value_type,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      unwrappedValue: LogLevel.Info,
      reportableValue: undefined,
      weightedValueIndex: undefined,
    });

    const currentTimedLogLevel = mkTimedLogLevel(
      +new Date(),
      +new Date() + 1000
    );

    expect(
      evaluate({
        config: currentTimedLogLevel,
        projectEnvId: projectEnvIdUnderTest,
        namespace: noNamespace,
        contexts: emptyContexts,
        resolver: simpleResolver,
      })
    ).toStrictEqual({
      configId: currentTimedLogLevel.id,
      configKey: currentTimedLogLevel.key,
      configType: currentTimedLogLevel.config_type,
      valueType: currentTimedLogLevel.value_type,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      unwrappedValue: LogLevel.Debug,
      reportableValue: undefined,
      weightedValueIndex: undefined,
    });
  });

  it("throws for a secret when the key cannot be found", () => {
    const decryptionKey = generateNewHexKey();
    const clearText = "very secret stuff";

    const encrypted = encrypt(clearText, decryptionKey);

    const secret: Config = secretConfig(encrypted);

    const emptyResolver = new Resolver(
      [],
      projectEnvIdUnderTest,
      noNamespace,
      "error",
      () => undefined
    );

    expect(() => {
      evaluate({
        config: secret,
        projectEnvId: projectEnvIdUnderTest,
        namespace: noNamespace,
        contexts: emptyContexts,
        resolver: emptyResolver,
      });
    }).toThrowError(
      `No value found for key '${decryptionKeyForSecret(secret)}'`
    );
  });

  it("returns an evaluation for an ALWAYS_TRUE match", () => {
    const alwaysTrueConfig: Config = {
      id: "always-true-test",
      project_id: projectEnvIdUnderTest,
      key: "always.true.test",
      changed_by: undefined,
      rows: [
        {
          properties: {},
          project_env_id: projectEnvIdUnderTest,
          values: [
            {
              criteria: [
                {
                  property_name: "irrelevant.property",
                  operator: Criterion_CriterionOperator.AlwaysTrue,
                  value_to_match: undefined,
                },
              ],
              value: {
                string: "always-true-result",
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
      allowable_values: [],
      config_type: ConfigType.Config,
      value_type: ConfigValueType.String,
      send_to_client_sdk: false,
    };

    const args = (contexts: Contexts): EvaluateArgs => ({
      config: alwaysTrueConfig,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    expect(evaluate(args(emptyContexts))).toStrictEqual({
      configId: alwaysTrueConfig.id,
      configKey: alwaysTrueConfig.key,
      configType: alwaysTrueConfig.config_type,
      valueType: alwaysTrueConfig.value_type,
      unwrappedValue: "always-true-result",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });

    expect(evaluate(args(usContexts))).toStrictEqual({
      configId: alwaysTrueConfig.id,
      configKey: alwaysTrueConfig.key,
      configType: alwaysTrueConfig.config_type,
      valueType: alwaysTrueConfig.value_type,
      unwrappedValue: "always-true-result",
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    });
  });
});

describe.each([
  { description: "int value", config: propBeforeWithMillis },
  { description: "string value", config: propBeforeWithString },
])(
  "returns an evaluation for a PROP_BEFORE date match ($description)",
  ({ config }) => {
    const prop = config;
    const millis = propBeforeAfterEpochMillis;

    const args = (contexts: Contexts): EvaluateArgs => ({
      config: prop,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    test("returns false for empty context", () => {
      expect(evaluate(args(emptyContexts))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: false,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 1,
        weightedValueIndex: undefined,
      });
    });

    test(`returns true for context with date (millis) before`, () => {
      const birthdateNumericBefore = new Map([
        ["user", new Map([["createdAt", millis - 1000]])],
      ]);

      expect(evaluate(args(birthdateNumericBefore))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: true,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 0,
        weightedValueIndex: undefined,
      });
    });

    test("returns true for context with date (string) before", () => {
      const birthdateTextBefore = new Map([
        ["user", new Map([["createdAt", "2025-01-30T21:39:41Z"]])],
      ]);

      expect(evaluate(args(birthdateTextBefore))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: true,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 0,
        weightedValueIndex: undefined,
      });
    });

    test("returns false for context with date (millis) before", () => {
      const birthdateNumericAfter = new Map([
        ["user", new Map([["createdAt", millis + 1000]])],
      ]);

      expect(evaluate(args(birthdateNumericAfter))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: false,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 1,
        weightedValueIndex: undefined,
      });
    });

    test("returns false for context with date (string) before", () => {
      const birthdateTextAfter = new Map([
        ["user", new Map([["createdAt", "2025-02-01T21:39:41Z"]])],
      ]);

      expect(evaluate(args(birthdateTextAfter))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: false,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 1,
        weightedValueIndex: undefined,
      });
    });
  }
);

describe.each([
  { description: "int value", config: propAfterWithMillis },
  { description: "string value", config: propAfterWithString },
])(
  "returns an evaluation for a PROP_AFTER date match ($description)",
  ({ config }) => {
    const prop = config;
    const millis = propBeforeAfterEpochMillis;

    const args = (contexts: Contexts): EvaluateArgs => ({
      config: prop,
      projectEnvId: projectEnvIdUnderTest,
      namespace: noNamespace,
      contexts,
      resolver: simpleResolver,
    });

    test(`returns false for empty context`, () => {
      expect(evaluate(args(emptyContexts))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: false,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 1,
        weightedValueIndex: undefined,
      });
    });

    test(`returns false for context with date (millis) BEFORE`, () => {
      const birthdateNumericBefore = new Map([
        ["user", new Map([["createdAt", millis - 1000]])],
      ]);

      expect(evaluate(args(birthdateNumericBefore))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: false,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 1,
        weightedValueIndex: undefined,
      });
    });

    test(`returns false for context with date (string) BEFORE`, () => {
      const birthdateTextBefore = new Map([
        ["user", new Map([["createdAt", "2025-01-30T21:39:41Z"]])],
      ]);

      expect(evaluate(args(birthdateTextBefore))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: false,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 1,
        weightedValueIndex: undefined,
      });
    });

    test(`returns true for context with date (millis) AFTER`, () => {
      const birthdateNumericAfter = new Map([
        ["user", new Map([["createdAt", millis + 1000]])],
      ]);

      expect(evaluate(args(birthdateNumericAfter))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: true,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 0,
        weightedValueIndex: undefined,
      });
    });

    test(`returns true for context with date (string) AFTER`, () => {
      const birthdateTextAfter = new Map([
        ["user", new Map([["createdAt", "2025-02-01T21:39:41Z"]])],
      ]);

      expect(evaluate(args(birthdateTextAfter))).toStrictEqual({
        configId: prop.id,
        configKey: prop.key,
        configType: prop.config_type,
        valueType: prop.value_type,
        unwrappedValue: true,
        reportableValue: undefined,
        configRowIndex: 0,
        conditionalValueIndex: 0,
        weightedValueIndex: undefined,
      });
    });
  }
);

describe("Numeric operator tests", () => {
  const falseValueFunc = (prop: Config): object => {
    return {
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: false,
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    };
  };

  const trueValueFunc = (prop: Config): object => {
    return {
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: true,
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    };
  };

  const argBuilder = (contexts: Contexts, prop: Config): EvaluateArgs => ({
    config: prop,
    projectEnvId: projectEnvIdUnderTest,
    namespace: noNamespace,
    contexts,
    resolver: simpleResolver,
  });

  // empty context tests
  describe.each<{ description: string; config: Config }>([
    {
      description: "less than is always false for empty context",
      config: propLessThanInt,
    },
    {
      description: "less than is always false for empty context",
      config: propLessThanDouble,
    },
    {
      description: "less than equal to is always false for empty context",
      config: propLessThanEqualInt,
    },
    {
      description: "less than equal to is always false for empty context",
      config: propLessThanEqualDouble,
    },
    {
      description: "greater than is always false for empty context",
      config: propGreaterThanInt,
    },
    {
      description: "greater than is always false for empty context",
      config: propGreaterThanDouble,
    },
    {
      description: "greater than equal to is always false for empty context",
      config: propGreaterThanEqualInt,
    },
    {
      description: "greater than equal to is always false for empty context",
      config: propGreaterThanEqualDouble,
    },
  ])("$description", ({ description, config }) => {
    test(`${description} (${config.key})`, () => {
      const theArgs = argBuilder(emptyContexts, config);
      const expectedMatchValue = falseValueFunc(config);

      expect(evaluate(theArgs)).toStrictEqual(expectedMatchValue);
    });
  });

  // bad type context tests
  describe.each<{ description: string; config: Config }>([
    {
      description: "less than is always false for string context value",
      config: propLessThanInt,
    },
    {
      description: "less than is always false for string context value",
      config: propLessThanDouble,
    },
    {
      description:
        "less than equal to is always false for string context value",
      config: propLessThanEqualInt,
    },
    {
      description:
        "less than equal to is always false for string context value",
      config: propLessThanEqualDouble,
    },
    {
      description: "greater than is always false for string context value",
      config: propGreaterThanInt,
    },
    {
      description: "greater than is always false for string context value",
      config: propGreaterThanDouble,
    },
    {
      description:
        "greater than equal to is always false for string context value",
      config: propGreaterThanEqualInt,
    },
    {
      description:
        "greater than equal to is always false for string context value",
      config: propGreaterThanEqualDouble,
    },
  ])("$description", ({ description, config }) => {
    test(`${description} (${config.key})`, () => {
      const context = new Map([
        ["organization", new Map([["memberCount", "not a number!"]])],
      ]);

      const theArgs = argBuilder(context, config);
      const expectedMatchValue = falseValueFunc(config);

      expect(evaluate(theArgs)).toStrictEqual(expectedMatchValue);
    });
  });

  describe.each<{
    description: string;
    configs: Config[];
    contextValue: number;
    expectedResult: boolean;
  }>([
    {
      description: "less than produces correct results",
      configs: [propLessThanInt, propLessThanDouble],
      contextValue: 0,
      expectedResult: true,
    },
    {
      description: "less than produces correct results",
      configs: [propLessThanInt, propLessThanDouble],
      contextValue: 0.0,
      expectedResult: true,
    },
    {
      description: "less than produces correct results",
      configs: [propLessThanInt, propLessThanDouble],
      contextValue: 100,
      expectedResult: false,
    },
    {
      description: "less than produces correct results",
      configs: [propLessThanInt, propLessThanDouble],
      contextValue: 100.0,
      expectedResult: false,
    },
    {
      description: "less than produces correct results",
      configs: [propLessThanInt, propLessThanDouble],
      contextValue: 200,
      expectedResult: false,
    },
    {
      description: "less than produces correct results",
      configs: [propLessThanInt, propLessThanDouble],
      contextValue: 200.0,
      expectedResult: false,
    },
    {
      description: "less than or equal produces correct results",
      configs: [propLessThanEqualInt, propLessThanEqualDouble],
      contextValue: 0,
      expectedResult: true,
    },
    {
      description: "less than or equal produces correct results",
      configs: [propLessThanEqualInt, propLessThanEqualDouble],
      contextValue: 0.0,
      expectedResult: true,
    },
    {
      description: "less than or equal produces correct results",
      configs: [propLessThanEqualInt, propLessThanEqualDouble],
      contextValue: 100,
      expectedResult: true,
    },
    {
      description: "less than or equal produces correct results",
      configs: [propLessThanEqualInt, propLessThanEqualDouble],
      contextValue: 100.0,
      expectedResult: true,
    },
    {
      description: "less than or equal produces correct results",
      configs: [propLessThanEqualInt, propLessThanEqualDouble],
      contextValue: 200,
      expectedResult: false,
    },
    {
      description: "less than or equal correct results",
      configs: [propLessThanEqualInt, propLessThanEqualDouble],
      contextValue: 200.0,
      expectedResult: false,
    },
    {
      description: "greater than produces correct results",
      configs: [propGreaterThanInt, propGreaterThanDouble],
      contextValue: 0,
      expectedResult: false,
    },
    {
      description: "greater than produces correct results",
      configs: [propGreaterThanInt, propGreaterThanDouble],
      contextValue: 0.0,
      expectedResult: false,
    },
    {
      description: "greater than produces correct results",
      configs: [propGreaterThanInt, propGreaterThanDouble],
      contextValue: 100,
      expectedResult: false,
    },
    {
      description: "greater than produces correct results",
      configs: [propGreaterThanInt, propGreaterThanDouble],
      contextValue: 100.0,
      expectedResult: false,
    },
    {
      description: "greater than produces correct results",
      configs: [propGreaterThanInt, propGreaterThanDouble],
      contextValue: 200,
      expectedResult: true,
    },
    {
      description: "greater than produces correct results",
      configs: [propGreaterThanInt, propGreaterThanDouble],
      contextValue: 200.0,
      expectedResult: true,
    },
    {
      description: "greater than or equal produces correct results",
      configs: [propGreaterThanEqualInt, propGreaterThanEqualDouble],
      contextValue: 0,
      expectedResult: false,
    },
    {
      description: "greater than or equal produces correct results",
      configs: [propGreaterThanEqualInt, propGreaterThanEqualDouble],
      contextValue: 0.0,
      expectedResult: false,
    },
    {
      description: "greater than or equal produces correct results",
      configs: [propGreaterThanEqualInt, propGreaterThanEqualDouble],
      contextValue: 100,
      expectedResult: true,
    },
    {
      description: "greater than or equal produces correct results",
      configs: [propGreaterThanEqualInt, propGreaterThanEqualDouble],
      contextValue: 100.0,
      expectedResult: true,
    },
    {
      description: "greater than or equal produces correct results",
      configs: [propGreaterThanEqualInt, propGreaterThanEqualDouble],
      contextValue: 200,
      expectedResult: true,
    },
    {
      description: "greater than or equal produces correct results",
      configs: [propGreaterThanEqualInt, propGreaterThanEqualDouble],
      contextValue: 200.0,
      expectedResult: true,
    },
  ])(
    "$description",
    ({ description, configs, contextValue, expectedResult }) => {
      for (const config of configs) {
        test(`${description} (${config.key}) (${stringify(
          contextValue
        )})`, () => {
          const context = new Map([
            ["organization", new Map([["memberCount", contextValue]])],
          ]);
          const theArgs = argBuilder(context, config);
          const expectedMatchValue = expectedResult
            ? trueValueFunc(config)
            : falseValueFunc(config);
          expect(evaluate(theArgs)).toStrictEqual(expectedMatchValue);
        });
      }
    }
  );
});

describe("regex tests", () => {
  const argBuilder = (contexts: Contexts, prop: Config): EvaluateArgs => ({
    config: prop,
    projectEnvId: projectEnvIdUnderTest,
    namespace: noNamespace,
    contexts,
    resolver: simpleResolver,
  });

  const falseValueFunc = (prop: Config): object => {
    return {
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: false,
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    };
  };

  const trueValueFunc = (prop: Config): object => {
    return {
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: true,
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    };
  };
  const propertyName = "user.name";
  const patternOne = "a+b+";
  const badPattern = "[a+b+";

  const configMatches = createRegexConfig(
    "prop.matches",
    propertyName,
    patternOne,
    Criterion_CriterionOperator.PropMatches
  );
  const configMatchesNot = createRegexConfig(
    "prop.matchesNot",
    propertyName,
    patternOne,
    Criterion_CriterionOperator.PropDoesNotMatch
  );
  const configMatchesBadPattern = createRegexConfig(
    "prop.matchesBadPattern",
    propertyName,
    badPattern,
    Criterion_CriterionOperator.PropMatches
  );
  const configMatchesNotBadPattern = createRegexConfig(
    "prop.matchesNOtBadPattern",
    propertyName,
    badPattern,
    Criterion_CriterionOperator.PropDoesNotMatch
  );

  describe.each<{
    description: string;
    config: Config;
    contextValue: any;
    expectedResult: boolean;
  }>([
    {
      description: "match returns true when pattern matches",
      config: configMatches,
      contextValue: "ab",
      expectedResult: true,
    },
    {
      description: "match returns false when pattern does not match",
      config: configMatches,
      contextValue: "a",
      expectedResult: false,
    },
    {
      description: "does not match returns true when pattern does not match",
      config: configMatchesNot,
      contextValue: "a",
      expectedResult: true,
    },
    {
      description: "does not match returns false when pattern matches",
      config: configMatchesNot,
      contextValue: "ab",
      expectedResult: false,
    },
    {
      description: "match returns false when pattern does not compile",
      config: configMatchesBadPattern,
      contextValue: "a",
      expectedResult: false,
    },
    {
      description: "does not match returns false when pattern does not compile",
      config: configMatchesNotBadPattern,
      contextValue: "ab",
      expectedResult: false,
    },
    {
      description: "match returns false when context value is not a string",
      config: configMatches,
      contextValue: 100,
      expectedResult: false,
    },
    {
      description: "does not match returns false context value is not a string",
      config: configMatchesNot,
      contextValue: 100,
      expectedResult: false,
    },
  ])(
    "$description",
    ({ description, config, contextValue, expectedResult }) => {
      test(`${description} (${config.key}) (${stringify(
        contextValue
      )})`, () => {
        const context = new Map([["user", new Map([["name", contextValue]])]]);
        const theArgs = argBuilder(context, config);
        const expectedMatchValue = expectedResult
          ? trueValueFunc(config)
          : falseValueFunc(config);
        expect(evaluate(theArgs)).toStrictEqual(expectedMatchValue);
      });
    }
  );
});

describe("semantic version tests", () => {
  const argBuilder = (contexts: Contexts, prop: Config): EvaluateArgs => ({
    config: prop,
    projectEnvId: projectEnvIdUnderTest,
    namespace: noNamespace,
    contexts,
    resolver: simpleResolver,
  });

  const falseValueFunc = (prop: Config): object => {
    return {
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: false,
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 1,
      weightedValueIndex: undefined,
    };
  };

  const trueValueFunc = (prop: Config): object => {
    return {
      configId: prop.id,
      configKey: prop.key,
      configType: prop.config_type,
      valueType: prop.value_type,
      unwrappedValue: true,
      reportableValue: undefined,
      configRowIndex: 0,
      conditionalValueIndex: 0,
      weightedValueIndex: undefined,
    };
  };
  const propertyName = "client.version";
  const configLessThan = createSemverConfig(
    "prop.semVerLessThan",
    propertyName,
    "2.1.0",
    Criterion_CriterionOperator.PropSemverLessThan
  );
  const configEqualTo = createSemverConfig(
    "prop.semVerEqual",
    propertyName,
    "2.1.0",
    Criterion_CriterionOperator.PropSemverEqual
  );
  const configGreaterThan = createSemverConfig(
    "prop.semVerGreaterThan",
    propertyName,
    "2.1.0",
    Criterion_CriterionOperator.PropSemverGreaterThan
  );
  const configNotLegitSemver = createSemverConfig(
    "prop.semVerLessThan",
    propertyName,
    "what am i doing here",
    Criterion_CriterionOperator.PropSemverLessThan
  );

  describe.each<{
    description: string;
    config: Config;
    contextValue: string;
    expectedResult: boolean;
  }>([
    {
      description:
        "less than returns true when semver in context is less than config",
      config: configLessThan,
      contextValue: "1.2.0",
      expectedResult: true,
    },
    {
      description:
        "less than returns false when semver in context is greater than config",
      config: configLessThan,
      contextValue: "3.2.0",
      expectedResult: false,
    },
    {
      description:
        "equal to returns true when semver in context is equal to config",
      config: configEqualTo,
      contextValue: "2.1.0",
      expectedResult: true,
    },
    {
      description:
        "equal to returns false when semver in context is not equal to config",
      config: configEqualTo,
      contextValue: "2.0.0",
      expectedResult: false,
    },
    {
      description:
        "greater than returns true when semver in context is greater than config",
      config: configGreaterThan,
      contextValue: "2.2.0",
      expectedResult: true,
    },
    {
      description:
        "greater than returns false when semver in context is less than config",
      config: configGreaterThan,
      contextValue: "1.2.0",
      expectedResult: false,
    },
    {
      description:
        "greater than returns false when semver in config is not a semver",
      config: configNotLegitSemver,
      contextValue: "1.2.0",
      expectedResult: false,
    },
    {
      description:
        "less than returns false when semver in config is not a semver",
      config: configLessThan,
      contextValue: "not a semver",
      expectedResult: false,
    },
  ])(
    "$description",
    ({ description, config, contextValue, expectedResult }) => {
      test(`${description} (${config.key}) (${stringify(
        contextValue
      )})`, () => {
        const context = new Map([
          ["client", new Map([["version", contextValue]])],
        ]);
        const theArgs = argBuilder(context, config);
        const expectedMatchValue = expectedResult
          ? trueValueFunc(config)
          : falseValueFunc(config);
        expect(evaluate(theArgs)).toStrictEqual(expectedMatchValue);
      });
    }
  );
});
