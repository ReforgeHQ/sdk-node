import {
  type ConditionalValue,
  type ConfigRow,
  type ConfigType,
  type ConfigValue,
  type ConfigValueType,
  type Criterion,
  Criterion_CriterionOperator,
  type Contexts,
  type HashByPropertyValue,
  type ProjectEnvId,
} from "./types";
import type { MinimumConfig, Resolver } from "./resolver";

import { type GetValue, unwrap } from "./unwrap";
import { contextLookup } from "./contextLookup";
import { sortRows } from "./sortRows";
import SemanticVersion from "./semanticversion";
import { isBigInt, jsonStringifyWithBigInt } from "./bigIntUtils";

const getHashByPropertyValue = (
  value: ConfigValue | undefined,
  contexts: Contexts
): HashByPropertyValue => {
  if (value?.weighted_values === undefined || value?.weighted_values === null) {
    return undefined;
  }

  return contextLookup(
    contexts,
    value.weighted_values.hash_by_property_name
  )?.toString();
};

const getArrayifiedContextValue = (
  contexts: any,
  criterion: { property_name: string }
): string[] => {
  const result = contextLookup(contexts, criterion.property_name);

  if (Array.isArray(result)) {
    return result.map((item) => item.toString());
  } else {
    return [result?.toString() ?? ""];
  }
};

const propIsOneOf = (criterion: Criterion, contexts: Contexts): boolean => {
  const contextValue: string[] = getArrayifiedContextValue(contexts, criterion);

  return (criterion?.value_to_match?.string_list?.values ?? []).some(
    (value) => {
      return contextValue.includes(value.toString());
    }
  );
};

const propMatchesOneOf = (
  criterion: Criterion,
  contexts: Contexts,
  matcher: (contextValue: string, value: string) => boolean
): boolean => {
  return (criterion.value_to_match?.string_list?.values ?? []).some((value) => {
    const contextValue = contextLookup(
      contexts,
      criterion.property_name
    )?.toString();
    // Explicitly check for non-null and non-empty contextValue
    return (
      contextValue != null &&
      contextValue !== "" &&
      matcher(contextValue, value.toString())
    );
  });
};

const propEndsWithOneOf = (
  criterion: Criterion,
  contexts: Contexts
): boolean => {
  return propMatchesOneOf(criterion, contexts, (contextValue, value) =>
    contextValue.endsWith(value)
  );
};

const propStartsWithOneOf = (
  criterion: Criterion,
  contexts: Contexts
): boolean => {
  return propMatchesOneOf(criterion, contexts, (contextValue, value) =>
    contextValue.startsWith(value)
  );
};

const propContainsOneOf = (
  criterion: Criterion,
  contexts: Contexts
): boolean => {
  return propMatchesOneOf(criterion, contexts, (contextValue, value) =>
    contextValue.includes(value)
  );
};

const inSegment = (
  criterion: Criterion,
  contexts: Contexts,
  resolver: Resolver
): boolean => {
  const segmentKey = criterion.value_to_match?.string;

  if (segmentKey === undefined) {
    return false;
  }

  if (resolver.raw(segmentKey) === undefined) {
    console.warn(`Segment ${segmentKey} not found`);
    return false;
  }

  const segment = resolver.get(segmentKey, contexts);

  if (typeof segment !== "boolean") {
    console.warn(
      `Segment ${segmentKey} is of unexpected type ${typeof segment}`
    );
    return false;
  }

  return segment;
};

const inIntRange = (criterion: Criterion, contexts: Contexts): boolean => {
  const start = criterion.value_to_match?.int_range?.start;
  const end = criterion.value_to_match?.int_range?.end;

  const comparable = contextLookup(contexts, criterion.property_name);

  if (start === undefined || end === undefined || comparable === undefined) {
    return false;
  }

  return start <= (comparable as number) && end >= (comparable as number);
};

const dateValueToBigInt = (
  value: number | bigint | string | unknown
): bigint | undefined => {
  if (typeof value === "bigint") {
    return value;
  } else if (typeof value === "number") {
    return BigInt(value); // Already in millis
  } else if (typeof value === "string") {
    const parsedDate = Date.parse(value); // Convert to millis
    if (isNaN(parsedDate)) {
      return undefined;
    }
    return BigInt(parsedDate);
  }
  return undefined;
};

const evaluateRegexCriterion = (
  criterion: Criterion,
  contexts: Contexts,
  reverseIt: boolean
): boolean => {
  const testValue = contextLookup(contexts, criterion.property_name);
  const pattern = criterion.value_to_match?.string;

  if (!(typeof testValue === "string" && typeof pattern === "string")) {
    return false;
  }
  try {
    const regex = new RegExp(pattern, "");
    const matches = regex.test(testValue);
    return reverseIt ? !matches : matches;
  } catch (error) {}
  return false;
};

