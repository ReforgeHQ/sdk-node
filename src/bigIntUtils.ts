export const jsonStringifyWithBigInt = (value: unknown): string => {
  return JSON.stringify(value, (_key, val) => {
    if (typeof val === "bigint") {
      return val.toString();
    }

    return val;
  });
};

export const isBigInt = (value: unknown): value is bigint => {
  if (typeof value === "bigint") return true;
  if (Number.isInteger(value)) return true;

  try {
    // @ts-expect-error We are catching here because BigInt throws an error if the value is not a valid bigint
    BigInt(value);
    return true;
  } catch {
    return false;
  }
};

export const maxBigIntId = (ids: string[]): string => {
  const result = ids.reduce((max, id) => {
    let bigIntId: bigint = BigInt(0);

    try {
      bigIntId = BigInt(id);
    } catch {
      // do nothing
    }

    if (bigIntId > max) {
      return bigIntId;
    }

    return max;
  }, BigInt(0));

  return result.toString();
};
