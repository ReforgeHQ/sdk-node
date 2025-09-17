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
    return "string_list";
  }

  return "string";
};

export const wrap = (value: unknown): Record<string, ConfigValue> => {
  const type = valueType(value);

  if (Array.isArray(value)) {
    if (type !== "string_list") {
      throw new Error(`Expected string_list, got ${type}`);
    }

    const values: string[] = value.map((v) => v.toString());
    const stringList: StringList = { values };

    return {
      string_list: stringList as ConfigValue,
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
    case "string_list":
      return ConfigValueType.StringList;
    case "log_level":
      return ConfigValueType.LogLevel;
    case "int_range":
      return ConfigValueType.IntRange;
    case "json":
      return ConfigValueType.Json;
    default:
      return undefined;
  }
};
