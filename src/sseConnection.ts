import { makeHeaders } from "./makeHeaders";
import type { Resolver } from "./resolver";
import EventSource from "eventsource";
import { parseConfigsFromJSONString } from "./jsonHelpers";

interface ConstructorProps {
  apiKey: string;
  sources: string[];
}

class SSEConnection {
  private readonly apiKey: string;
  private readonly sources: string[];
  private channel?: EventSource;

  constructor({ apiKey, sources }: ConstructorProps) {
    this.apiKey = apiKey;
    this.sources = sources;
  }

  start(resolver: Resolver, startAtId: string): void {
    const headers = makeHeaders(this.apiKey, {
      "Last-Event-ID": startAtId.toString(),
      Accept: "text/event-stream",
    });

    const url = `${(this.sources[0] as string).replace(
      /(belt|suspenders)\./,
      "stream."
    )}/api/v1/sse/config?format=json`;

    this.channel = new EventSource(url, { headers });

    this.channel.onmessage = (message: any) => {
      const newConfigs = parseConfigsFromJSONString(message.data);

      resolver.update(newConfigs.configs);
    };
  }

  close(): void {
    if (this.channel !== undefined && this.channel != null) {
      this.channel.close();
      this.channel = undefined;
    }
  }
}

export { SSEConnection };
