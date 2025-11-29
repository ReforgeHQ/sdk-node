import { contextObjToMap, mergeContexts } from "./mergeContexts";
import type {
  Contexts,
  ContextObj,
  LogLevel,
  ReforgeInterface,
  Telemetry,
  TypedNodeServerConfigurationRaw,
} from "./types";
import type { makeLogger } from "./logger";
import type { GlobalListenerCallback } from "./configChangeNotifier";

/**
 * A context-scoped Reforge client that shares the underlying resolver
 * with its parent Reforge instance but applies a specific context to all operations.
 *
 * This allows creating request/call-scoped clients without duplicating
 * the resolver, polling, or SSE connections. All scoped clients share
 * the same parent Reforge's state.
 */
export class ReforgeClient implements ReforgeInterface {
  private readonly parent: ReforgeInterface;
  private readonly context: Contexts;

  constructor(parent: ReforgeInterface, contexts: Contexts | ContextObj) {
    this.parent = parent;
    this.context =
      contexts instanceof Map ? contexts : contextObjToMap(contexts);
  }

  get telemetry(): Telemetry | undefined {
    return this.parent.telemetry;
  }

  get<K extends keyof TypedNodeServerConfigurationRaw>(
    key: K,
    contexts?: Contexts | ContextObj,
    defaultValue?: TypedNodeServerConfigurationRaw[K]
  ): TypedNodeServerConfigurationRaw[K] {
    const mergedContexts = contexts
      ? mergeContexts(this.context, contexts)
      : this.context;
    return this.parent.get(key, mergedContexts, defaultValue);
  }

  isFeatureEnabled(key: string, contexts?: Contexts | ContextObj): boolean {
    const mergedContexts = contexts
      ? mergeContexts(this.context, contexts)
      : this.context;
    return this.parent.isFeatureEnabled(key, mergedContexts);
  }

  logger(
    loggerName: string,
    defaultLevel?: LogLevel,
    contexts?: Contexts | ContextObj
  ): ReturnType<typeof makeLogger> {
    const mergedContexts = contexts
      ? mergeContexts(this.context, contexts)
      : this.context;
    return this.parent.logger(loggerName, defaultLevel, mergedContexts);
  }

  shouldLog({
    loggerName,
    desiredLevel,
    defaultLevel,
    contexts,
  }: {
    loggerName: string;
    desiredLevel: LogLevel;
    defaultLevel?: LogLevel;
    contexts?: Contexts | ContextObj;
  }): boolean {
    const mergedContexts = contexts
      ? mergeContexts(this.context, contexts)
      : this.context;
    return this.parent.shouldLog({
      loggerName,
      desiredLevel,
      defaultLevel,
      contexts: mergedContexts,
    });
  }

  getLogLevel(loggerName: string): LogLevel {
    return this.parent.getLogLevel(loggerName);
  }

  updateIfStalerThan(durationInMs: number): Promise<void> | undefined {
    return this.parent.updateIfStalerThan(durationInMs);
  }

  withContext(contexts: Contexts | ContextObj): ReforgeInterface {
    const mergedContexts = mergeContexts(this.context, contexts);
    return new ReforgeClient(this.parent, mergedContexts);
  }

  inContext<T>(
    contexts: Contexts | ContextObj,
    func: (reforge: ReforgeInterface) => T
  ): T {
    const mergedContexts = mergeContexts(this.context, contexts);
    return func(new ReforgeClient(this.parent, mergedContexts));
  }

  addConfigChangeListener(callback: GlobalListenerCallback): () => void {
    return this.parent.addConfigChangeListener(callback);
  }
}
