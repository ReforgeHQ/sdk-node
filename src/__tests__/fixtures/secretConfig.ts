import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config = (encryptedValue: string): Config => ({
  id: "51",
  projectId: irrelevantNumber,
  key: "secret.config",
  changedBy: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            string: encryptedValue,
            confidential: true,
            decryptWith: "reforge.secrets.encryption.key",
          },
        },
      ],
    },
  ],
  allowableValues: [],
  configType: ConfigType.Config,
  valueType: ConfigValueType.String,
  sendToClientSdk: false,
});

export default config;
