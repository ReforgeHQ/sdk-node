import { createHash } from "crypto";
import {
  ConfigValueType,
  type ConfigValue,
  type Provided,
  ProvidedSource,
  type WeightedValue,
  type HashByPropertyValue,
} from "./types";
import { isNonNullable } from "./types";
import type { MinimumConfig, Resolver } from "./resolver";
import { decrypt } from "./encryption";
import { durationToMilliseconds } from "./duration";

import murmurhash from "murmurhash";
import { isBigInt, jsonStringifyWithBigInt } from "./bigIntUtils";

const CONFIDENTIAL_PREFIX = "*****";

export const makeConfidential = (secret: string): string => {
  const md5 = createHash("md5").update(secret).digest("hex");

  return `${CONFIDENTIAL_PREFIX}${md5.slice(-5)}`;
};

export type GetValue =
  | string
  | number
  | bigint
  | boolean
  | string[]
  | object
  | undefined;

type WeightedValueIndex = number;

interface UnwrappedValue {
  value: GetValue;
  index?: WeightedValueIndex;
  reportableValue?: GetValue;
}

export const NULL_UNWRAPPED_VALUE: UnwrappedValue = {
  value: undefined,
  reportableValue: undefined,
};

const kindOf = (
  config: MinimumConfig | undefined,
  value: ConfigValue
): keyof ConfigValue | undefined => {
  const kind: keyof ConfigValue | undefined =
    configValueTypeToString(config?.value_type) ??
    (Object.keys(value)[0] as keyof ConfigValue);
  return kind;
};

const userPercent = (key: string, hashByPropertyValue: string): number => {
  return murmurhash.v3(`${key}${hashByPropertyValue}`) / 4_294_967_294.0;
};

const variantIndex = (
  percentThroughDistribution: number,
  weights: WeightedValue[]
): number => {
  const distributionSpace = weights.reduce((sum, v) => sum + v.weight, 0);
  const bucket = distributionSpace * percentThroughDistribution;

  let sum = 0;
  for (const [index, variantWeight] of weights.entries()) {
    if (bucket < sum + variantWeight.weight) {
      return index;
    }

    sum += variantWeight.weight;
  }

  // In the event that all weights are zero, return the last variant
  return weights.length - 1;
};

const unwrapWeightedValues = (
  key: string,
  value: ConfigValue,
  hashByPropertyValue: HashByPropertyValue
): UnwrappedValue => {
  const values = value.weighted_values?.weighted_values;

  if (values === undefined) {
    console.warn(`Unexpected value ${jsonStringifyWithBigInt(value)}`);
    return NULL_UNWRAPPED_VALUE;
  }

  const percent =
    hashByPropertyValue !== undefined
      ? userPercent(key, hashByPropertyValue)
      : Math.random();

  const index = variantIndex(percent, values);

  const underlyingValue = unwrap({
    key,
    value: values[index]?.value,
    hashByPropertyValue,
  });

  return {
    value: underlyingValue.value,
    reportableValue: underlyingValue.reportableValue,
    index,
  };
};

const providedValue = (
  config: MinimumConfig,
  provided: Provided | undefined
): GetValue => {
  if (provided == null) {
    return undefined;
  }

  if (
    provided.source === ProvidedSource.EnvVar &&
    provided.lookup !== undefined
  ) {
    const envVar = process.env[provided.lookup];

    if (envVar === undefined) {
      throw new Error(`Environment variable ${provided.lookup} not found`);
    }

    return coerceIntoType(config, envVar);
  }

  return undefined;
};

export const TRUE_VALUES = new Set(["true", "1", "t", "yes"]);

export const configValueTypeToString = (
  valueType: ConfigValueType | undefined
): keyof ConfigValue | undefined => {
  switch (valueType) {
    case ConfigValueType.String:
      return "string";
    case ConfigValueType.Int:
      return "int";
    case ConfigValueType.Double:
      return "double";
    case ConfigValueType.Bool:
      return "bool";
    case ConfigValueType.StringList:
      return "string_list";
    case ConfigValueType.LogLevel:
      return "log_level";
    case ConfigValueType.IntRange:
      return "int_range";
    case ConfigValueType.Duration:
      return "duration";
    case ConfigValueType.Json:
      return "json";
    default:
      return undefined;
  }
};