const evaluateSemverCriterion = (
  criterion: Criterion,
  contexts: Contexts,
  comparisonFn: (compareResult: number) => boolean
): boolean => {
  const leftSide = contextLookup(contexts, criterion.property_name);
  const rightSide = criterion.value_to_match?.string;

  if (!(typeof leftSide === "string" && typeof rightSide === "string")) {
    return false;
  }

  try {
    const leftSideSemVer = SemanticVersion.parse(leftSide);
    const rightSideSemVer = SemanticVersion.parse(rightSide);
    return comparisonFn(leftSideSemVer.compare(rightSideSemVer));
  } catch (e) {}
  return false;
};

const evaluateNumericCriterion = (
  criterion: Criterion,
  contexts: Contexts,
  comparisonFn: (compareResult: number) => boolean
): boolean => {
  const contextValue = normalizeNumber(
    contextLookup(contexts, criterion.property_name)
  );
  const configValue = normalizeNumber(
    unwrap({ key: "ignored", value: criterion.value_to_match }).value
  );

  if (configValue == null || contextValue == null) {
    return false;
  }
  const compareToResult = compareTo(contextValue, configValue);
  return comparisonFn(compareToResult);
};

function normalizeNumber(value: unknown): bigint | number | null {
  if (typeof value === "bigint") return BigInt(value);
  if (typeof value === "number") return value;

  return null; // Invalid type
}

function compareTo(left: number | bigint, right: number | bigint): number {
  const leftNum = isBigInt(left) ? BigInt(left) : left;
  const rightNum = isBigInt(right) ? BigInt(right) : right;

  // If either value is a float, use direct number comparison
  if (!Number.isInteger(leftNum) || !Number.isInteger(rightNum)) {
    if (leftNum < rightNum) {
      return -1;
    } else if (leftNum > rightNum) {
      return 1;
    } else {
      return 0;
    }
  }

  // Both are integers, safe to compare as Longs
  if (isBigInt(left) || isBigInt(right)) {
    if (BigInt(left) < BigInt(right)) {
      return -1;
    } else if (BigInt(left) > BigInt(right)) {
      return 1;
    } else {
      return 0;
    }
  }

  if (leftNum < rightNum) {
    return -1;
  } else if (leftNum > rightNum) {
    return 1;
  } else {
    return 0;
  }
}

const evaluateDateCriterion = (
  criterion: Criterion,
  contexts: Contexts,
  comparator: (a: bigint, b: bigint) => boolean
): boolean => {
  // Retrieve the context value (which might be a timestamp in millis or an HTTP date string)
  const contextMillis = dateValueToBigInt(
    contextLookup(contexts, criterion.property_name)
  );
  const configMills = dateValueToBigInt(
    unwrap({ key: "why", value: criterion.value_to_match }).value
  );
  if (
    typeof configMills === "undefined" ||
    typeof contextMillis === "undefined"
  ) {
    return false;
  }
  return comparator(contextMillis, configMills);
};

