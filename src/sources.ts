import { jsonStringifyWithBigInt } from "./bigIntUtils";

const DEFAULT_SOURCES = [
  "https://primary.reforge.com",
  "https://secondary.reforge.com",
];

class Sources {
  readonly sources: string[];
  readonly telemetrySource: string | undefined;
  readonly sseSources: string[];
  readonly configSources: string[];

  constructor(sources?: string[]) {
    this.sources = sources ?? DEFAULT_SOURCES;

    // trim any trailing slashes
    this.sources = this.sources.map((source) =>
      source.endsWith("/") ? source.slice(0, -1) : source
    );

    this.telemetrySource = this.sources
      .filter(
        (source) =>
          source.startsWith("https://") &&
          (source.includes("primary.") ||
            source.includes("secondary.") ||
            source.includes("api."))
      )
      .map((source) =>
        source.replace(/(primary|secondary|api)\./, "telemetry.")
      )[0];

    if (this.telemetrySource === undefined) {
      console.debug(
        `No telemetry source found in sources. No telemetry will be reported. Sources were ${jsonStringifyWithBigInt(
          this.sources
        )}`
      );
    }

    this.sseSources = this.sources;
    this.configSources = this.sources;
  }

  isEmpty(): boolean {
    return this.sources.length === 0;
  }
}

export { Sources, DEFAULT_SOURCES };
