import type { Contexts, MapContext, ContextObj } from "./types";

export const contextObjToMap = (obj: ContextObj): Contexts => {
  const outerMap: Contexts = new Map<string, MapContext>();

  for (const [outerKey, innerObj] of Object.entries(obj)) {
    const innerMap: MapContext = new Map<string, unknown>();
    for (const [innerKey, innerValue] of Object.entries(innerObj)) {
      innerMap.set(innerKey, innerValue);
    }

    outerMap.set(outerKey, innerMap);
  }

  return outerMap;
};

export const mergeContexts = (
  parent: Contexts | undefined,
  local: Contexts | ContextObj
): Contexts => {
  const localContext = local instanceof Map ? local : contextObjToMap(local);

  if (parent === undefined) {
    return localContext;
  }

  const merged = new Map(parent);
  for (const [key, value] of localContext) {
    merged.set(key, value);
  }

  return merged;
};
