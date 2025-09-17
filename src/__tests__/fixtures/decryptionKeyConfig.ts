import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumberAsString, irrelevantNumber } from "../testHelpers";

export const decryptionKeyForSecret = (secret: Config): string => {
  const decryptWith = secret.rows[0]?.values[0]?.value?.decrypt_with;

  if (decryptWith === undefined) {
    throw new Error("decryptWith was undefined");
  }

  return decryptWith;
};

const config = (secret: Config, decryptionKey: string): Config => {
  const decryptWith = decryptionKeyForSecret(secret);

  return {
    id: irrelevantNumberAsString,
    project_id: irrelevantNumber,
    key: decryptWith,
    changed_by: undefined,
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
    allowable_values: [],
    config_type: ConfigType.Config,
    value_type: ConfigValueType.String,
    send_to_client_sdk: false,
  };
};

export default config;
