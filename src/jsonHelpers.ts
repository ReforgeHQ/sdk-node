import camelCase from "lodash.camelcase";
import type { Configs } from "./types";

export function parseConfigsFromJSONString(jsonString: string): Configs {
  const json = JSON.parse(jsonString);
  return json as Configs;
}

export function parseConfigsFromObject(json: unknown): Configs {
  return json as Configs;
}

export function isObject(val: unknown): val is Record<PropertyKey, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

export function keysToCamel(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map(keysToCamel);
  }

  if (isObject(input)) {
    return Object.fromEntries(
      Object.entries(input).map(([k, v]) => [camelCase(k), keysToCamel(v)])
    );
  }

  return input;
}
