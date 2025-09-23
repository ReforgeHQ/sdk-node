import type { ConfigValue, StringList } from "./types";
import { ConfigValueType } from "./types";

type ConfigValueKey = keyof ConfigValue;

export const valueType = (value: unknown): ConfigValueKey => {
  if (Number.isInteger(value)) {
    return "int";
  }

  if (typeof value === "number") {
    return "double";
  }

  if (typeof value === "boolean") {
    return "bool";
  }

  if (Array.isArray(value)) {
    return "stringList";
  }

  return "string";
};

export const wrap = (value: unknown): Record<string, ConfigValue> => {
  const type = valueType(value);

  if (Array.isArray(value)) {
    if (type !== "stringList") {
      throw new Error(`Expected stringList, got ${type}`);
    }

    const values: string[] = value.map((v) => v.toString());
    const stringList: StringList = { values };

    return {
      stringList: stringList as ConfigValue,
    };
  }

  return {
    [valueType(value)]: value as ConfigValue,
  };
};

export const configValueType = (
  value: ConfigValue
): ConfigValueType | undefined => {
  switch (Object.keys(value)[0]) {
    case "string":
      return ConfigValueType.String;
    case "int":
      return ConfigValueType.Int;
    case "double":
      return ConfigValueType.Double;
    case "bool":
      return ConfigValueType.Bool;
    case "stringList":
      return ConfigValueType.StringList;
    case "logLevel":
      return ConfigValueType.LogLevel;
    case "intRange":
      return ConfigValueType.IntRange;
    case "json":
      return ConfigValueType.Json;
    default:
      return undefined;
  }
};