const coerceIntoType = (config: MinimumConfig, value: string): GetValue => {
  switch (config.value_type) {
    case ConfigValueType.String:
      return value;
    case ConfigValueType.Int:
      if (!Number.isInteger(parseInt(value, 10))) {
        throw new Error(`Expected integer, got ${value}`);
      }
      return parseInt(value, 10);
    case ConfigValueType.Double:
      return parseFloat(value);
    case ConfigValueType.Bool:
      return TRUE_VALUES.has(value.toLowerCase());
    case ConfigValueType.StringList:
      return value.split(/\s*,\s*/);
    case ConfigValueType.Duration:
      return value;
    default:
      console.error(
        `Unexpected valueType ${config.value_type} for provided ${config.key}`
      );
      return undefined;
  }
};

export const unwrapValue = ({
  key,
  kind,
  value,
  hashByPropertyValue,
  primitivesOnly,
  config,
  resolver,
}: {
  key: string;
  kind: keyof ConfigValue;
  value: ConfigValue;
  hashByPropertyValue: HashByPropertyValue;
  primitivesOnly: boolean;
  config?: MinimumConfig;
  resolver?: Resolver;
}): Omit<UnwrappedValue, "reportableValue"> => {
  if (primitivesOnly) {
    if (isNonNullable(value.provided) || isNonNullable(value.decrypt_with)) {
      console.error(
        `Unexpected value ${jsonStringifyWithBigInt(
          value
        )} in primitivesOnly mode`
      );
      return NULL_UNWRAPPED_VALUE;
    }
  } else {
    if (isNonNullable(value.decrypt_with)) {
      if (resolver === undefined) {
        throw new Error("Resolver must be provided to unwrap encrypted values");
      }

      const key = resolver.get(value.decrypt_with);

      if (key === undefined) {
        throw new Error(`Key ${value.decrypt_with} not found`);
      }

      return {
        value: decrypt(value[kind] as string, key as string),
      };
    }

    if (value.provided != null) {
      if (config == null) {
        throw new Error(
          `Unexpected value ${jsonStringifyWithBigInt(
            value
          )} in provided mode without config`
        );
      }

      return { value: providedValue(config, value.provided) };
    }
  }

  if (value.weighted_values != null) {
    return unwrapWeightedValues(key, value, hashByPropertyValue);
  }

  switch (kind) {
    case "string":
      return { value: value.string };
    case "string_list":
      return { value: value.string_list?.values };
    case "int":
      if (Number.isInteger(Number(value.int))) {
        const val = Number(value.int) as unknown as number;
        return { value: val };
      }

      if (isBigInt(value.int)) {
        return { value: BigInt(value.int) };
      }

      return { value: undefined };
    case "bool":
      return { value: value.bool };
    case "double":
      return { value: value.double };
    case "log_level":
      return { value: value.log_level };
    case "json":
      if (value.json?.json === undefined) {
        throw new Error(`Invalid json value for ${key}`);
      }

      return { value: JSON.parse(value.json.json) };
    case "duration":
      if (value.duration?.definition === undefined) {
        throw new Error(`No duration definition found for ${key}`);
      }

      return {
        value: durationToMilliseconds(value.duration.definition),
      };
    default:
      throw new Error(
        `Unexpected value ${jsonStringifyWithBigInt(
          value
        )} | kind=${jsonStringifyWithBigInt(kind)}`
      );
  }
};

export const unwrap = ({
  key,
  value,
  hashByPropertyValue,
  primitivesOnly = false,
  config,
  resolver,
}: {
  key: string;
  value: ConfigValue | undefined;
  hashByPropertyValue?: HashByPropertyValue;
  primitivesOnly?: boolean;
  config?: MinimumConfig;
  resolver?: Resolver;
}): UnwrappedValue => {
  if (value === undefined) {
    return NULL_UNWRAPPED_VALUE;
  }

  const kind = kindOf(config, value);

  if (kind === undefined) {
    throw new Error(`Unexpected value ${jsonStringifyWithBigInt(value)}`);
  }

  const unwrappedValue = unwrapValue({
    kind,
    key,
    value,
    hashByPropertyValue,
    primitivesOnly,
    config,
    resolver,
  });

  const shouldObscure: boolean =
    value.confidential === true || isNonNullable(value.decrypt_with);

  return {
    ...unwrappedValue,
    reportableValue: shouldObscure
      ? makeConfidential((value[kind] as string).toString())
      : undefined,
  };
};

export const unwrapPrimitive = (
  key: string,
  value: ConfigValue | undefined
): UnwrappedValue => {
  return unwrap({ key, value, primitivesOnly: true });
};