const allCriteriaMatch = (
  value: ConditionalValue,
  namespace: string | undefined,
  contexts: Contexts,
  resolver: Resolver
): boolean => {
  if (value.criteria === undefined) {
    return true;
  }

  return value.criteria.every((criterion) => {
    switch (criterion.operator) {
      case Criterion_CriterionOperator.HierarchicalMatch:
        return criterion.value_to_match?.string === namespace;
      case Criterion_CriterionOperator.PropIsOneOf:
        return propIsOneOf(criterion, contexts);
      case Criterion_CriterionOperator.PropIsNotOneOf:
        return !propIsOneOf(criterion, contexts);
      case Criterion_CriterionOperator.PropEndsWithOneOf:
        return propEndsWithOneOf(criterion, contexts);
      case Criterion_CriterionOperator.PropDoesNotEndWithOneOf:
        return !propEndsWithOneOf(criterion, contexts);
      case Criterion_CriterionOperator.PropStartsWithOneOf:
        return propStartsWithOneOf(criterion, contexts);
      case Criterion_CriterionOperator.PropDoesNotStartWithOneOf:
        return !propStartsWithOneOf(criterion, contexts);
      case Criterion_CriterionOperator.PropContainsOneOf:
        return propContainsOneOf(criterion, contexts);
      case Criterion_CriterionOperator.PropDoesNotContainOneOf:
        return !propContainsOneOf(criterion, contexts);
      case Criterion_CriterionOperator.InSeg:
        return inSegment(criterion, contexts, resolver);
      case Criterion_CriterionOperator.NotInSeg:
        return !inSegment(criterion, contexts, resolver);
      case Criterion_CriterionOperator.InIntRange:
        return inIntRange(criterion, contexts);
      case Criterion_CriterionOperator.PropBefore:
        return evaluateDateCriterion(criterion, contexts, (a, b) => a < b);
      case Criterion_CriterionOperator.PropAfter:
        return evaluateDateCriterion(criterion, contexts, (a, b) => a > b);
      case Criterion_CriterionOperator.PropGreaterThan:
        return evaluateNumericCriterion(
          criterion,
          contexts,
          (compareResult) => compareResult > 0
        );
      case Criterion_CriterionOperator.PropGreaterThanOrEqual:
        return evaluateNumericCriterion(
          criterion,
          contexts,
          (compareResult) => compareResult >= 0
        );
      case Criterion_CriterionOperator.PropLessThan:
        return evaluateNumericCriterion(
          criterion,
          contexts,
          (compareResult) => compareResult < 0
        );
      case Criterion_CriterionOperator.PropLessThanOrEqual:
        return evaluateNumericCriterion(
          criterion,
          contexts,
          (compareResult) => compareResult <= 0
        );

      case Criterion_CriterionOperator.PropMatches:
        return evaluateRegexCriterion(criterion, contexts, false);
      case Criterion_CriterionOperator.PropDoesNotMatch:
        return evaluateRegexCriterion(criterion, contexts, true);
      case Criterion_CriterionOperator.PropSemverLessThan:
        return evaluateSemverCriterion(
          criterion,
          contexts,
          (compareResult) => compareResult < 0
        );
      case Criterion_CriterionOperator.PropSemverEqual:
        return evaluateSemverCriterion(
          criterion,
          contexts,
          (compareResult) => compareResult === 0
        );
      case Criterion_CriterionOperator.PropSemverGreaterThan:
        return evaluateSemverCriterion(
          criterion,
          contexts,
          (compareResult) => compareResult > 0
        );
      case Criterion_CriterionOperator.AlwaysTrue:
        return true;
      default:
        throw new Error(
          `Unexpected criteria ${jsonStringifyWithBigInt(criterion.operator)}`
        );
    }
  });
};

const matchingConfigValue = (
  rows: ConfigRow[],
  projectEnvId: ProjectEnvId,
  namespace: string | undefined,
  contexts: Contexts,
  resolver: Resolver
): [number, number, ConfigValue | undefined] => {
  let match: ConfigValue | undefined;
  let conditionalValueIndex: number = -1;
  let configRowIndex: number = -1;

  sortRows(rows, projectEnvId).forEach((row, rIndex) => {
    if (match !== undefined) {
      return;
    }

    if (rows.values === undefined) {
      return;
    }

    match = row.values.find((value: any, vIndex) => {
      conditionalValueIndex = vIndex;
      return allCriteriaMatch(value, namespace, contexts, resolver);
    })?.value;

    if (match !== undefined) {
      configRowIndex = rIndex;
    }
  });

  return [conditionalValueIndex, configRowIndex, match];
};

export interface EvaluateArgs {
  config: MinimumConfig;
  projectEnvId: ProjectEnvId;
  namespace: string | undefined;
  contexts: Contexts;
  resolver: Resolver;
}

export interface Evaluation {
  configId: string | undefined;
  configKey: string;
  configType: ConfigType;
  valueType: ConfigValueType;
  unwrappedValue: GetValue;
  reportableValue: GetValue;
  conditionalValueIndex: number;
  configRowIndex: number;
  weightedValueIndex?: number;
}

export const evaluate = ({
  config,
  projectEnvId,
  namespace,
  contexts,
  resolver,
}: EvaluateArgs): Evaluation => {
  const [conditionalValueIndex, configRowIndex, selectedValue] =
    matchingConfigValue(
      config.rows,
      projectEnvId,
      namespace,
      contexts ?? new Map(),
      resolver
    );

  const {
    value: unwrappedValue,
    reportableValue,
    index: weightedValueIndex,
  } = unwrap({
    key: config.key,
    config,
    value: selectedValue,
    hashByPropertyValue: getHashByPropertyValue(selectedValue, contexts),
    resolver,
  });

  return {
    configKey: config.key,
    configId: config.id,
    configType: config.config_type,
    valueType: config.value_type,
    conditionalValueIndex,
    configRowIndex,
    unwrappedValue,
    weightedValueIndex,
    reportableValue,
  };
};
