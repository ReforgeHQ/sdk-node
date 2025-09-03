import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumberAsString, irrelevantNumber } from "../testHelpers";

export const decryptionKeyForSecret = (secret: Config): string => {
  const decryptWith = secret.rows[0]?.values[0]?.value?.decryptWith;

  if (decryptWith === undefined) {
    throw new Error("decryptWith was undefined");
  }

  return decryptWith;
};

const config = (secret: Config, decryptionKey: string): Config => {
  const decryptWith = decryptionKeyForSecret(secret);

  return {
    id: irrelevantNumberAsString,
    projectId: irrelevantNumber,
    key: decryptWith,
    changedBy: undefined,
    rows: [
      {
        properties: {},
        values: [
          {
            criteria: [],
            value: {
              string: decryptionKey,
              confidential: true,
            },
          },
        ],
      },
    ],
    allowableValues: [],
    configType: ConfigType.Config,
    valueType: ConfigValueType.String,
    sendToClientSdk: false,
  };
};

export default config;
