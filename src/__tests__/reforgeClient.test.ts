import { Reforge } from "../reforge";
import { ConfigType, ConfigValueType } from "../types";
import type { Config } from "../types";
import { projectEnvIdUnderTest, irrelevant } from "./testHelpers";

const createSimpleConfig = (key: string, value: string): Config => {
  return {
    id: "1",
    projectId: 1,
    key,
    changedBy: undefined,
    rows: [
      {
        properties: {},
        values: [
          {
            criteria: [
              {
                propertyName: "user.country",
                operator: "PROP_IS_ONE_OF" as any,
                valueToMatch: {
                  stringList: {
                    values: ["US"],
                  },
                },
              },
            ],
            value: { string: value },
          },
          {
            criteria: [],
            value: { string: "default" },
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

describe("ReforgeClient", () => {
  describe("withContext", () => {
    it("returns a context-scoped client that doesn't expose internal resolver", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      const config = createSimpleConfig("test.key", "us-value");
      reforge.setConfig([config], projectEnvIdUnderTest, new Map());

      const scopedClient = reforge.withContext({ user: { country: "US" } });

      // Should have the public API methods
      expect(typeof scopedClient.get).toBe("function");
      expect(typeof scopedClient.isFeatureEnabled).toBe("function");
      expect(typeof scopedClient.logger).toBe("function");
      expect(typeof scopedClient.shouldLog).toBe("function");
      expect(typeof scopedClient.getLogLevel).toBe("function");
      expect(typeof scopedClient.withContext).toBe("function");
      expect(typeof scopedClient.inContext).toBe("function");
      expect(typeof scopedClient.updateIfStalerThan).toBe("function");
      expect(typeof scopedClient.addConfigChangeListener).toBe("function");

      // Should NOT expose internal resolver methods
      expect((scopedClient as any).raw).toBeUndefined();
      expect((scopedClient as any).set).toBeUndefined();
      expect((scopedClient as any).keys).toBeUndefined();
      expect((scopedClient as any).cloneWithContext).toBeUndefined();
      expect((scopedClient as any).update).toBeUndefined();

      // Should apply context correctly
      expect(scopedClient.get("test.key")).toBe("us-value");
    });

    it("allows chaining withContext calls", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      const config = createSimpleConfig("test.key", "us-value");
      reforge.setConfig([config], projectEnvIdUnderTest, new Map());

      const client1 = reforge.withContext({ user: { country: "FR" } });
      expect(client1.get("test.key")).toBe("default");

      const client2 = client1.withContext({ user: { country: "US" } });
      expect(client2.get("test.key")).toBe("us-value");
    });

    it("merges context when additional context is provided to methods", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      const config = createSimpleConfig("test.key", "us-value");
      reforge.setConfig([config], projectEnvIdUnderTest, new Map());

      const client = reforge.withContext({ user: { name: "Alice" } });

      // Provide additional context that includes the country
      expect(client.get("test.key", { user: { country: "US" } })).toBe(
        "us-value"
      );
    });
  });

  describe("inContext", () => {
    it("provides a context-scoped client to the callback", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      const config = createSimpleConfig("test.key", "us-value");
      reforge.setConfig([config], projectEnvIdUnderTest, new Map());

      const result = reforge.inContext(
        { user: { country: "US" } },
        (client) => {
          // Should not expose internal methods
          expect((client as any).raw).toBeUndefined();
          expect((client as any).set).toBeUndefined();

          // Should apply context
          expect(client.get("test.key")).toBe("us-value");

          return "success";
        }
      );

      expect(result).toBe("success");
    });

    it("allows nested inContext calls", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      const config = createSimpleConfig("test.key", "us-value");
      reforge.setConfig([config], projectEnvIdUnderTest, new Map());

      reforge.inContext({ user: { country: "FR" } }, (outer) => {
        expect(outer.get("test.key")).toBe("default");

        outer.inContext({ user: { country: "US" } }, (inner) => {
          expect(inner.get("test.key")).toBe("us-value");
        });
      });
    });
  });

  describe("shared state", () => {
    it("shares telemetry with parent", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig([], projectEnvIdUnderTest, new Map());

      const client = reforge.withContext({ user: { country: "US" } });

      expect(client.telemetry).toBe(reforge.telemetry);
    });

    it("delegates methods to parent reforge instance", () => {
      const reforge = new Reforge({ sdkKey: irrelevant });
      reforge.setConfig([], projectEnvIdUnderTest, new Map());

      const client = reforge.withContext({ user: { country: "US" } });

      // Telemetry is shared
      expect(client.telemetry).toBe(reforge.telemetry);

      // getLogLevel delegates to parent
      expect(typeof client.getLogLevel).toBe("function");
    });
  });
});
