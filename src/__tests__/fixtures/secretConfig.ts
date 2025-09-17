import type { Config } from "../../types";
import { ConfigValueType, ConfigType } from "../../types";
import { irrelevantNumber } from "../testHelpers";

const config = (encryptedValue: string): Config => ({
  id: "51",
  project_id: irrelevantNumber,
  key: "secret.config",
  changed_by: undefined,
  rows: [
    {
      properties: {},
      values: [
        {
          criteria: [],
          value: {
            string: encryptedValue,
            confidential: true,
            decrypt_with: "reforge.secrets.encryption.key",
          },
        },
      ],
    },
  ],
  allowable_values: [],
  config_type: ConfigType.Config,
  value_type: ConfigValueType.String,
  send_to_client_sdk: false,
});

export default config;
